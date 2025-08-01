package handlers

import (
	"net/http"
	"strconv"
	"time"

	"kanban-backend/internal/database"
	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"
	"kanban-backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

type PrivateMessageHandler struct {
	hub *websocket.Hub
}

func NewPrivateMessageHandler(hub *websocket.Hub) *PrivateMessageHandler {
	return &PrivateMessageHandler{hub: hub}
}

// SendPrivateMessage sends a private message between two users
func (h *PrivateMessageHandler) SendPrivateMessage(c *gin.Context) {
	senderID := middleware.GetUserID(c)
	
	var req struct {
		RecipientID uint   `json:"recipient_id" binding:"required"`
		Content     string `json:"content" binding:"required"`
	}

		if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message content cannot be empty"})
		return
	}

	// Validate recipient exists
	var recipient models.User
	if err := database.GetDB().First(&recipient, req.RecipientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipient not found"})
		return
	}

	// Get sender details
	var sender models.User
	if err := database.GetDB().First(&sender, senderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sender not found"})
		return
	}

	// Create the message
	message := models.PrivateMessage{
		SenderID:    senderID,
		RecipientID: req.RecipientID,
		Content:     req.Content,
		IsRead:      false,
		CreatedAt:   time.Now(),
	}

	if err := database.GetDB().Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Load the message with relationships for response
	database.GetDB().Preload("Sender").Preload("Recipient").First(&message, message.ID)

	// Broadcast the message via WebSocket
	h.hub.BroadcastPrivateMessage(req.RecipientID, "private_message", message)

	c.JSON(http.StatusCreated, message)
}

// GetConversations returns all conversations for the current user
func (h *PrivateMessageHandler) GetConversations(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Get all unique conversations (users the current user has exchanged messages with)
	var conversations []struct {
		UserID    uint      `json:"user_id"`
		UserName  string    `json:"user_name"`
		UserEmail string    `json:"user_email"`
		Avatar    string    `json:"avatar"`
		LastMessage string  `json:"last_message"`
		LastMessageTime time.Time `json:"last_message_time"`
		UnreadCount int64   `json:"unread_count"`
	}

	// Simpler, more robust query to get conversation summaries
	err := database.GetDB().Raw(`
		WITH conversation_candidates AS (
            SELECT 
                CASE WHEN sender_id = @user_id THEN recipient_id ELSE sender_id END AS other_user_id,
                created_at
            FROM private_messages
            WHERE sender_id = @user_id OR recipient_id = @user_id
        ), latest AS (
            SELECT other_user_id, MAX(created_at) AS last_time
            FROM conversation_candidates
            GROUP BY other_user_id
        )
        SELECT 
            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email,
            u.avatar AS avatar,
            pm.content AS last_message,
            pm.created_at AS last_message_time,
            (SELECT COUNT(*) FROM private_messages WHERE sender_id = l.other_user_id AND recipient_id = @user_id AND is_read = false) AS unread_count
        FROM latest l
        JOIN users u ON u.id = l.other_user_id
        JOIN private_messages pm ON ((pm.sender_id = @user_id AND pm.recipient_id = l.other_user_id) OR (pm.recipient_id = @user_id AND pm.sender_id = l.other_user_id)) AND pm.created_at = l.last_time
        ORDER BY last_message_time DESC
	`, map[string]interface{}{"user_id": userID}).Scan(&conversations).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversations": conversations})
}

// GetMessages returns messages between current user and another user
func (h *PrivateMessageHandler) GetMessages(c *gin.Context) {
	userID := middleware.GetUserID(c)
	otherUserID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var messages []models.PrivateMessage
	err = database.GetDB().
		Where("(sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)", 
			userID, otherUserID, otherUserID, userID).
		Preload("Sender").
		Preload("Recipient").
		Order("created_at ASC").
		Find(&messages).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages"})
		return
	}

	// Mark messages from the other user as read
	database.GetDB().
		Model(&models.PrivateMessage{}).
		Where("sender_id = ? AND recipient_id = ? AND is_read = false", otherUserID, userID).
		Update("is_read", true)

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// MarkAsRead marks messages as read
func (h *PrivateMessageHandler) MarkAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	senderID, err := strconv.ParseUint(c.Param("senderId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sender ID"})
		return
	}

	err = database.GetDB().
		Model(&models.PrivateMessage{}).
		Where("sender_id = ? AND recipient_id = ? AND is_read = false", senderID, userID).
		Update("is_read", true).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark messages as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Messages marked as read"})
}

// GetUnreadCounts returns the unread message counts for all conversations
func (h *PrivateMessageHandler) GetUnreadCounts(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var unreadCounts []struct {
		UserId     uint  `json:"userId"`
		UnreadCount int64 `json:"unreadCount"`
	}

	err := database.GetDB().
		Table("private_messages").
		Select("sender_id as user_id, COUNT(*) as unread_count").
		Where("recipient_id = ? AND is_read = false", userID).
		Group("sender_id").
		Scan(&unreadCounts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread counts"})
		return
	}

	// Get total unread count
	var totalUnread int64
	err = database.GetDB().
		Model(&models.PrivateMessage{}).
		Where("recipient_id = ? AND is_read = false", userID).
		Count(&totalUnread).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"totalUnread": totalUnread,
		"conversations": unreadCounts,
	})
} 