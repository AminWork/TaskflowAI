package main

import (
	"net/http"
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
    columnHandler := handlers.NewColumnHandler()
	chatHandler := handlers.NewChatHandler(hub)
	privateMessageHandler := handlers.NewPrivateMessageHandler(hub)

	// Setup router with custom configuration
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	// Set maximum multipart memory to 10MB
	router.MaxMultipartMemory = 10 << 20 // 10 MB

	// Middleware
	router.Use(middleware.CORSMiddleware())

	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll("/app/uploads", 0755); err != nil {
		logger.Log.Fatal("Failed to create uploads directory", err)
	}

	// Static file serving for uploads
	router.Static("/uploads", "/app/uploads")

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
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/:id", authHandler.GetUser)
			}
			
			// Member profile routes
			profile := protected.Group("/profile")
			{
				profile.GET("", handlers.GetMemberProfile)
				profile.PUT("", handlers.UpdateMemberProfile)
				profile.POST("/upload-resume", handlers.UploadResumeFile)
				profile.DELETE("/resume", handlers.DeleteResumeFile)
			}

			// Board routes
			boards := protected.Group("/boards")
			{
				boards.POST("", boardHandler.CreateBoard)
				boards.GET("", boardHandler.GetBoards)
				boards.GET("/:id", boardHandler.GetBoard)
				boards.PUT("/:id", boardHandler.UpdateBoard)
				// Column routes
				boards.GET("/:id/columns", columnHandler.GetColumns)
				boards.POST("/:id/columns", columnHandler.CreateColumn)
				boards.DELETE("/:id", boardHandler.DeleteBoard)
				boards.POST("/:id/invite", boardHandler.InviteUser)
				boards.DELETE("/:id/members/:userId", boardHandler.RemoveMember)
				boards.PUT("/:id/members/:userId/role", boardHandler.UpdateMemberRole)
				
				// LLM routes
				boards.GET("/:id/llm-config", handlers.GetLLMConfig)
				boards.PUT("/:id/llm-config", handlers.UpdateLLMConfig)
				boards.POST("/:id/generate-tasks", handlers.GenerateTasks)
				boards.POST("/:id/llm-models/search", handlers.SearchLLMModels)
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

			// Chat routes
			chat := protected.Group("/chat")
			{
				chat.POST("/boards/:boardId/messages", chatHandler.SendMessage)
				chat.GET("/boards/:boardId/messages", chatHandler.GetMessages)
				chat.GET("/boards/:boardId/members", chatHandler.GetBoardMembers)
				chat.DELETE("/messages/:messageId", chatHandler.DeleteMessage)
				chat.GET("/users/search", chatHandler.SearchUsers)
			}

			// Private message routes
			privateMessages := protected.Group("/private-messages")
			{
				privateMessages.POST("", privateMessageHandler.SendPrivateMessage)
				privateMessages.GET("/conversations", privateMessageHandler.GetConversations)
				privateMessages.GET("/users/:userId", privateMessageHandler.GetMessages)
				privateMessages.PUT("/users/:senderId/read", privateMessageHandler.MarkAsRead)
				privateMessages.GET("/unread-counts", privateMessageHandler.GetUnreadCounts)
			}

			// Appointment routes
			appointments := protected.Group("/appointments")
			{
				appointments.GET("", handlers.GetAppointments)
				appointments.POST("", handlers.CreateAppointment)
				appointments.PUT("/:id", handlers.UpdateAppointment)
				appointments.DELETE("/:id", handlers.DeleteAppointment)
			}

			// WebSocket routes
			protected.GET("/ws/:id", func(c *gin.Context) {
				boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
				if err != nil {
					c.JSON(400, gin.H{"error": "Invalid board ID"})
					return
				}
				c.Set("board_id", uint(boardID))
				hub.HandleWebSocket(c)
			})

			// WebSocket route for private messages
			protected.GET("/ws/private", func(c *gin.Context) {
				// No board ID for private messages, just use user ID
				c.Set("board_id", uint(0)) // Use 0 as a special value for private messages
				hub.HandleWebSocket(c)
			})

			// WebSocket route for typing notifications
			protected.POST("/private-messages/typing", func(c *gin.Context) {
				userID := middleware.GetUserID(c)
				
				var req struct {
					RecipientID uint `json:"recipient_id" binding:"required"`
					IsTyping    bool `json:"is_typing"`
				}

				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				// Broadcast typing notification
				hub.BroadcastTypingNotification(req.RecipientID, userID, req.IsTyping)

				c.JSON(http.StatusOK, gin.H{"message": "Typing notification sent"})
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