package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"kanban-backend/internal/database"
	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"
	"kanban-backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

type BoardHandler struct {
	hub *websocket.Hub
}

func NewBoardHandler(hub *websocket.Hub) *BoardHandler {
	return &BoardHandler{hub: hub}
}

func (h *BoardHandler) CreateBoard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req models.CreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	tx := db.Begin()

	// Create board
	board := models.Board{
		Title:       req.Title,
		Description: req.Description,
		CreatedBy:   userID,
	}

	if err := tx.Create(&board).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create board"})
		return
	}

	// Create board settings
	settings := models.BoardSettings{
		BoardID:           board.ID,
		DefaultMemberRole: "member",
	}

	if err := tx.Create(&settings).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create board settings"})
		return
	}

	// Add creator as owner
	member := models.BoardMember{
		BoardID:  board.ID,
		UserID:   userID,
		Role:     "owner",
		JoinedAt: time.Now(),
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add board member"})
		return
	}

	// Create default permissions for owner
	permissions := []models.MemberPermission{
		{MemberID: member.ID, Action: "create_task", Granted: true},
		{MemberID: member.ID, Action: "edit_task", Granted: true},
		{MemberID: member.ID, Action: "delete_task", Granted: true},
		{MemberID: member.ID, Action: "move_task", Granted: true},
		{MemberID: member.ID, Action: "invite_users", Granted: true},
		{MemberID: member.ID, Action: "manage_board", Granted: true},
	}

	for _, perm := range permissions {
		if err := tx.Create(&perm).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create permissions"})
			return
		}
	}

	tx.Commit()

	// Load the complete board with relationships
	var boardResponse models.BoardResponse
	h.loadBoardResponse(board.ID, &boardResponse)

	c.JSON(http.StatusCreated, boardResponse)
}

func (h *BoardHandler) GetBoards(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var boards []models.Board
	if err := database.GetDB().
		Joins("JOIN board_members ON boards.id = board_members.board_id").
		Where("board_members.user_id = ?", userID).
		Find(&boards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch boards"})
		return
	}

	var boardResponses []models.BoardResponse
	for _, board := range boards {
		var boardResponse models.BoardResponse
		h.loadBoardResponse(board.ID, &boardResponse)
		boardResponses = append(boardResponses, boardResponse)
	}

	c.JSON(http.StatusOK, boardResponses)
}

func (h *BoardHandler) GetBoard(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasAccess(uint(boardID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var boardResponse models.BoardResponse
	if err := h.loadBoardResponse(uint(boardID), &boardResponse); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	c.JSON(http.StatusOK, boardResponse)
}

func (h *BoardHandler) UpdateBoard(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(uint(boardID), userID, "manage_board") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req models.UpdateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var board models.Board
	if err := database.GetDB().First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	board.Title = req.Title
	board.Description = req.Description

	if err := database.GetDB().Save(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update board"})
		return
	}

	var boardResponse models.BoardResponse
	h.loadBoardResponse(uint(boardID), &boardResponse)

	// Broadcast update to all board members
	h.hub.BroadcastToBoard(uint(boardID), "board_updated", boardResponse)

	c.JSON(http.StatusOK, boardResponse)
}

func (h *BoardHandler) DeleteBoard(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)

	var board models.Board
	if err := database.GetDB().First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	if board.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only board owner can delete the board"})
		return
	}

	if err := database.GetDB().Delete(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete board"})
		return
	}

	// Broadcast deletion to all board members
	h.hub.BroadcastToBoard(uint(boardID), "board_deleted", gin.H{"board_id": boardID})

	c.JSON(http.StatusOK, gin.H{"message": "Board deleted successfully"})
}

func (h *BoardHandler) InviteUser(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(uint(boardID), userID, "invite_users") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req models.InviteUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user is already a member
	var existingMember models.BoardMember
	if err := database.GetDB().Where("board_id = ? AND user_id IN (SELECT id FROM users WHERE email = ?)", boardID, req.Email).First(&existingMember).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User is already a member"})
		return
	}

	// Check if invitation already exists
	var existingInvitation models.Invitation
	if err := database.GetDB().Where("board_id = ? AND invited_email = ? AND status = 'pending'", boardID, req.Email).First(&existingInvitation).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Invitation already sent"})
		return
	}

	// Generate invitation token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	invitation := models.Invitation{
		BoardID:      uint(boardID),
		InvitedBy:    userID,
		InvitedEmail: req.Email,
		Role:         req.Role,
		Token:        token,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour), // 7 days
	}

	if err := database.GetDB().Create(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invitation"})
		return
	}

	c.JSON(http.StatusCreated, invitation)
}

func (h *BoardHandler) GetInvitations(c *gin.Context) {
	userEmail := middleware.GetUserEmail(c)

	var invitations []models.Invitation
	if err := database.GetDB().
		Preload("Board").
		Preload("Inviter").
		Where("invited_email = ? AND status = 'pending' AND expires_at > ?", userEmail, time.Now()).
		Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invitations"})
		return
	}

	c.JSON(http.StatusOK, invitations)
}

func (h *BoardHandler) AcceptInvitation(c *gin.Context) {
	invitationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID"})
		return
	}

	userID := middleware.GetUserID(c)
	userEmail := middleware.GetUserEmail(c)

	var invitation models.Invitation
	if err := database.GetDB().Where("id = ? AND invited_email = ? AND status = 'pending'", invitationID, userEmail).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	if invitation.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation has expired"})
		return
	}

	db := database.GetDB()
	tx := db.Begin()

	// Create board member
	member := models.BoardMember{
		BoardID:  invitation.BoardID,
		UserID:   userID,
		Role:     invitation.Role,
		JoinedAt: time.Now(),
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member"})
		return
	}

	// Create permissions based on role
	permissions := h.getPermissionsForRole(invitation.Role)
	for _, action := range permissions {
		perm := models.MemberPermission{
			MemberID: member.ID,
			Action:   action.Action,
			Granted:  action.Granted,
		}
		if err := tx.Create(&perm).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create permissions"})
			return
		}
	}

	// Update invitation status
	invitation.Status = "accepted"
	if err := tx.Save(&invitation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invitation"})
		return
	}

	tx.Commit()

	// Broadcast new member to board
	var boardResponse models.BoardResponse
	h.loadBoardResponse(invitation.BoardID, &boardResponse)
	h.hub.BroadcastToBoard(invitation.BoardID, "member_joined", boardResponse)

	c.JSON(http.StatusOK, gin.H{"message": "Invitation accepted"})
}

func (h *BoardHandler) DeclineInvitation(c *gin.Context) {
	invitationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID"})
		return
	}

	userEmail := middleware.GetUserEmail(c)

	var invitation models.Invitation
	if err := database.GetDB().Where("id = ? AND invited_email = ? AND status = 'pending'", invitationID, userEmail).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	invitation.Status = "declined"
	if err := database.GetDB().Save(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invitation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation declined"})
}

func (h *BoardHandler) RemoveMember(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	memberUserID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(uint(boardID), userID, "manage_board") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var member models.BoardMember
	if err := database.GetDB().Where("board_id = ? AND user_id = ?", boardID, memberUserID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	if member.Role == "owner" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove board owner"})
		return
	}

	if err := database.GetDB().Delete(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member"})
		return
	}

	// Broadcast member removal
	var boardResponse models.BoardResponse
	h.loadBoardResponse(uint(boardID), &boardResponse)
	h.hub.BroadcastToBoard(uint(boardID), "member_removed", boardResponse)

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

func (h *BoardHandler) UpdateMemberRole(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	memberUserID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(uint(boardID), userID, "manage_board") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var member models.BoardMember
	if err := database.GetDB().Where("board_id = ? AND user_id = ?", boardID, memberUserID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	if member.Role == "owner" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change owner role"})
		return
	}

	db := database.GetDB()
	tx := db.Begin()

	// Update role
	member.Role = req.Role
	if err := tx.Save(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	// Delete existing permissions
	if err := tx.Where("member_id = ?", member.ID).Delete(&models.MemberPermission{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permissions"})
		return
	}

	// Create new permissions
	permissions := h.getPermissionsForRole(req.Role)
	for _, action := range permissions {
		perm := models.MemberPermission{
			MemberID: member.ID,
			Action:   action.Action,
			Granted:  action.Granted,
		}
		if err := tx.Create(&perm).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create permissions"})
			return
		}
	}

	tx.Commit()

	// Broadcast role update
	var boardResponse models.BoardResponse
	h.loadBoardResponse(uint(boardID), &boardResponse)
	h.hub.BroadcastToBoard(uint(boardID), "member_role_updated", boardResponse)

	c.JSON(http.StatusOK, gin.H{"message": "Member role updated successfully"})
}

// Helper functions
func (h *BoardHandler) hasAccess(boardID, userID uint) bool {
	var count int64
	database.GetDB().Model(&models.BoardMember{}).Where("board_id = ? AND user_id = ?", boardID, userID).Count(&count)
	return count > 0
}

func (h *BoardHandler) hasPermission(boardID, userID uint, action string) bool {
	var count int64
	database.GetDB().Table("board_members").
		Joins("JOIN member_permissions ON board_members.id = member_permissions.member_id").
		Where("board_members.board_id = ? AND board_members.user_id = ? AND member_permissions.action = ? AND member_permissions.granted = ?", boardID, userID, action, true).
		Count(&count)
	return count > 0
}

func (h *BoardHandler) loadBoardResponse(boardID uint, response *models.BoardResponse) error {
	var board models.Board
	if err := database.GetDB().Preload("Settings").First(&board, boardID).Error; err != nil {
		return err
	}

	response.ID = board.ID
	response.Title = board.Title
	response.Description = board.Description
	response.CreatedBy = board.CreatedBy
	response.IsPublic = board.IsPublic
	response.CreatedAt = board.CreatedAt
	response.UpdatedAt = board.UpdatedAt
	response.Settings = board.Settings

	// Load members with permissions
	var members []models.BoardMember
	database.GetDB().Preload("User").Preload("Permissions").Where("board_id = ?", boardID).Find(&members)

	for _, member := range members {
		memberResponse := models.BoardMemberResponse{
			UserID:   member.UserID,
			Email:    member.User.Email,
			Name:     member.User.Name,
			Avatar:   member.User.Avatar,
			Role:     member.Role,
			JoinedAt: member.JoinedAt,
		}

		for _, perm := range member.Permissions {
			memberResponse.Permissions = append(memberResponse.Permissions, models.MemberPermissionResponse{
				Action:  perm.Action,
				Granted: perm.Granted,
			})
		}

		response.Members = append(response.Members, memberResponse)
	}

	return nil
}

func (h *BoardHandler) getPermissionsForRole(role string) []models.MemberPermission {
	switch role {
	case "admin":
		return []models.MemberPermission{
			{Action: "create_task", Granted: true},
			{Action: "edit_task", Granted: true},
			{Action: "delete_task", Granted: true},
			{Action: "move_task", Granted: true},
			{Action: "invite_users", Granted: true},
			{Action: "manage_board", Granted: true},
		}
	case "member":
		return []models.MemberPermission{
			{Action: "create_task", Granted: true},
			{Action: "edit_task", Granted: true},
			{Action: "delete_task", Granted: true},
			{Action: "move_task", Granted: true},
			{Action: "invite_users", Granted: false},
			{Action: "manage_board", Granted: false},
		}
	case "viewer":
		return []models.MemberPermission{
			{Action: "create_task", Granted: false},
			{Action: "edit_task", Granted: false},
			{Action: "delete_task", Granted: false},
			{Action: "move_task", Granted: false},
			{Action: "invite_users", Granted: false},
			{Action: "manage_board", Granted: false},
		}
	default:
		return []models.MemberPermission{}
	}
}