package handlers

import (
    "net/http"
    "strconv"

    "kanban-backend/internal/database"
    "kanban-backend/internal/middleware"
    "kanban-backend/internal/models"

    "github.com/gin-gonic/gin"
)

// ColumnHandler handles CRUD operations for board columns.
type ColumnHandler struct{}

func NewColumnHandler() *ColumnHandler {
    return &ColumnHandler{}
}

// GetColumns returns all columns for a board, ordered by position.
func (h *ColumnHandler) GetColumns(c *gin.Context) {
    boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
        return
    }

    userID := middleware.GetUserID(c)
    if !hasAccessToBoard(uint(boardID), userID) {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
        return
    }

    var columns []models.Column
    if err := database.GetDB().Where("board_id = ?", boardID).Order("position asc").Find(&columns).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch columns"})
        return
    }

    c.JSON(http.StatusOK, columns)
}

// CreateColumn creates a new column for the given board.
func (h *ColumnHandler) CreateColumn(c *gin.Context) {
    boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
        return
    }

    userID := middleware.GetUserID(c)
    if !hasPermissionOnBoard(uint(boardID), userID, "manage_board") {
        c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
        return
    }

    var req models.CreateColumnRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Determine next position
    var maxPos int
    database.GetDB().Model(&models.Column{}).Where("board_id = ?", boardID).Select("COALESCE(MAX(position),0)").Scan(&maxPos)

    column := models.Column{
        BoardID:  uint(boardID),
        Title:    req.Title,
        Status:   req.Status,
        Color:    req.Color,
        Position: maxPos + 1,
    }

    if err := database.GetDB().Create(&column).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create column"})
        return
    }

    c.JSON(http.StatusCreated, column)
}

// helper reuse existing permission functions from board handler
func hasAccessToBoard(boardID, userID uint) bool {
    var count int64
    database.GetDB().Model(&models.BoardMember{}).Where("board_id = ? AND user_id = ?", boardID, userID).Count(&count)
    return count > 0
}

func hasPermissionOnBoard(boardID, userID uint, action string) bool {
    var count int64
    database.GetDB().Table("board_members").
        Joins("JOIN member_permissions ON board_members.id = member_permissions.member_id").
        Where("board_members.board_id = ? AND board_members.user_id = ? AND member_permissions.action = ? AND member_permissions.granted = ?", boardID, userID, action, true).
        Count(&count)
    return count > 0
}
