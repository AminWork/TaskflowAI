package websocket

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"kanban-backend/internal/models"
)

// RocketChatHub manages WebSocket connections for Rocket.Chat functionality
type RocketChatHub struct {
	clients    map[*RocketChatClient]bool
	broadcast  chan []byte
	register   chan *RocketChatClient
	unregister chan *RocketChatClient
	db         *gorm.DB
}

// RocketChatClient represents a WebSocket client connection
type RocketChatClient struct {
	hub        *RocketChatHub
	conn       *websocket.Conn
	send       chan []byte
	userID     uint
	username   string
	rooms      map[string]bool // subscribed rooms
	lastPing   time.Time
}

// RocketChatMessage represents a real-time message
type RocketChatMessage struct {
	Msg    string      `json:"msg"`
	ID     string      `json:"id,omitempty"`
	Method string      `json:"method,omitempty"`
	Params []interface{} `json:"params,omitempty"`
	Result interface{} `json:"result,omitempty"`
	Error  *struct {
		Error   int    `json:"error"`
		Reason  string `json:"reason"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
	Collection string      `json:"collection,omitempty"`
	Fields     interface{} `json:"fields,omitempty"`
}

// NewRocketChatHub creates a new Rocket.Chat WebSocket hub
func NewRocketChatHub(db *gorm.DB) *RocketChatHub {
	return &RocketChatHub{
		clients:    make(map[*RocketChatClient]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *RocketChatClient),
		unregister: make(chan *RocketChatClient),
		db:         db,
	}
}

// Run starts the WebSocket hub
func (h *RocketChatHub) Run() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("RocketChat client connected: User %d (%s)", client.userID, client.username)
			
			// Update user status to online
			h.updateUserStatus(client.userID, models.StatusOnline)
			
			// Send connected message
			h.sendToClient(client, RocketChatMessage{
				Msg: "connected",
			})

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("RocketChat client disconnected: User %d (%s)", client.userID, client.username)
				
				// Update user status to offline if no other connections
				if !h.isUserConnected(client.userID) {
					h.updateUserStatus(client.userID, models.StatusOffline)
				}
			}

		case message := <-h.broadcast:
			// Broadcast to all connected clients
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}

		case <-ticker.C:
			// Ping all clients to keep connections alive
			h.pingClients()
		}
	}
}

// HandleWebSocket handles WebSocket connections for Rocket.Chat
func (h *RocketChatHub) HandleWebSocket(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user info
	var user models.RocketChatUser
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &RocketChatClient{
		hub:      h,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		username: user.Username,
		rooms:    make(map[string]bool),
		lastPing: time.Now(),
	}

	h.register <- client

	go client.writePump()
	go client.readPump()
}

// readPump handles incoming WebSocket messages
func (c *RocketChatClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		c.lastPing = time.Now()
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg RocketChatMessage
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		c.handleMessage(msg)
	}
}

// writePump handles outgoing WebSocket messages
func (c *RocketChatClient) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (c *RocketChatClient) handleMessage(msg RocketChatMessage) {
	switch msg.Msg {
	case "connect":
		c.handleConnect(msg)
	case "sub":
		c.handleSubscription(msg)
	case "unsub":
		c.handleUnsubscription(msg)
	case "method":
		c.handleMethod(msg)
	case "ping":
		c.handlePing(msg)
	case "pong":
		c.lastPing = time.Now()
	}
}

// handleConnect handles connection messages
func (c *RocketChatClient) handleConnect(msg RocketChatMessage) {
	response := RocketChatMessage{
		Msg: "connected",
	}
	c.hub.sendToClient(c, response)
}

// handleSubscription handles room subscriptions
func (c *RocketChatClient) handleSubscription(msg RocketChatMessage) {
	if len(msg.Params) < 1 {
		return
	}

	subscriptionName, ok := msg.Params[0].(string)
	if !ok {
		return
	}

	switch subscriptionName {
	case "stream-room-messages":
		if len(msg.Params) >= 2 {
			if roomID, ok := msg.Params[1].(string); ok {
				c.rooms[roomID] = true
				c.hub.sendToClient(c, RocketChatMessage{
					Msg: "ready",
					ID:  msg.ID,
				})
			}
		}
	case "stream-notify-user":
		// Subscribe to user notifications
		c.hub.sendToClient(c, RocketChatMessage{
			Msg: "ready",
			ID:  msg.ID,
		})
	}
}

// handleUnsubscription handles room unsubscriptions
func (c *RocketChatClient) handleUnsubscription(msg RocketChatMessage) {
	// Remove room subscriptions
	for roomID := range c.rooms {
		delete(c.rooms, roomID)
	}
}

// handleMethod handles method calls
func (c *RocketChatClient) handleMethod(msg RocketChatMessage) {
	switch msg.Method {
	case "sendMessage":
		c.handleSendMessage(msg)
	case "typing":
		c.handleTyping(msg)
	case "setUserStatus":
		c.handleSetUserStatus(msg)
	}
}

// handleSendMessage handles sending messages
func (c *RocketChatClient) handleSendMessage(msg RocketChatMessage) {
	if len(msg.Params) < 1 {
		return
	}

	params, ok := msg.Params[0].(map[string]interface{})
	if !ok {
		return
	}

	roomID, _ := params["rid"].(string)
	message, _ := params["msg"].(string)

	if roomID == "" || message == "" {
		return
	}

	// Create message in database
	chatMsg := models.RocketChatMessage{
		MessageID: generateRocketChatID(),
		RoomID:    roomID,
		UserID:    c.userID,
		Content:   message,
		Type:      models.MessageTypeRegular,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := c.hub.db.Create(&chatMsg).Error; err != nil {
		log.Printf("Error creating message: %v", err)
		return
	}

	// Load user data
	var user models.RocketChatUser
	c.hub.db.First(&user, c.userID)

	// Broadcast to all clients subscribed to this room
	c.hub.broadcastToRoom(roomID, "stream-room-messages", map[string]interface{}{
		"_id":  chatMsg.MessageID,
		"rid":  chatMsg.RoomID,
		"msg":  chatMsg.Content,
		"ts":   chatMsg.CreatedAt,
		"u": map[string]interface{}{
			"_id":      c.userID,
			"username": user.Username,
			"name":     user.Name,
		},
	})

	// Send result back to sender
	c.hub.sendToClient(c, RocketChatMessage{
		Msg: "result",
		ID:  msg.ID,
		Result: map[string]interface{}{
			"_id": chatMsg.MessageID,
		},
	})
}

// handleTyping handles typing indicators
func (c *RocketChatClient) handleTyping(msg RocketChatMessage) {
	if len(msg.Params) < 2 {
		return
	}

	roomID, _ := msg.Params[0].(string)
	isTyping, _ := msg.Params[1].(bool)

	if roomID == "" {
		return
	}

	// Broadcast typing indicator to room
	c.hub.broadcastToRoom(roomID, "stream-notify-room", map[string]interface{}{
		"eventName": roomID + "/typing",
		"args": []interface{}{
			c.username,
			isTyping,
		},
	})
}

// handleSetUserStatus handles user status updates
func (c *RocketChatClient) handleSetUserStatus(msg RocketChatMessage) {
	if len(msg.Params) < 1 {
		return
	}

	status, _ := msg.Params[0].(string)
	if status == "" {
		return
	}

	c.hub.updateUserStatus(c.userID, status)
}

// handlePing handles ping messages
func (c *RocketChatClient) handlePing(msg RocketChatMessage) {
	c.hub.sendToClient(c, RocketChatMessage{
		Msg: "pong",
		ID:  msg.ID,
	})
}

// sendToClient sends a message to a specific client
func (h *RocketChatHub) sendToClient(client *RocketChatClient, msg RocketChatMessage) {
	if data, err := json.Marshal(msg); err == nil {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

// broadcastToRoom broadcasts a message to all clients subscribed to a room
func (h *RocketChatHub) broadcastToRoom(roomID, collection string, data interface{}) {
	msg := RocketChatMessage{
		Msg:        "changed",
		Collection: collection,
		ID:         generateRocketChatID(),
		Fields:     data,
	}

	if msgData, err := json.Marshal(msg); err == nil {
		for client := range h.clients {
			if client.rooms[roomID] {
				select {
				case client.send <- msgData:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// updateUserStatus updates user status in database
func (h *RocketChatHub) updateUserStatus(userID uint, status string) {
	h.db.Model(&models.RocketChatUser{}).Where("id = ?", userID).Update("status", status)
	
	// Update presence
	presence := models.RocketChatPresence{
		UserID:   userID,
		Status:   status,
		LastSeen: time.Now(),
	}
	h.db.Save(&presence)
}

// isUserConnected checks if user has any active connections
func (h *RocketChatHub) isUserConnected(userID uint) bool {
	for client := range h.clients {
		if client.userID == userID {
			return true
		}
	}
	return false
}

// pingClients sends ping to all clients
func (h *RocketChatHub) pingClients() {
	now := time.Now()
	for client := range h.clients {
		if now.Sub(client.lastPing) > 60*time.Second {
			// Client hasn't responded to ping, disconnect
			h.unregister <- client
		}
	}
}

// generateRocketChatID generates a Rocket.Chat style ID
func generateRocketChatID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:17]
}

// IsUserOnline checks if a user is currently online
func (h *RocketChatHub) IsUserOnline(userID uint) bool {
	return h.isUserConnected(userID)
}

// GetOnlineUsers returns list of online users
func (h *RocketChatHub) GetOnlineUsers() []uint {
	userMap := make(map[uint]bool)
	var users []uint

	for client := range h.clients {
		if !userMap[client.userID] {
			users = append(users, client.userID)
			userMap[client.userID] = true
		}
	}

	return users
}

// BroadcastUserStatusChange broadcasts user status changes
func (h *RocketChatHub) BroadcastUserStatusChange(userID uint, status string) {
	var user models.RocketChatUser
	if err := h.db.First(&user, userID).Error; err != nil {
		return
	}

	msg := RocketChatMessage{
		Msg:        "changed",
		Collection: "stream-notify-all",
		Fields: map[string]interface{}{
			"eventName": "user.statusChanged",
			"args": []interface{}{
				map[string]interface{}{
					"_id":      userID,
					"username": user.Username,
					"status":   status,
				},
			},
		},
	}

	if data, err := json.Marshal(msg); err == nil {
		h.broadcast <- data
	}
}
