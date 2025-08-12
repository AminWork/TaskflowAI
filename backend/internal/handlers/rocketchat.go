package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"kanban-backend/internal/models"
)

type RocketChatHandler struct {
	db *gorm.DB
}

func NewRocketChatHandler(db *gorm.DB) *RocketChatHandler {
	return &RocketChatHandler{db: db}
}

// generateID generates a Rocket.Chat style ID
func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:17]
}

// RocketChat API: Login
func (h *RocketChatHandler) Login(c *gin.Context) {
	var req models.RocketChatLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.RocketChatUser
	// Allow login with username or email
	if strings.Contains(req.User, "@") {
		if err := h.db.Where("email = ?", req.User).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
	} else {
		if err := h.db.Where("username = ?", req.User).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Update user status and last login
	now := time.Now()
	user.Status = models.StatusOnline
	user.LastLogin = &now
	h.db.Save(&user)

	// Generate auth token (simplified)
	authToken := generateID()

	response := models.RocketChatLoginResponse{
		Status: "success",
		Data: struct {
			UserID    string `json:"userId"`
			AuthToken string `json:"authToken"`
			Me        models.RocketChatUserResponse `json:"me"`
		}{
			UserID:    strconv.Itoa(int(user.ID)),
			AuthToken: authToken,
			Me: models.RocketChatUserResponse{
				ID:       strconv.Itoa(int(user.ID)),
				Username: user.Username,
				Email:    user.Email,
				Name:     user.Name,
				Avatar:   user.Avatar,
				Status:   user.Status,
				Active:   user.IsActive,
				Roles:    user.Roles,
				CreatedAt: user.CreatedAt,
				UpdatedAt: user.UpdatedAt,
			},
		},
	}

	c.JSON(http.StatusOK, response)
}

// RocketChat API: Register
func (h *RocketChatHandler) Register(c *gin.Context) {
	var req models.RocketChatRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.RocketChatUser
	if err := h.db.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.RocketChatUser{
		Username:  req.Username,
		Email:     req.Email,
		Name:      req.Name,
		Password:  string(hashedPassword),
		Status:    models.StatusOnline,
		IsActive:  true,
		Roles:     []string{"user"},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Auto-subscribe to general channel if it exists
	var generalRoom models.RocketChatRoom
	if err := h.db.Where("name = ? AND type = ?", "general", models.RoomTypeChannel).First(&generalRoom).Error; err == nil {
		subscription := models.RocketChatSubscription{
			UserID:    user.ID,
			RoomID:    generalRoom.RoomID,
			Name:      generalRoom.Name,
			Type:      generalRoom.Type,
			IsOpen:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		h.db.Create(&subscription)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"user": gin.H{
			"_id":      strconv.Itoa(int(user.ID)),
			"username": user.Username,
			"email":    user.Email,
			"name":     user.Name,
			"active":   user.IsActive,
		},
	})
}

// RocketChat API: Get Rooms
func (h *RocketChatHandler) GetRooms(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var subscriptions []models.RocketChatSubscription
	if err := h.db.Preload("Room").Where("user_id = ?", userID).Find(&subscriptions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	var rooms []models.RocketChatRoomResponse
	for _, sub := range subscriptions {
		room := models.RocketChatRoomResponse{
			ID:           sub.Room.RoomID,
			Name:         sub.Room.Name,
			DisplayName:  sub.Room.DisplayName,
			Type:         sub.Room.Type,
			MessageCount: sub.Room.MessageCount,
			Topic:        sub.Room.Topic,
			Description:  sub.Room.Description,
			Announcement: sub.Room.Announcement,
			ReadOnly:     sub.Room.IsReadOnly,
			Default:      sub.Room.IsDefault,
			Featured:     sub.Room.IsFeatured,
			Archived:     sub.Room.IsArchived,
			CreatedAt:    sub.Room.CreatedAt,
			UpdatedAt:    sub.Room.UpdatedAt,
		}

		// Get last message
		var lastMsg models.RocketChatMessage
		if err := h.db.Preload("User").Where("room_id = ?", sub.Room.RoomID).Order("created_at DESC").First(&lastMsg).Error; err == nil {
			room.LastMessage = &struct {
				ID        string    `json:"_id"`
				RoomID    string    `json:"rid"`
				Message   string    `json:"msg"`
				Timestamp time.Time `json:"ts"`
				User      struct {
					ID       string `json:"_id"`
					Username string `json:"username"`
					Name     string `json:"name"`
				} `json:"u"`
			}{
				ID:        lastMsg.MessageID,
				RoomID:    lastMsg.RoomID,
				Message:   lastMsg.Content,
				Timestamp: lastMsg.CreatedAt,
				User: struct {
					ID       string `json:"_id"`
					Username string `json:"username"`
					Name     string `json:"name"`
				}{
					ID:       strconv.Itoa(int(lastMsg.User.ID)),
					Username: lastMsg.User.Username,
					Name:     lastMsg.User.Name,
				},
			}
		}

		rooms = append(rooms, room)
	}

	c.JSON(http.StatusOK, gin.H{
		"update": rooms,
		"remove": []string{},
		"success": true,
	})
}

// RocketChat API: Get Subscriptions
func (h *RocketChatHandler) GetSubscriptions(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var subscriptions []models.RocketChatSubscription
	if err := h.db.Preload("Room").Where("user_id = ?", userID).Find(&subscriptions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions"})
		return
	}

	var subs []models.RocketChatSubscriptionResponse
	for _, sub := range subscriptions {
		subResp := models.RocketChatSubscriptionResponse{
			ID:            strconv.Itoa(int(sub.ID)),
			Open:          sub.IsOpen,
			Alert:         sub.IsAlert,
			Unread:        sub.IsUnread,
			UnreadCount:   sub.UnreadCount,
			UserMentions:  sub.UserMentions,
			GroupMentions: sub.GroupMentions,
			LastSeen:      sub.LastSeen,
			Name:          sub.Name,
			Type:          sub.Type,
			RoomID:        sub.RoomID,
			UserID:        strconv.Itoa(int(sub.UserID)),
			CreatedAt:     sub.CreatedAt,
			UpdatedAt:     sub.UpdatedAt,
			Room: models.RocketChatRoomResponse{
				ID:           sub.Room.RoomID,
				Name:         sub.Room.Name,
				DisplayName:  sub.Room.DisplayName,
				Type:         sub.Room.Type,
				MessageCount: sub.Room.MessageCount,
				Topic:        sub.Room.Topic,
				Description:  sub.Room.Description,
				ReadOnly:     sub.Room.IsReadOnly,
				Default:      sub.Room.IsDefault,
				CreatedAt:    sub.Room.CreatedAt,
				UpdatedAt:    sub.Room.UpdatedAt,
			},
		}
		subs = append(subs, subResp)
	}

	c.JSON(http.StatusOK, gin.H{
		"update": subs,
		"remove": []string{},
		"success": true,
	})
}

// RocketChat API: Create Room
func (h *RocketChatHandler) CreateRoom(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.RocketChatCreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if room already exists
	var existingRoom models.RocketChatRoom
	if err := h.db.Where("name = ? AND type = ?", req.Name, req.Type).First(&existingRoom).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Room already exists"})
		return
	}

	// Create room
	room := models.RocketChatRoom{
		RoomID:      generateID(),
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		Topic:       req.Topic,
		CreatedBy:   userID,
		IsReadOnly:  req.ReadOnly,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	// Subscribe creator to room
	subscription := models.RocketChatSubscription{
		UserID:    userID,
		RoomID:    room.RoomID,
		Name:      room.Name,
		Type:      room.Type,
		IsOpen:    true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	h.db.Create(&subscription)

	// Add members if specified
	for _, memberUsername := range req.Members {
		var member models.RocketChatUser
		if err := h.db.Where("username = ?", memberUsername).First(&member).Error; err == nil {
			memberSub := models.RocketChatSubscription{
				UserID:    member.ID,
				RoomID:    room.RoomID,
				Name:      room.Name,
				Type:      room.Type,
				IsOpen:    true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			h.db.Create(&memberSub)
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"room": models.RocketChatRoomResponse{
			ID:          room.RoomID,
			Name:        room.Name,
			DisplayName: room.DisplayName,
			Type:        room.Type,
			Description: room.Description,
			Topic:       room.Topic,
			ReadOnly:    room.IsReadOnly,
			Default:     room.IsDefault,
			CreatedAt:   room.CreatedAt,
			UpdatedAt:   room.UpdatedAt,
		},
		"success": true,
	})
}

// RocketChat API: Send Message
func (h *RocketChatHandler) SendMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.RocketChatSendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user has access to room
	var subscription models.RocketChatSubscription
	if err := h.db.Where("user_id = ? AND room_id = ?", userID, req.RoomID).First(&subscription).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to room"})
		return
	}

	// Create message
	message := models.RocketChatMessage{
		MessageID: generateID(),
		RoomID:    req.RoomID,
		UserID:    userID,
		Content:   req.Message,
		Type:      models.MessageTypeRegular,
		ParseUrls: true,
		Groupable: true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Update room's last message time and message count
	now := time.Now()
	h.db.Model(&models.RocketChatRoom{}).Where("room_id = ?", req.RoomID).Updates(map[string]interface{}{
		"last_message":   &now,
		"message_count":  gorm.Expr("message_count + 1"),
		"updated_at":     now,
	})

	// Load user data for response
	var user models.RocketChatUser
	h.db.First(&user, userID)

	response := models.RocketChatMessageResponse{
		ID:        message.MessageID,
		RoomID:    message.RoomID,
		Message:   message.Content,
		Timestamp: message.CreatedAt,
		UpdatedAt: message.UpdatedAt,
		User: struct {
			ID       string `json:"_id"`
			Username string `json:"username"`
			Name     string `json:"name"`
		}{
			ID:       strconv.Itoa(int(user.ID)),
			Username: user.Username,
			Name:     user.Name,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"message": response,
		"success": true,
	})
}

// RocketChat API: Get Messages
func (h *RocketChatHandler) GetMessages(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	roomID := c.Param("roomId")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID required"})
		return
	}

	// Verify user has access to room
	var subscription models.RocketChatSubscription
	if err := h.db.Where("user_id = ? AND room_id = ?", userID, roomID).First(&subscription).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to room"})
		return
	}

	// Get pagination parameters
	count := 20
	if c.Query("count") != "" {
		if parsed, err := strconv.Atoi(c.Query("count")); err == nil && parsed > 0 && parsed <= 100 {
			count = parsed
		}
	}

	offset := 0
	if c.Query("offset") != "" {
		if parsed, err := strconv.Atoi(c.Query("offset")); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get messages
	var messages []models.RocketChatMessage
	if err := h.db.Preload("User").Where("room_id = ?", roomID).
		Order("created_at DESC").Limit(count).Offset(offset).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	var messageResponses []models.RocketChatMessageResponse
	for _, msg := range messages {
		msgResp := models.RocketChatMessageResponse{
			ID:        msg.MessageID,
			RoomID:    msg.RoomID,
			Message:   msg.Content,
			Timestamp: msg.CreatedAt,
			UpdatedAt: msg.UpdatedAt,
			User: struct {
				ID       string `json:"_id"`
				Username string `json:"username"`
				Name     string `json:"name"`
			}{
				ID:       strconv.Itoa(int(msg.User.ID)),
				Username: msg.User.Username,
				Name:     msg.User.Name,
			},
		}

		if msg.IsEdited {
			msgResp.EditedAt = msg.EditedAt
			if msg.EditedBy != nil {
				var editor models.RocketChatUser
				if err := h.db.First(&editor, *msg.EditedBy).Error; err == nil {
					msgResp.EditedBy = &struct {
						ID       string `json:"_id"`
						Username string `json:"username"`
					}{
						ID:       strconv.Itoa(int(editor.ID)),
						Username: editor.Username,
					}
				}
			}
		}

		messageResponses = append(messageResponses, msgResp)
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messageResponses,
		"count":    len(messageResponses),
		"offset":   offset,
		"total":    len(messageResponses),
		"success":  true,
	})
}

// RocketChat API: Get Users
func (h *RocketChatHandler) GetUsers(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var users []models.RocketChatUser
	if err := h.db.Where("is_active = ?", true).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var userResponses []models.RocketChatUserResponse
	for _, user := range users {
		userResp := models.RocketChatUserResponse{
			ID:       strconv.Itoa(int(user.ID)),
			Username: user.Username,
			Email:    user.Email,
			Name:     user.Name,
			Avatar:   user.Avatar,
			Status:   user.Status,
			Active:   user.IsActive,
			Roles:    user.Roles,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		}
		userResponses = append(userResponses, userResp)
	}

	c.JSON(http.StatusOK, gin.H{
		"users":   userResponses,
		"count":   len(userResponses),
		"success": true,
	})
}

// RocketChat API: Update User Status
func (h *RocketChatHandler) UpdateUserStatus(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Status     string `json:"status" binding:"required,oneof=online away busy invisible offline"`
		StatusText string `json:"statusText"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update user status
	updates := map[string]interface{}{
		"status":      req.Status,
		"status_text": req.StatusText,
		"updated_at":  time.Now(),
	}

	if err := h.db.Model(&models.RocketChatUser{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// RocketChat API: Join Room
func (h *RocketChatHandler) JoinRoom(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	roomID := c.Param("roomId")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID required"})
		return
	}

	// Check if room exists
	var room models.RocketChatRoom
	if err := h.db.Where("room_id = ?", roomID).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Check if user is already subscribed
	var existingSub models.RocketChatSubscription
	if err := h.db.Where("user_id = ? AND room_id = ?", userID, roomID).First(&existingSub).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already joined"})
		return
	}

	// Create subscription
	subscription := models.RocketChatSubscription{
		UserID:    userID,
		RoomID:    roomID,
		Name:      room.Name,
		Type:      room.Type,
		IsOpen:    true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&subscription).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// RocketChat API: Leave Room
func (h *RocketChatHandler) LeaveRoom(c *gin.Context) {
	userID := c.GetUint("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	roomID := c.Param("roomId")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID required"})
		return
	}

	// Delete subscription
	if err := h.db.Where("user_id = ? AND room_id = ?", userID, roomID).Delete(&models.RocketChatSubscription{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// Initialize default rooms and settings
func (h *RocketChatHandler) InitializeDefaults() error {
	// Create general channel if it doesn't exist
	var generalRoom models.RocketChatRoom
	if err := h.db.Where("name = ? AND type = ?", "general", models.RoomTypeChannel).First(&generalRoom).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create admin user if doesn't exist
			var adminUser models.RocketChatUser
			if err := h.db.Where("username = ?", "admin").First(&adminUser).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
					adminUser = models.RocketChatUser{
						Username:  "admin",
						Email:     "admin@taskflow.ai",
						Name:      "Administrator",
						Password:  string(hashedPassword),
						Status:    models.StatusOnline,
						IsActive:  true,
						IsAdmin:   true,
						Roles:     []string{"admin", "user"},
						CreatedAt: time.Now(),
						UpdatedAt: time.Now(),
					}
					h.db.Create(&adminUser)
				}
			}

			generalRoom = models.RocketChatRoom{
				RoomID:      generateID(),
				Name:        "general",
				DisplayName: "General",
				Type:        models.RoomTypeChannel,
				Description: "General discussion channel",
				Topic:       "Welcome to TaskflowAI Chat!",
				CreatedBy:   adminUser.ID,
				IsDefault:   true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			h.db.Create(&generalRoom)
		}
	}

	return nil
}
