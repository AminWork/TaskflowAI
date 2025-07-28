package models

import "time"

// Column represents a Kanban column/list belonging to a board.
type Column struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    BoardID   uint      `json:"board_id" gorm:"not null;index"`
    Title     string    `json:"title" gorm:"not null"`
    Status    string    `json:"status" gorm:"not null;uniqueIndex:idx_board_status"` // slugified unique per board
    Color     string    `json:"color"`
    Position  int       `json:"position" gorm:"not null;default:0"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`

    Board Board `json:"-" gorm:"foreignKey:BoardID"`
}

// CreateColumnRequest is the payload for creating a new column.
type CreateColumnRequest struct {
    Title  string `json:"title" binding:"required,min=1"`
    Status string `json:"status" binding:"required,min=1"`
    Color  string `json:"color"`
}
