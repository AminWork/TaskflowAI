# Project Bolt - Modern Kanban Board with Real-Time Collaboration

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A full-featured, real-time collaborative Kanban board application with advanced task management, team collaboration features, and integrated messaging systems.

![Project Screenshot](https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=630&fit=crop)

## ✨ Features

### 📋 Task Management
- Drag-and-drop Kanban board interface
- Task creation, editing, and deletion
- Priority levels and due dates
- Task categorization and tagging
- Task assignment to team members
- Progress tracking and status updates

### 👥 Team Collaboration
- Multi-user boards with permission management
- Role-based access control (owner, admin, member, viewer)
- User invitations and team management
- Real-time updates across all users
- Shared workspaces

### 💬 Communication Tools
- **Board Chat:** Discuss tasks and projects with team members
- **Private Messaging:** Direct communication between users
- **Real-time Notifications:** Get alerted for new messages
- **Message Indicators:** Typing indicators, read receipts
- **File Sharing:** Share documents within chats

### 📊 Analytics & Insights
- Task completion metrics
- Productivity tracking
- Time estimation vs. actual time spent
- Custom filtering and reporting

### 🎨 User Experience
- Responsive design for desktop and mobile
- Dark and light theme options
- Multiple language support
- Customizable board layouts
- Keyboard shortcuts for power users

## 🛠️ Technologies

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide Icons** for beautiful iconography

### Backend
- **Go** (Golang) with Gin web framework
- **PostgreSQL** database
- **GORM** for ORM
- **JWT** for authentication

### Infrastructure
- **Docker** containerization
- **WebSockets** for real-time communication
- **RESTful API** architecture

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for development)
- Go (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/project-bolt.git
   cd project-bolt
   ```

2. Start the application with Docker:
   ```bash
   docker-compose up --build -d
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

### Development Setup

1. Install backend dependencies:
   ```bash
   cd backend
   go mod download
   ```

2. Install frontend dependencies:
   ```bash
   cd ..
   npm install
   ```

3. Run backend in development mode:
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

4. Run frontend in development mode:
   ```bash
   npm run dev
   ```

## 📱 Usage Guide

### Creating a Board
1. Log in to your account
2. Click "Create Board" on the dashboard
3. Enter board details and select visibility settings
4. Click "Create" to set up your new board

### Managing Tasks
1. Add a new task with the "+" button in any column
2. Drag and drop tasks between columns to update status
3. Click on a task to view details or edit
4. Use filters to sort and find specific tasks

### Team Collaboration
1. Invite team members via email from the board settings
2. Assign roles to control permissions
3. Assign tasks to team members
4. Use board chat for team discussions

### Private Messaging
1. Click the mail icon to access private messages
2. Select a user or start a new conversation
3. Send messages, which appear in real-time
4. Receive notifications when new messages arrive

## 🗂️ Project Structure

```
project-bolt/
├── backend/              # Go backend
│   ├── cmd/              # Application entry points
│   ├── internal/         # Internal packages
│   │   ├── auth/         # Authentication
│   │   ├── database/     # Database access
│   │   ├── handlers/     # API handlers
│   │   ├── middleware/   # HTTP middleware
│   │   ├── models/       # Data models
│   │   └── websocket/    # WebSocket implementation
├── public/               # Static assets
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── types.ts          # TypeScript type definitions
├── docker-compose.yml    # Docker configuration
└── README.md             # Project documentation
```

## 🔒 Security Features

- JWT authentication for secure API access
- Password hashing with bcrypt
- Role-based permissions system
- Secure WebSocket connections
- Input validation and sanitization

## 🌐 API Documentation

The API follows RESTful principles with these primary endpoints:

- `/api/auth/*` - Authentication and user management
- `/api/boards/*` - Board CRUD operations
- `/api/boards/:id/tasks/*` - Task management
- `/api/chat/*` - Board chat functionality
- `/api/private-messages/*` - Direct messaging between users
- `/api/ws/*` - WebSocket endpoints for real-time features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [React](https://reactjs.org/)
- [Go](https://golang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Docker](https://www.docker.com/) 