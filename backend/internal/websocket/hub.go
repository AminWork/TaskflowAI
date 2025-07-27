package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	hub     *Hub
	conn    *websocket.Conn
	send    chan []byte
	userID  uint
	boardID uint
}

type Message struct {
	Type        string      `json:"type"`
	BoardID     uint        `json:"board_id,omitempty"`
	UserID      uint        `json:"user_id"`
	RecipientID uint        `json:"recipient_id,omitempty"`
	Data        interface{} `json:"data"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("Client connected: User %d, Board %d", client.userID, client.boardID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("Client disconnected: User %d, Board %d", client.userID, client.boardID)
			}

		case message := <-h.broadcast:
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			// Send message to all clients in the same board
			for client := range h.clients {
				if client.boardID == msg.BoardID {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}

func (h *Hub) HandleWebSocket(c *gin.Context) {
	userID := c.GetUint("user_id")
	boardID := c.GetUint("board_id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:     h,
		conn:    conn,
		send:    make(chan []byte, 256),
		userID:  userID,
		boardID: boardID,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Echo the message back to all clients in the same board
		var msg Message
		if err := json.Unmarshal(message, &msg); err == nil {
			msg.UserID = c.userID
			msg.BoardID = c.boardID
			if data, err := json.Marshal(msg); err == nil {
				c.hub.broadcast <- data
			}
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

func (h *Hub) BroadcastToBoard(boardID uint, messageType string, data interface{}) {
	message := Message{
		Type:    messageType,
		BoardID: boardID,
		Data:    data,
	}

	if jsonData, err := json.Marshal(message); err == nil {
		h.broadcast <- jsonData
	}
}

// IsUserOnline checks if a user is currently connected to a specific board
func (h *Hub) IsUserOnline(userID, boardID uint) bool {
	for client := range h.clients {
		if client.userID == userID && client.boardID == boardID {
			return true
		}
	}
	return false
}

// GetOnlineUsers returns a list of online users for a specific board
func (h *Hub) GetOnlineUsers(boardID uint) []uint {
	var onlineUsers []uint
	userMap := make(map[uint]bool)

	for client := range h.clients {
		if client.boardID == boardID {
			if !userMap[client.userID] {
				onlineUsers = append(onlineUsers, client.userID)
				userMap[client.userID] = true
			}
		}
	}

	return onlineUsers
}

// BroadcastPrivateMessage sends a private message to a specific user
func (h *Hub) BroadcastPrivateMessage(recipientID uint, messageType string, data interface{}) {
	message := Message{
		Type:        messageType,
		RecipientID: recipientID,
		Data:        data,
	}

	if jsonData, err := json.Marshal(message); err == nil {
		// Send to all connections of the recipient user
		for client := range h.clients {
			if client.userID == recipientID {
				select {
				case client.send <- jsonData:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// IsUserOnlineAnywhere checks if a user is currently connected (regardless of board)
func (h *Hub) IsUserOnlineAnywhere(userID uint) bool {
	for client := range h.clients {
		if client.userID == userID {
			return true
		}
	}
	return false
}