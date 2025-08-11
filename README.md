# TaskflowAI — AI‑assisted Kanban with real‑time collaboration

A modern, real‑time collaborative Kanban application with team messaging and optional AI assistance for task generation.

![Project Screenshot](https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=630&fit=crop)

## ✨ Features

- __Task management__: Create, view, update, delete tasks; move tasks across columns; per‑board columns
- __Boards & collaboration__: Create boards, invite/remove members, update member roles; live updates via WebSockets
- __Messaging__:
  - Board chat: `/api/chat/boards/:boardId/messages`
  - Private messages with typing notifications and unread counts
- __AI assistance__:
  - Board‑level LLM configuration (OpenAI or OpenRouter)
  - Secure per‑board API key storage (owner‑only writes)
  - Search provider models: `POST /api/boards/:id/llm-models/search`
  - Generate tasks from description: `POST /api/boards/:id/generate-tasks`
- __Appointments__: Create and manage board‑related appointments
- __User profile__: Profile read/update; resume file upload
- __Internationalization & dark mode__: Language and theme support in the UI

## 🛠️ Tech Stack

- __Frontend__:
  - React + TypeScript + Vite
  - Tailwind CSS, Framer Motion, Lucide Icons
  - Recharts, react-big-calendar
- __Backend__:
  - Go (Gin), Gorilla WebSocket, Zap logging
  - GORM ORM with Postgres or SQLite fallback
  - JWT authentication
- __Infrastructure__:
  - Docker Compose: Postgres (db), Go API (backend), Nginx (reverse proxy), Vite build (frontend)
  - WebSockets for real‑time updates
  - Nginx serves frontend and proxies API/WebSockets

## 🚀 Quick Start (Docker)

Prerequisites: Docker & Docker Compose

1. Clone and enter the repo
   ```bash
   git clone [https://github.com/your-org/TaskflowAI.git](https://github.com/your-org/TaskflowAI.git)
   cd TaskflowAI