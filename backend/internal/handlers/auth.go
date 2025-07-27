package handlers

import (
	"net/http"
	"strconv"

	"kanban-backend/internal/auth"
	"kanban-backend/internal/database"
	"kanban-backend/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.GetDB().Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
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
	user := models.User{
		Email:    req.Email,
		Name:     req.Name,
		Password: string(hashedPassword),
		Avatar:   "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
	}

	if err := database.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":  userResponse,
		"token": token,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	if err := database.GetDB().Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  userResponse,
		"token": token,
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	userResponse := models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusOK, userResponse)
}

// GetUser retrieves a user's public profile by ID
func (h *AuthHandler) GetUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := database.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	userResponse := models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Avatar:    user.Avatar,
		CreatedAt: user.CreatedAt,
	}

	c.JSON(http.StatusOK, userResponse)
}