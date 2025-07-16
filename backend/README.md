# Kanban Backend API

A comprehensive Go backend for the AI-powered Kanban application with real-time collaboration features.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **Multi-User Collaboration**: Real-time updates via WebSockets
- **Board Management**: Create, manage, and share kanban boards
- **Task Management**: Full CRUD operations with drag-and-drop support
- **Team Management**: Invite users, manage roles and permissions
- **Real-time Updates**: WebSocket integration for live collaboration
- **RESTful API**: Clean, well-documented API endpoints

## Tech Stack

- **Go 1.21+**: Modern Go with generics support
- **Gin**: Fast HTTP web framework
- **GORM**: ORM with SQLite database
- **JWT**: Secure authentication
- **WebSockets**: Real-time communication
- **SQLite**: Embedded database for development

## Quick Start

### Prerequisites

- Go 1.21 or higher
- Make (optional, for using Makefile commands)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
make deps
# or
go mod download
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./kanban.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

5. Run the application:
```bash
make run
# or
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/invite` - Invite user to board
- `DELETE /api/boards/:id/members/:userId` - Remove member
- `PUT /api/boards/:id/members/:userId/role` - Update member role

### Invitations
- `GET /api/invitations` - Get user's invitations
- `POST /api/invitations/:id/accept` - Accept invitation
- `POST /api/invitations/:id/decline` - Decline invitation

### Tasks
- `GET /api/boards/:boardId/tasks` - Get board tasks
- `POST /api/boards/:boardId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/move` - Move task between columns

### WebSocket
- `GET /api/ws/:boardId` - WebSocket connection for real-time updates

## Database Schema

The application uses the following main entities:

- **Users**: User accounts with authentication
- **Boards**: Kanban boards with settings
- **BoardMembers**: User-board relationships with roles
- **MemberPermissions**: Granular permissions per member
- **Tasks**: Individual tasks with status, priority, etc.
- **TaskTags**: Tags associated with tasks
- **Invitations**: Board invitation system
- **ChatMessages**: AI chat messages (future feature)

## Permissions System

The application implements a role-based permission system:

### Roles
- **Owner**: Full control over the board
- **Admin**: Can manage board and members (except owner)
- **Member**: Can create, edit, and delete tasks
- **Viewer**: Read-only access

### Permissions
- `create_task`: Create new tasks
- `edit_task`: Edit existing tasks
- `delete_task`: Delete tasks
- `move_task`: Move tasks between columns
- `invite_users`: Invite new users to board
- `manage_board`: Manage board settings and members

## Real-time Features

The application supports real-time collaboration through WebSockets:

- **Task Updates**: Live updates when tasks are created, edited, or moved
- **Member Changes**: Real-time member additions/removals
- **Board Updates**: Live board setting changes
- **Presence**: User presence indicators (future feature)

## Development

### Running in Development Mode

Install Air for hot reloading:
```bash
make install-tools
```

Run with hot reload:
```bash
make dev
```

### Running Tests

```bash
make test
```

### Building for Production

```bash
make build
```

## Docker Support

Build Docker image:
```bash
make docker-build
```

Run with Docker:
```bash
make docker-run
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `JWT_SECRET` | JWT signing secret | Required |
| `DB_PATH` | SQLite database path | `./kanban.db` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

## Security Considerations

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Configure proper CORS origins
- Implement rate limiting for production
- Use a production database (PostgreSQL/MySQL)
- Add input validation and sanitization
- Implement proper logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.