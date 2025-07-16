package database

import (
	"log"
	"os"

	"kanban-backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./kanban.db"
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
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
		&models.Invitation{},
		&models.ChatMessage{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated successfully")
}

func GetDB() *gorm.DB {
	return DB
}