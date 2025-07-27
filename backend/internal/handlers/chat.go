package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"kanban-backend/internal/database"
	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"
	"kanban-backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	hub *websocket.Hub
}

func NewChatHandler(hub *websocket.Hub) *ChatHandler {
	return &ChatHandler{hub: hub}
}

// SendMessage sends a chat message to a specific board
func (h *ChatHandler) SendMessage(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("boardId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasAccess(uint(boardID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Get user details
	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Handle multipart form for file uploads
	var message models.ChatMessage
	var fileURL, fileName, fileType string
	var fileSize int64

	// Check if it's a file upload or text message
	contentType := c.GetHeader("Content-Type")
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle file upload
		content := c.PostForm("content")
		sender := c.PostForm("sender")
		
		if sender == "" {
			sender = "user"
		}

		file, header, err := c.Request.FormFile("file")
		if err == nil {
			defer file.Close()

			// Validate file size (10MB limit)
			const maxFileSize = 10 * 1024 * 1024 // 10MB
			if header.Size > maxFileSize {
				c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 10MB limit"})
				return
			}

			// Create uploads directory if it doesn't exist
			uploadsDir := "/app/uploads"
			if err := os.MkdirAll(uploadsDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
				return
			}

			// Generate unique filename
			timestamp := time.Now().Unix()
			fileName = fmt.Sprintf("%d_%s", timestamp, header.Filename)
			filePath := filepath.Join(uploadsDir, fileName)

			// Save file
			out, err := os.Create(filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
				return
			}
			defer out.Close()

			_, err = io.Copy(out, file)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
				return
			}

			fileURL = fmt.Sprintf("/uploads/%s", fileName)
			fileName = header.Filename
			fileSize = header.Size
			fileType = header.Header.Get("Content-Type")
		}

		message = models.ChatMessage{
			BoardID:  uint(boardID),
			UserID:   userID,
			Content:  content,
			Sender:   sender,
			FileURL:  fileURL,
			FileName: fileName,
			FileSize: fileSize,
			FileType: fileType,
		}
	} else {
		// Handle JSON text message
		var req models.ChatMessageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		message = models.ChatMessage{
			BoardID: uint(boardID),
			UserID:  userID,
			Content: req.Content,
			Sender:  req.Sender,
		}
	}

	if err := database.GetDB().Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	// Create response with user details
	messageResponse := models.ChatMessageResponse{
		ID:        message.ID,
		BoardID:   message.BoardID,
		UserID:    message.UserID,
		Content:   message.Content,
		Sender:    message.Sender,
		UserName:  user.Name,
		Avatar:    user.Avatar,
		FileURL:   message.FileURL,
		FileName:  message.FileName,
		FileSize:  message.FileSize,
		FileType:  message.FileType,
		CreatedAt: message.CreatedAt,
	}

	// Broadcast to board members
	h.hub.BroadcastToBoard(uint(boardID), "chat_message", messageResponse)

	c.JSON(http.StatusCreated, messageResponse)
}

// GetMessages retrieves chat messages for a specific board
func (h *ChatHandler) GetMessages(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("boardId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasAccess(uint(boardID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Parse pagination parameters
	page := 1
	if p, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && p > 0 {
		page = p
	}

	limit := 50
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "50")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	offset := (page - 1) * limit

	// Get messages with user details
	var messages []models.ChatMessage
	err = database.GetDB().
		Preload("User").
		Where("board_id = ?", boardID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	// Convert to response format
	var messageResponses []models.ChatMessageResponse
	for _, msg := range messages {
		messageResponses = append(messageResponses, models.ChatMessageResponse{
			ID:        msg.ID,
			BoardID:   msg.BoardID,
			UserID:    msg.UserID,
			Content:   msg.Content,
			Sender:    msg.Sender,
			UserName:  msg.User.Name,
			Avatar:    msg.User.Avatar,
			FileURL:   msg.FileURL,
			FileName:  msg.FileName,
			FileSize:  msg.FileSize,
			FileType:  msg.FileType,
			CreatedAt: msg.CreatedAt,
		})
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messageResponses)-1; i < j; i, j = i+1, j-1 {
		messageResponses[i], messageResponses[j] = messageResponses[j], messageResponses[i]
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messageResponses,
		"page":     page,
		"limit":    limit,
		"total":    len(messageResponses),
	})
}

// SearchUsers searches for users globally by name or email
func (h *ChatHandler) SearchUsers(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if len(query) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query must be at least 2 characters"})
		return
	}

	limit := 20
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "20")); err == nil && l > 0 && l <= 50 {
		limit = l
	}

	var users []models.User
	err := database.GetDB().
		Select("id, email, name, avatar, created_at").
		Where("name LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%").
		Limit(limit).
		Find(&users).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	// Convert to response format
	var userResponses []models.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users": userResponses,
		"total": len(userResponses),
		"query": query,
	})
}

// GetBoardMembers retrieves all members of a specific board for chat purposes
func (h *ChatHandler) GetBoardMembers(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("boardId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasAccess(uint(boardID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var members []models.BoardMember
	err = database.GetDB().
		Preload("User").
		Where("board_id = ?", boardID).
		Find(&members).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve board members"})
		return
	}

	// Convert to response format
	var memberResponses []models.ChatMemberResponse
	for _, member := range members {
		memberResponses = append(memberResponses, models.ChatMemberResponse{
			UserID:   member.UserID,
			Email:    member.User.Email,
			Name:     member.User.Name,
			Avatar:   member.User.Avatar,
			Role:     member.Role,
			JoinedAt: member.JoinedAt,
			IsOnline: h.hub.IsUserOnline(member.UserID, uint(boardID)),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"members": memberResponses,
		"total":   len(memberResponses),
	})
}

// DeleteMessage deletes a chat message (only by sender or board admin/owner)
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	messageID, err := strconv.ParseUint(c.Param("messageId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	userID := middleware.GetUserID(c)

	// Get message details
	var message models.ChatMessage
	if err := database.GetDB().First(&message, messageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	// Check if user can delete the message
	canDelete := false
	if message.UserID == userID {
		canDelete = true // User can delete their own messages
	} else if h.hasPermission(message.BoardID, userID, "manage_board") {
		canDelete = true // Board admin/owner can delete any message
	}

	if !canDelete {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	// Delete the message
	if err := database.GetDB().Delete(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	// Broadcast deletion to board members
	h.hub.BroadcastToBoard(message.BoardID, "chat_message_deleted", gin.H{
		"message_id": messageID,
		"board_id":   message.BoardID,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}

// Helper functions
func (h *ChatHandler) hasAccess(boardID, userID uint) bool {
	var count int64
	database.GetDB().Model(&models.BoardMember{}).Where("board_id = ? AND user_id = ?", boardID, userID).Count(&count)
	return count > 0
}

func (h *ChatHandler) hasPermission(boardID, userID uint, action string) bool {
	var count int64
	database.GetDB().Table("board_members").
		Joins("JOIN member_permissions ON board_members.id = member_permissions.member_id").
		Where("board_members.board_id = ? AND board_members.user_id = ? AND member_permissions.action = ? AND member_permissions.granted = ?", boardID, userID, action, true).
		Count(&count)
	return count > 0
} 