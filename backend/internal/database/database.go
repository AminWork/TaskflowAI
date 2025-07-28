package database

import (
	"os"

	"kanban-backend/internal/models"
	"kanban-backend/internal/logger"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() {
	// Check if a DSN for Postgres is provided; fall back to SQLite otherwise
	dsn := os.Getenv("DB_DSN")

	var (
		err error
	)

	if dsn != "" {
		// Use PostgreSQL
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: loggerzap(),
		})
	} else {
		// Default to SQLite (development / lightweight)
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "./kanban.db"
		}

		DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: loggerzap(),
		})
	}

	if err != nil {
		logger.Log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate the schema
	err = DB.AutoMigrate(
		&models.User{},
		&models.Board{},
		&models.BoardMember{},
		&models.MemberPermission{},
		&models.BoardSettings{},
		&models.Task{},
		&models.TaskTag{},
        &models.Column{},
		&models.Invitation{},
		&models.ChatMessage{},
		&models.PrivateMessage{},
		&models.Appointment{},
	)
	if err != nil {
		logger.Log.Fatalf("Failed to migrate database: %v", err)
	}

	logger.Log.Info("Database connected and migrated successfully")
}

func loggerzap() gormlogger.Interface {
	return gormlogger.Default.LogMode(gormlogger.Info)
}

func GetDB() *gorm.DB {
	return DB
}