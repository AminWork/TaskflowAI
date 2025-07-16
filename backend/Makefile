.PHONY: build run dev clean test deps

# Build the application
build:
	go build -o bin/server cmd/server/main.go

# Run the application
run: build
	./bin/server

# Run in development mode with hot reload (requires air)
dev:
	air

# Clean build artifacts
clean:
	rm -rf bin/

# Run tests
test:
	go test -v ./...

# Download dependencies
deps:
	go mod download
	go mod tidy

# Install development tools
install-tools:
	go install github.com/cosmtrek/air@latest

# Database migration (if needed)
migrate:
	@echo "Database auto-migration is handled by GORM"

# Generate API documentation (if using swag)
docs:
	@echo "API documentation can be generated with swag if needed"

# Docker commands
docker-build:
	docker build -t kanban-backend .

docker-run:
	docker run -p 8080:8080 kanban-backend

# Help
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  run           - Build and run the application"
	@echo "  dev           - Run in development mode with hot reload"
	@echo "  clean         - Clean build artifacts"
	@echo "  test          - Run tests"
	@echo "  deps          - Download and tidy dependencies"
	@echo "  install-tools - Install development tools"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  help          - Show this help message"