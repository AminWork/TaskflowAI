package models

import (
	"time"
)

// RocketChat Room Types
const (
	RoomTypeChannel    = "c" // Public channel
	RoomTypePrivate    = "p" // Private group
	RoomTypeDirect     = "d" // Direct message
	RoomTypeDiscussion = "l" // Discussion/thread
)

// RocketChat User Status
const (
	StatusOnline    = "online"
	StatusAway      = "away"
	StatusBusy      = "busy"
	StatusInvisible = "invisible"
	StatusOffline   = "offline"
)

// RocketChat Message Types
const (
	MessageTypeRegular     = "message"
	MessageTypeSystem      = "system"
	MessageTypeFile        = "file"
	MessageTypeVideo       = "video"
	MessageTypeAudio       = "audio"
	MessageTypeImage       = "image"
	MessageTypeJoinRoom    = "uj"  // user joined
	MessageTypeLeaveRoom   = "ul"  // user left
	MessageTypeRoomCreated = "r"   // room created
	MessageTypeRoomRenamed = "rn"  // room renamed
)

// RocketChat User model with presence and status
type RocketChatUser struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Username    string    `json:"username" gorm:"unique;not null"`
	Email       string    `json:"email" gorm:"unique;not null"`
	Name        string    `json:"name" gorm:"not null"`
	Password    string    `json:"-" gorm:"not null"`
	Avatar      string    `json:"avatar"`
	Status      string    `json:"status" gorm:"default:'offline'"` // online, away, busy, invisible, offline
	StatusText  string    `json:"statusText"`
	LastLogin   *time.Time `json:"lastLogin"`
	IsActive    bool      `json:"active" gorm:"default:true"`
	IsAdmin     bool      `json:"admin" gorm:"default:false"`
	Roles       []string  `json:"roles" gorm:"serializer:json"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relationships
	Rooms        []RocketChatRoom        `json:"rooms" gorm:"many2many:room_users;"`
	Messages     []RocketChatMessage     `json:"messages" gorm:"foreignKey:UserID"`
	Subscriptions []RocketChatSubscription `json:"subscriptions" gorm:"foreignKey:UserID"`
}

// RocketChat Room model (channels, groups, DMs)
type RocketChatRoom struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	RoomID      string    `json:"_id" gorm:"unique;not null"` // Rocket.Chat style room ID
	Name        string    `json:"name" gorm:"not null"`
	DisplayName string    `json:"fname"` // Display name for rooms
	Type        string    `json:"t" gorm:"not null"` // c=channel, p=private, d=direct
	Topic       string    `json:"topic"`
	Description string    `json:"description"`
	Announcement string   `json:"announcement"`
	CreatedBy   uint      `json:"u" gorm:"not null"`
	IsDefault   bool      `json:"default" gorm:"default:false"`
	IsReadOnly  bool      `json:"ro" gorm:"default:false"`
	IsArchived  bool      `json:"archived" gorm:"default:false"`
	IsFeatured  bool      `json:"featured" gorm:"default:false"`
	MessageCount int64    `json:"msgs" gorm:"default:0"`
	LastMessage *time.Time `json:"lm"`
	CreatedAt   time.Time `json:"ts"`
	UpdatedAt   time.Time `json:"_updatedAt"`

	// Relationships
	Creator       RocketChatUser          `json:"creator" gorm:"foreignKey:CreatedBy"`
	Users         []RocketChatUser        `json:"users" gorm:"many2many:room_users;"`
	Messages      []RocketChatMessage     `json:"messages" gorm:"foreignKey:RoomID;references:RoomID"`
	Subscriptions []RocketChatSubscription `json:"subscriptions" gorm:"foreignKey:RoomID;references:RoomID"`
}

// RocketChat Message model
type RocketChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	MessageID string    `json:"_id" gorm:"unique;not null"` // Rocket.Chat style message ID
	RoomID    string    `json:"rid" gorm:"not null"`
	UserID    uint      `json:"u" gorm:"not null"`
	Content   string    `json:"msg"`
	Type      string    `json:"t" gorm:"default:'message'"` // message, system, file, etc.
	ParseUrls bool      `json:"parseUrls" gorm:"default:true"`
	Groupable bool      `json:"groupable" gorm:"default:true"`
	
	// File attachments
	FileID       string `json:"fileID"`
	FileName     string `json:"fileName"`
	FileType     string `json:"fileType"`
	FileSize     int64  `json:"fileSize"`
	FileURL      string `json:"fileURL"`
	
	// Message metadata
	EditedAt     *time.Time `json:"editedAt"`
	EditedBy     *uint      `json:"editedBy"`
	IsEdited     bool       `json:"edited" gorm:"default:false"`
	IsStarred    bool       `json:"starred" gorm:"default:false"`
	IsPinned     bool       `json:"pinned" gorm:"default:false"`
	
	// Reactions and interactions
	Reactions    string `json:"reactions" gorm:"type:json"` // JSON array of reactions
	Replies      int    `json:"replies" gorm:"default:0"`
	ThreadID     string `json:"tmid"` // Thread message ID
	
	CreatedAt    time.Time `json:"ts"`
	UpdatedAt    time.Time `json:"_updatedAt"`

	// Relationships
	Room         RocketChatRoom `json:"room" gorm:"foreignKey:RoomID;references:RoomID"`
	User         RocketChatUser `json:"user" gorm:"foreignKey:UserID"`
	Editor       *RocketChatUser `json:"editor" gorm:"foreignKey:EditedBy"`
}

// RocketChat Subscription model (user's room subscriptions)
type RocketChatSubscription struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserID       uint      `json:"u" gorm:"not null"`
	RoomID       string    `json:"rid" gorm:"not null"`
	Name         string    `json:"name"`
	Type         string    `json:"t"` // c, p, d
	IsOpen       bool      `json:"open" gorm:"default:true"`
	IsAlert      bool      `json:"alert" gorm:"default:false"`
	IsUnread     bool      `json:"unread" gorm:"default:false"`
	UnreadCount  int       `json:"unreadCount" gorm:"default:0"`
	UserMentions int       `json:"userMentions" gorm:"default:0"`
	GroupMentions int      `json:"groupMentions" gorm:"default:0"`
	LastSeen     *time.Time `json:"ls"`
	LastRead     *time.Time `json:"lr"`
	IsHidden     bool      `json:"hidden" gorm:"default:false"`
	IsFavorite   bool      `json:"f" gorm:"default:false"`
	
	// Notification settings
	DesktopNotifications  string `json:"desktopNotifications" gorm:"default:'default'"` // default, all, mentions, nothing
	MobileNotifications   string `json:"mobilePushNotifications" gorm:"default:'default'"`
	EmailNotifications    string `json:"emailNotifications" gorm:"default:'default'"`
	AudioNotifications    string `json:"audioNotifications" gorm:"default:'default'"`
	
	CreatedAt    time.Time `json:"ts"`
	UpdatedAt    time.Time `json:"_updatedAt"`

	// Relationships
	User         RocketChatUser `json:"user" gorm:"foreignKey:UserID"`
	Room         RocketChatRoom `json:"room" gorm:"foreignKey:RoomID;references:RoomID"`
	
	// Unique constraint
	_ struct{} `gorm:"uniqueIndex:idx_user_room"`
}

// RocketChat Settings model
type RocketChatSettings struct {
	ID    uint   `json:"id" gorm:"primaryKey"`
	Key   string `json:"_id" gorm:"unique;not null"`
	Value string `json:"value" gorm:"type:text"`
	Type  string `json:"type"` // string, boolean, int, etc.
	
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`
}

// RocketChat Integration model
type RocketChatIntegration struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Type     string `json:"type" gorm:"not null"` // webhook-incoming, webhook-outgoing, etc.
	Name     string `json:"name" gorm:"not null"`
	Enabled  bool   `json:"enabled" gorm:"default:true"`
	Username string `json:"username"`
	Channel  string `json:"channel"`
	ScriptEnabled bool `json:"scriptEnabled" gorm:"default:false"`
	Script   string `json:"script" gorm:"type:text"`
	
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`
}

// RocketChat Presence model for real-time user status
type RocketChatPresence struct {
	UserID       uint      `json:"userId" gorm:"primaryKey"`
	Status       string    `json:"status" gorm:"not null"` // online, away, busy, invisible, offline
	ConnectionID string    `json:"connectionId"`
	LastSeen     time.Time `json:"lastSeen"`
	
	// Relationships
	User RocketChatUser `json:"user" gorm:"foreignKey:UserID"`
}

// Request DTOs for RocketChat API compatibility
type RocketChatLoginRequest struct {
	User     string `json:"user" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RocketChatRegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type RocketChatCreateRoomRequest struct {
	Name        string   `json:"name" binding:"required"`
	Type        string   `json:"type" binding:"required,oneof=c p d"`
	Members     []string `json:"members"`
	ReadOnly    bool     `json:"readOnly"`
	Description string   `json:"description"`
	Topic       string   `json:"topic"`
}

type RocketChatSendMessageRequest struct {
	RoomID  string `json:"roomId" binding:"required"`
	Message string `json:"message" binding:"required"`
	Alias   string `json:"alias"`
	Emoji   string `json:"emoji"`
	Avatar  string `json:"avatar"`
}

type RocketChatUpdateMessageRequest struct {
	RoomID    string `json:"roomId" binding:"required"`
	MessageID string `json:"msgId" binding:"required"`
	Text      string `json:"text" binding:"required"`
}

// Response DTOs for RocketChat API compatibility
type RocketChatLoginResponse struct {
	Status string `json:"status"`
	Data   struct {
		UserID    string `json:"userId"`
		AuthToken string `json:"authToken"`
		Me        RocketChatUserResponse `json:"me"`
	} `json:"data"`
}

type RocketChatUserResponse struct {
	ID       string    `json:"_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	Status   string    `json:"status"`
	Active   bool      `json:"active"`
	Roles    []string  `json:"roles"`
	Settings struct {
		Preferences struct {
			EnableAutoAway                bool   `json:"enableAutoAway"`
			IdleTimeoutLimit              int    `json:"idleTimeoutLimit"`
			DesktopNotificationRequireInteraction bool `json:"desktopNotificationRequireInteraction"`
			DesktopNotifications          string `json:"desktopNotifications"`
			MobileNotifications           string `json:"mobileNotifications"`
			UnreadAlert                   bool   `json:"unreadAlert"`
			UseEmojis                     bool   `json:"useEmojis"`
			ConvertAsciiEmoji             bool   `json:"convertAsciiEmoji"`
			AutoImageLoad                 bool   `json:"autoImageLoad"`
			SaveMobileBandwidth           bool   `json:"saveMobileBandwidth"`
			CollapseMediaByDefault        bool   `json:"collapseMediaByDefault"`
			HideUsernames                 bool   `json:"hideUsernames"`
			HideRoles                     bool   `json:"hideRoles"`
			HideFlexTab                   bool   `json:"hideFlexTab"`
			HideAvatars                   bool   `json:"hideAvatars"`
			RoomCounterSidebar            bool   `json:"roomCounterSidebar"`
			Language                      string `json:"language"`
			SidebarShowFavorites          bool   `json:"sidebarShowFavorites"`
			SidebarShowUnread             bool   `json:"sidebarShowUnread"`
			SidebarSortby                 string `json:"sidebarSortby"`
			SidebarViewMode               string `json:"sidebarViewMode"`
			SidebarDisplayAvatar          bool   `json:"sidebarDisplayAvatar"`
			SidebarGroupByType            bool   `json:"sidebarGroupByType"`
			MuteFocusedConversations      bool   `json:"muteFocusedConversations"`
		} `json:"preferences"`
	} `json:"settings"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"_updatedAt"`
}

type RocketChatRoomResponse struct {
	ID           string    `json:"_id"`
	Name         string    `json:"name"`
	DisplayName  string    `json:"fname"`
	Type         string    `json:"t"`
	MessageCount int64     `json:"msgs"`
	UsersCount   int       `json:"usersCount"`
	LastMessage  *struct {
		ID        string    `json:"_id"`
		RoomID    string    `json:"rid"`
		Message   string    `json:"msg"`
		Timestamp time.Time `json:"ts"`
		User      struct {
			ID       string `json:"_id"`
			Username string `json:"username"`
			Name     string `json:"name"`
		} `json:"u"`
	} `json:"lastMessage"`
	Topic        string    `json:"topic"`
	Description  string    `json:"description"`
	Announcement string    `json:"announcement"`
	ReadOnly     bool      `json:"ro"`
	Default      bool      `json:"default"`
	Featured     bool      `json:"featured"`
	Archived     bool      `json:"archived"`
	CreatedAt    time.Time `json:"ts"`
	UpdatedAt    time.Time `json:"_updatedAt"`
}

type RocketChatMessageResponse struct {
	ID        string    `json:"_id"`
	RoomID    string    `json:"rid"`
	Message   string    `json:"msg"`
	Timestamp time.Time `json:"ts"`
	UpdatedAt time.Time `json:"_updatedAt"`
	User      struct {
		ID       string `json:"_id"`
		Username string `json:"username"`
		Name     string `json:"name"`
	} `json:"u"`
	EditedAt  *time.Time `json:"editedAt,omitempty"`
	EditedBy  *struct {
		ID       string `json:"_id"`
		Username string `json:"username"`
	} `json:"editedBy,omitempty"`
	Reactions map[string]struct {
		Usernames []string `json:"usernames"`
	} `json:"reactions,omitempty"`
	Replies   int    `json:"replies,omitempty"`
	ThreadID  string `json:"tmid,omitempty"`
	File      *struct {
		ID   string `json:"_id"`
		Name string `json:"name"`
		Type string `json:"type"`
		Size int64  `json:"size"`
		URL  string `json:"url"`
	} `json:"file,omitempty"`
	Attachments []struct {
		Title     string `json:"title"`
		TitleLink string `json:"title_link"`
		Text      string `json:"text"`
		Color     string `json:"color"`
		ImageURL  string `json:"image_url"`
		ThumbURL  string `json:"thumb_url"`
	} `json:"attachments,omitempty"`
}

type RocketChatSubscriptionResponse struct {
	ID           string     `json:"_id"`
	Open         bool       `json:"open"`
	Alert        bool       `json:"alert"`
	Unread       bool       `json:"unread"`
	UnreadCount  int        `json:"unreadCount"`
	UserMentions int        `json:"userMentions"`
	GroupMentions int       `json:"groupMentions"`
	LastSeen     *time.Time `json:"ls"`
	Name         string     `json:"name"`
	Type         string     `json:"t"`
	RoomID       string     `json:"rid"`
	UserID       string     `json:"u"`
	CreatedAt    time.Time  `json:"ts"`
	UpdatedAt    time.Time  `json:"_updatedAt"`
	Room         RocketChatRoomResponse `json:"room"`
}
