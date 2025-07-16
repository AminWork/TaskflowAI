package models

import (
	"time"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Name      string    `json:"name" gorm:"not null"`
	Password  string    `json:"-" gorm:"not null"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	OwnedBoards []Board       `json:"owned_boards" gorm:"foreignKey:CreatedBy"`
	Members     []BoardMember `json:"board_memberships" gorm:"foreignKey:UserID"`
}

type Board struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	IsPublic    bool      `json:"is_public" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Creator     User          `json:"creator" gorm:"foreignKey:CreatedBy"`
	Members     []BoardMember `json:"members" gorm:"foreignKey:BoardID"`
	Tasks       []Task        `json:"tasks" gorm:"foreignKey:BoardID"`
	Invitations []Invitation  `json:"invitations" gorm:"foreignKey:BoardID"`
	Settings    BoardSettings `json:"settings" gorm:"foreignKey:BoardID"`
}

type BoardMember struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	BoardID  uint   `json:"board_id" gorm:"not null"`
	UserID   uint   `json:"user_id" gorm:"not null"`
	Role     string `json:"role" gorm:"not null;default:'member'"` // owner, admin, member, viewer
	JoinedAt time.Time `json:"joined_at"`

	// Relationships
	Board       Board              `json:"board" gorm:"foreignKey:BoardID"`
	User        User               `json:"user" gorm:"foreignKey:UserID"`
	Permissions []MemberPermission `json:"permissions" gorm:"foreignKey:MemberID"`

	// Unique constraint
	_ struct{} `gorm:"uniqueIndex:idx_board_user"`
}

type MemberPermission struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	MemberID uint   `json:"member_id" gorm:"not null"`
	Action   string `json:"action" gorm:"not null"` // create_task, edit_task, delete_task, move_task, invite_users, manage_board
	Granted  bool   `json:"granted" gorm:"default:true"`

	// Relationships
	Member BoardMember `json:"member" gorm:"foreignKey:MemberID"`
}

type BoardSettings struct {
	ID                           uint `json:"id" gorm:"primaryKey"`
	BoardID                      uint `json:"board_id" gorm:"not null;unique"`
	AllowGuestAccess             bool `json:"allow_guest_access" gorm:"default:false"`
	RequireApprovalForNewMembers bool `json:"require_approval_for_new_members" gorm:"default:false"`
	DefaultMemberRole            string `json:"default_member_role" gorm:"default:'member'"`

	// Relationships
	Board *Board `json:"-" gorm:"foreignKey:BoardID"`
}

type Task struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Title          string    `json:"title" gorm:"not null"`
	Description    string    `json:"description"`
	Priority       string    `json:"priority" gorm:"not null;default:'medium'"` // low, medium, high
	Category       string    `json:"category"`
	Status         string    `json:"status" gorm:"not null;default:'todo'"` // todo, inprogress, done
	BoardID        uint      `json:"board_id" gorm:"not null"`
	CreatedBy      uint      `json:"created_by" gorm:"not null"`
	AssigneeID     *uint     `json:"assignee_id"`
	EstimatedHours *float64  `json:"estimated_hours"`
	ActualHours    *float64  `json:"actual_hours"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relationships
	Board    Board     `json:"board" gorm:"foreignKey:BoardID"`
	Creator  User      `json:"creator" gorm:"foreignKey:CreatedBy"`
	Assignee *User     `json:"assignee" gorm:"foreignKey:AssigneeID"`
	Tags     []TaskTag `json:"tags" gorm:"foreignKey:TaskID"`
}

type TaskTag struct {
	ID     uint   `json:"id" gorm:"primaryKey"`
	TaskID uint   `json:"task_id" gorm:"not null"`
	Tag    string `json:"tag" gorm:"not null"`

	// Relationships
	Task Task `json:"task" gorm:"foreignKey:TaskID"`
}

type Invitation struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	BoardID       uint      `json:"board_id" gorm:"not null"`
	InvitedBy     uint      `json:"invited_by" gorm:"not null"`
	InvitedEmail  string    `json:"invited_email" gorm:"not null"`
	Role          string    `json:"role" gorm:"not null;default:'member'"`
	Status        string    `json:"status" gorm:"not null;default:'pending'"` // pending, accepted, declined, expired
	Token         string    `json:"token" gorm:"unique;not null"`
	ExpiresAt     time.Time `json:"expires_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	Board     Board `json:"board" gorm:"foreignKey:BoardID"`
	Inviter   User  `json:"inviter" gorm:"foreignKey:InvitedBy"`
}

type ChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	BoardID   uint      `json:"board_id" gorm:"not null"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	Content   string    `json:"content" gorm:"not null"`
	Sender    string    `json:"sender" gorm:"not null"` // user, ai
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Board Board `json:"board" gorm:"foreignKey:BoardID"`
	User  User  `json:"user" gorm:"foreignKey:UserID"`
}

// Response DTOs
type UserResponse struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
}

type BoardResponse struct {
	ID          uint                `json:"id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	CreatedBy   uint                `json:"created_by"`
	IsPublic    bool                `json:"is_public"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
	Members     []BoardMemberResponse `json:"members"`
	Settings    BoardSettings       `json:"settings"`
}

type BoardMemberResponse struct {
	UserID      uint                     `json:"user_id"`
	Email       string                   `json:"email"`
	Name        string                   `json:"name"`
	Avatar      string                   `json:"avatar"`
	Role        string                   `json:"role"`
	JoinedAt    time.Time                `json:"joined_at"`
	Permissions []MemberPermissionResponse `json:"permissions"`
}

type MemberPermissionResponse struct {
	Action  string `json:"action"`
	Granted bool   `json:"granted"`
}

type TaskResponse struct {
	ID             uint      `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Priority       string    `json:"priority"`
	Category       string    `json:"category"`
	Status         string    `json:"status"`
	BoardID        uint      `json:"board_id"`
	CreatedBy      uint      `json:"created_by"`
	AssigneeID     *uint     `json:"assignee_id"`
	EstimatedHours *float64  `json:"estimated_hours"`
	ActualHours    *float64  `json:"actual_hours"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Tags           []string  `json:"tags"`
}

// Request DTOs
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required,min=2"`
	Password string `json:"password" binding:"required,min=6"`
}

type CreateBoardRequest struct {
	Title       string `json:"title" binding:"required,min=1"`
	Description string `json:"description"`
}

type UpdateBoardRequest struct {
	Title       string `json:"title" binding:"required,min=1"`
	Description string `json:"description"`
}

type InviteUserRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=admin member viewer"`
}

type CreateTaskRequest struct {
	Title          string   `json:"title" binding:"required,min=1"`
	Description    string   `json:"description"`
	Priority       string   `json:"priority" binding:"required,oneof=low medium high"`
	Category       string   `json:"category"`
	Status         string   `json:"status" binding:"required,oneof=todo inprogress done"`
	AssigneeID     *uint    `json:"assignee_id"`
	EstimatedHours *float64 `json:"estimated_hours"`
	Tags           []string `json:"tags"`
}

type UpdateTaskRequest struct {
	Title          string   `json:"title" binding:"required,min=1"`
	Description    string   `json:"description"`
	Priority       string   `json:"priority" binding:"required,oneof=low medium high"`
	Category       string   `json:"category"`
	Status         string   `json:"status" binding:"required,oneof=todo inprogress done"`
	AssigneeID     *uint    `json:"assignee_id"`
	EstimatedHours *float64 `json:"estimated_hours"`
	ActualHours    *float64 `json:"actual_hours"`
	Tags           []string `json:"tags"`
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=admin member viewer"`
}

type ChatMessageRequest struct {
	Content string `json:"content" binding:"required,min=1"`
	Sender  string `json:"sender" binding:"required,oneof=user ai"`
}