package main

import (
	"os"
	"strconv"

	"kanban-backend/internal/database"
	"kanban-backend/internal/handlers"
	"kanban-backend/internal/logger"
	"kanban-backend/internal/middleware"
	"kanban-backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Initialize structured logger
	logger.Init()
	defer logger.Sync()

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logger.Log.Info("No .env file found")
	}

	// Initialize database
	database.InitDatabase()

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	boardHandler := handlers.NewBoardHandler(hub)
	taskHandler := handlers.NewTaskHandler(hub)

	// Setup router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/profile", middleware.AuthMiddleware(), authHandler.GetProfile)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Board routes
			boards := protected.Group("/boards")
			{
				boards.POST("", boardHandler.CreateBoard)
				boards.GET("", boardHandler.GetBoards)
				boards.GET("/:id", boardHandler.GetBoard)
				boards.PUT("/:id", boardHandler.UpdateBoard)
				boards.DELETE("/:id", boardHandler.DeleteBoard)
				boards.POST("/:id/invite", boardHandler.InviteUser)
				boards.DELETE("/:id/members/:userId", boardHandler.RemoveMember)
				boards.PUT("/:id/members/:userId/role", boardHandler.UpdateMemberRole)
			}

			// Invitation routes
			invitations := protected.Group("/invitations")
			{
				invitations.GET("", boardHandler.GetInvitations)
				invitations.POST("/:id/accept", boardHandler.AcceptInvitation)
				invitations.POST("/:id/decline", boardHandler.DeclineInvitation)
			}

			// Task routes
			tasks := protected.Group("/boards/:id/tasks")
			{
				tasks.POST("", taskHandler.CreateTask)
				tasks.GET("", taskHandler.GetTasks)
			}

			taskRoutes := protected.Group("/tasks")
			{
				taskRoutes.GET("/:id", taskHandler.GetTask)
				taskRoutes.PUT("/:id", taskHandler.UpdateTask)
				taskRoutes.DELETE("/:id", taskHandler.DeleteTask)
				taskRoutes.PUT("/:id/move", taskHandler.MoveTask)
			}

			// WebSocket route
			protected.GET("/ws/:id", func(c *gin.Context) {
				boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
				if err != nil {
					c.JSON(400, gin.H{"error": "Invalid board ID"})
					return
				}
				c.Set("board_id", uint(boardID))
				hub.HandleWebSocket(c)
			})
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Log.Infof("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Log.Fatal("Failed to start server", err)
	}
}