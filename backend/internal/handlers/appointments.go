package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"kanban-backend/internal/database"
	"kanban-backend/internal/models"
	"kanban-backend/internal/middleware"
)

// GetAppointments retrieves all appointments for the authenticated user.
func GetAppointments(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var appointments []models.Appointment
	if err := database.DB.Where("user_id = ?", userID).Order("start asc").Find(&appointments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointments"})
		return
	}

	response := make([]models.AppointmentResponse, 0)
	for _, appt := range appointments {
		response = append(response, models.AppointmentResponse{
			ID:    appt.ID,
			Title: appt.Title,
			Start: appt.Start,
			End:   appt.End,
			UserID: appt.UserID,
		})
	}

	c.JSON(http.StatusOK, response)
}

// CreateAppointment creates a new appointment for the authenticated user.
func CreateAppointment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appointment := models.Appointment{
		Title:  req.Title,
		Start:  req.Start,
		End:    req.End,
		UserID: userID,
	}

	if err := database.DB.Create(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment"})
		return
	}

	c.JSON(http.StatusCreated, models.AppointmentResponse{
		ID:    appointment.ID,
		Title: appointment.Title,
		Start: appointment.Start,
		End:   appointment.End,
		UserID: appointment.UserID,
	})
}

// UpdateAppointment updates an existing appointment.
func UpdateAppointment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	apptID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req models.UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var appointment models.Appointment
	if err := database.DB.First(&appointment, apptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if appointment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to update this appointment"})
		return
	}

	appointment.Title = req.Title
	appointment.Start = req.Start
	appointment.End = req.End

	if err := database.DB.Save(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment"})
		return
	}

	c.JSON(http.StatusOK, models.AppointmentResponse{
		ID:    appointment.ID,
		Title: appointment.Title,
		Start: appointment.Start,
		End:   appointment.End,
		UserID: appointment.UserID,
	})
}

// DeleteAppointment deletes an appointment.
func DeleteAppointment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	apptID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var appointment models.Appointment
	if err := database.DB.First(&appointment, apptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if appointment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to delete this appointment"})
		return
	}

	if err := database.DB.Delete(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment"})
		return
	}

	c.Status(http.StatusNoContent)
}
