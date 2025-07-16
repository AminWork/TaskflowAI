package handlers

import (
	"net/http"
	"strconv"

	"kanban-backend/internal/database"
	"kanban-backend/internal/middleware"
	"kanban-backend/internal/models"
	"kanban-backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	hub *websocket.Hub
}

func NewTaskHandler(hub *websocket.Hub) *TaskHandler {
	return &TaskHandler{hub: hub}
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("boardId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(uint(boardID), userID, "create_task") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	tx := db.Begin()

	// Create task
	task := models.Task{
		Title:          req.Title,
		Description:    req.Description,
		Priority:       req.Priority,
		Category:       req.Category,
		Status:         req.Status,
		BoardID:        uint(boardID),
		CreatedBy:      userID,
		AssigneeID:     req.AssigneeID,
		EstimatedHours: req.EstimatedHours,
	}

	if err := tx.Create(&task).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	// Create tags
	for _, tag := range req.Tags {
		taskTag := models.TaskTag{
			TaskID: task.ID,
			Tag:    tag,
		}
		if err := tx.Create(&taskTag).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task tags"})
			return
		}
	}

	tx.Commit()

	// Load complete task response
	var taskResponse models.TaskResponse
	h.loadTaskResponse(task.ID, &taskResponse)

	// Broadcast to board members
	h.hub.BroadcastToBoard(uint(boardID), "task_created", taskResponse)

	c.JSON(http.StatusCreated, taskResponse)
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
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

	var tasks []models.Task
	if err := database.GetDB().Where("board_id = ?", boardID).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	var taskResponses []models.TaskResponse
	for _, task := range tasks {
		var taskResponse models.TaskResponse
		h.loadTaskResponse(task.ID, &taskResponse)
		taskResponses = append(taskResponses, taskResponse)
	}

	c.JSON(http.StatusOK, taskResponses)
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := database.GetDB().First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasAccess(task.BoardID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var taskResponse models.TaskResponse
	h.loadTaskResponse(uint(taskID), &taskResponse)

	c.JSON(http.StatusOK, taskResponse)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := database.GetDB().First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(task.BoardID, userID, "edit_task") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	tx := db.Begin()

	// Update task
	task.Title = req.Title
	task.Description = req.Description
	task.Priority = req.Priority
	task.Category = req.Category
	task.Status = req.Status
	task.AssigneeID = req.AssigneeID
	task.EstimatedHours = req.EstimatedHours
	task.ActualHours = req.ActualHours

	if err := tx.Save(&task).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	// Delete existing tags
	if err := tx.Where("task_id = ?", task.ID).Delete(&models.TaskTag{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tags"})
		return
	}

	// Create new tags
	for _, tag := range req.Tags {
		taskTag := models.TaskTag{
			TaskID: task.ID,
			Tag:    tag,
		}
		if err := tx.Create(&taskTag).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task tags"})
			return
		}
	}

	tx.Commit()

	// Load complete task response
	var taskResponse models.TaskResponse
	h.loadTaskResponse(task.ID, &taskResponse)

	// Broadcast to board members
	h.hub.BroadcastToBoard(task.BoardID, "task_updated", taskResponse)

	c.JSON(http.StatusOK, taskResponse)
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := database.GetDB().First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(task.BoardID, userID, "delete_task") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	if err := database.GetDB().Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	// Broadcast to board members
	h.hub.BroadcastToBoard(task.BoardID, "task_deleted", gin.H{"task_id": taskID})

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

func (h *TaskHandler) MoveTask(c *gin.Context) {
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := database.GetDB().First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	userID := middleware.GetUserID(c)
	if !h.hasPermission(task.BoardID, userID, "move_task") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=todo inprogress done"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task.Status = req.Status
	if err := database.GetDB().Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move task"})
		return
	}

	// Load complete task response
	var taskResponse models.TaskResponse
	h.loadTaskResponse(task.ID, &taskResponse)

	// Broadcast to board members
	h.hub.BroadcastToBoard(task.BoardID, "task_moved", taskResponse)

	c.JSON(http.StatusOK, taskResponse)
}

// Helper functions
func (h *TaskHandler) hasAccess(boardID, userID uint) bool {
	var count int64
	database.GetDB().Model(&models.BoardMember{}).Where("board_id = ? AND user_id = ?", boardID, userID).Count(&count)
	return count > 0
}

func (h *TaskHandler) hasPermission(boardID, userID uint, action string) bool {
	var count int64
	database.GetDB().Table("board_members").
		Joins("JOIN member_permissions ON board_members.id = member_permissions.member_id").
		Where("board_members.board_id = ? AND board_members.user_id = ? AND member_permissions.action = ? AND member_permissions.granted = ?", boardID, userID, action, true).
		Count(&count)
	return count > 0
}

func (h *TaskHandler) loadTaskResponse(taskID uint, response *models.TaskResponse) error {
	var task models.Task
	if err := database.GetDB().Preload("Tags").First(&task, taskID).Error; err != nil {
		return err
	}

	response.ID = task.ID
	response.Title = task.Title
	response.Description = task.Description
	response.Priority = task.Priority
	response.Category = task.Category
	response.Status = task.Status
	response.BoardID = task.BoardID
	response.CreatedBy = task.CreatedBy
	response.AssigneeID = task.AssigneeID
	response.EstimatedHours = task.EstimatedHours
	response.ActualHours = task.ActualHours
	response.CreatedAt = task.CreatedAt
	response.UpdatedAt = task.UpdatedAt

	// Load tags
	for _, tag := range task.Tags {
		response.Tags = append(response.Tags, tag.Tag)
	}

	return nil
}