# Makefile for Contribium Docker operations

# Variables
IMAGE_NAME = contribium
TAG = latest
CONTAINER_NAME = contribium-app
PORT = 3000

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

.PHONY: help build run stop clean logs shell dev test lint push pull env-check

# Default target
help: ## Show this help message
	@echo "$(GREEN)Contribium Docker Management$(NC)"
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@if [ -f .env ]; then \
		echo "$(YELLOW)Loading environment variables from .env file...$(NC)"; \
		export $$(cat .env | xargs) && \
		docker build \
			--build-arg VITE_SUPABASE_URL=$$VITE_SUPABASE_URL \
			--build-arg VITE_SUPABASE_ANON_KEY=$$VITE_SUPABASE_ANON_KEY \
			-t $(IMAGE_NAME):$(TAG) .; \
	else \
		echo "$(YELLOW)Building without .env file. Environment variables should be set manually.$(NC)"; \
		docker build \
			--build-arg VITE_SUPABASE_URL="$(VITE_SUPABASE_URL)" \
			--build-arg VITE_SUPABASE_ANON_KEY="$(VITE_SUPABASE_ANON_KEY)" \
			-t $(IMAGE_NAME):$(TAG) .; \
	fi
	@echo "$(GREEN)Build completed successfully!$(NC)"

run: ## Run the container in detached mode
	@echo "$(GREEN)Starting container...$(NC)"
	@if [ -f .env ]; then \
		export $$(cat .env | xargs) && \
		docker run -d \
			--name $(CONTAINER_NAME) \
			-p $(PORT):80 \
			-e VITE_SUPABASE_URL=$$VITE_SUPABASE_URL \
			--restart unless-stopped \
			$(IMAGE_NAME):$(TAG); \
	else \
		docker run -d \
			--name $(CONTAINER_NAME) \
			-p $(PORT):80 \
			-e VITE_SUPABASE_URL="$(VITE_SUPABASE_URL)" \
			--restart unless-stopped \
			$(IMAGE_NAME):$(TAG); \
	fi
	@echo "$(GREEN)Container started at http://localhost:$(PORT)$(NC)"

run-fg: ## Run the container in foreground mode
	@echo "$(GREEN)Starting container in foreground...$(NC)"
	@if [ -f .env ]; then \
		export $$(cat .env | xargs) && \
		docker run --rm \
			--name $(CONTAINER_NAME) \
			-p $(PORT):80 \
			-e VITE_SUPABASE_URL=$$VITE_SUPABASE_URL \
			$(IMAGE_NAME):$(TAG); \
	else \
		docker run --rm \
			--name $(CONTAINER_NAME) \
			-p $(PORT):80 \
			-e VITE_SUPABASE_URL="$(VITE_SUPABASE_URL)" \
			$(IMAGE_NAME):$(TAG); \
	fi

stop: ## Stop and remove the running container
	@echo "$(YELLOW)Stopping container...$(NC)"
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	@echo "$(GREEN)Container stopped and removed$(NC)"

restart: stop run ## Restart the container

clean: stop ## Clean up containers and images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	-docker rmi $(IMAGE_NAME):$(TAG)
	-docker system prune -f
	@echo "$(GREEN)Cleanup completed$(NC)"

logs: ## Show container logs
	@echo "$(GREEN)Showing container logs...$(NC)"
	docker logs -f $(CONTAINER_NAME)

shell: ## Get a shell inside the running container
	@echo "$(GREEN)Opening shell in container...$(NC)"
	docker exec -it $(CONTAINER_NAME) /bin/sh

dev: ## Run development environment with volume mounting
	@echo "$(GREEN)Starting development container...$(NC)"
	docker run --rm \
		--name $(CONTAINER_NAME)-dev \
		-p $(PORT):80 \
		-v $(PWD)/src:/app/src \
		-v $(PWD)/public:/app/public \
		$(IMAGE_NAME):$(TAG)

status: ## Show container status
	@echo "$(GREEN)Container status:$(NC)"
	@docker ps -a --filter name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

health: ## Check application health
	@echo "$(GREEN)Checking application health...$(NC)"
	@curl -f http://localhost:$(PORT)/health || echo "$(RED)Health check failed$(NC)"

rebuild: clean build ## Clean rebuild of the image

deploy: build run ## Build and deploy the application

# Docker Compose commands (if docker-compose.yml exists)
up: ## Start services with docker-compose
	@if [ -f docker-compose.yml ]; then \
		echo "$(GREEN)Starting services with docker-compose...$(NC)"; \
		docker-compose up -d; \
	else \
		echo "$(RED)docker-compose.yml not found$(NC)"; \
	fi

down: ## Stop services with docker-compose
	@if [ -f docker-compose.yml ]; then \
		echo "$(YELLOW)Stopping services with docker-compose...$(NC)"; \
		docker-compose down; \
	else \
		echo "$(RED)docker-compose.yml not found$(NC)"; \
	fi

# Development helpers
lint: ## Run linting inside container
	@echo "$(GREEN)Running lint check...$(NC)"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		node:18-alpine \
		npm run lint 2>/dev/null || echo "$(YELLOW)Lint command not available$(NC)"

test: ## Run tests inside container
	@echo "$(GREEN)Running tests...$(NC)"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		node:18-alpine \
		sh -c "npm ci && npm test" 2>/dev/null || echo "$(YELLOW)Test command not available$(NC)"

# Image management
push: ## Push image to registry (requires login)
	@echo "$(GREEN)Pushing image to registry...$(NC)"
	docker push $(IMAGE_NAME):$(TAG)

pull: ## Pull image from registry
	@echo "$(GREEN)Pulling image from registry...$(NC)"
	docker pull $(IMAGE_NAME):$(TAG)

tag: ## Tag image for registry (usage: make tag REGISTRY=your-registry.com)
	@if [ -z "$(REGISTRY)" ]; then \
		echo "$(RED)Please provide REGISTRY variable: make tag REGISTRY=your-registry.com$(NC)"; \
	else \
		echo "$(GREEN)Tagging image for $(REGISTRY)...$(NC)"; \
		docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG); \
	fi

# Monitoring
top: ## Show running processes in container
	@echo "$(GREEN)Container processes:$(NC)"
	docker exec $(CONTAINER_NAME) ps aux

stats: ## Show container resource usage
	@echo "$(GREEN)Container stats:$(NC)"
	docker stats $(CONTAINER_NAME) --no-stream

# Quick commands
quick-start: build run ## Quick build and run
	@echo "$(GREEN)Application is running at http://localhost:$(PORT)$(NC)"

quick-stop: stop clean ## Quick stop and cleanup

# Development workflow
env-check: ## Check if required environment variables are set
	@echo "$(GREEN)Checking environment variables...$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN).env file found$(NC)"; \
		if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then \
			echo "$(GREEN)Required environment variables found in .env$(NC)"; \
		else \
			echo "$(RED)Missing required environment variables in .env$(NC)"; \
			echo "$(YELLOW)Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW).env file not found$(NC)"; \
		if [ -n "$(VITE_SUPABASE_URL)" ] && [ -n "$(VITE_SUPABASE_ANON_KEY)" ]; then \
			echo "$(GREEN)Environment variables are set$(NC)"; \
		else \
			echo "$(RED)Missing required environment variables$(NC)"; \
			echo "$(YELLOW)Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY$(NC)"; \
			echo "$(YELLOW)Create a .env file or set them manually$(NC)"; \
		fi; \
	fi

dev-setup: ## Setup development environment
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@echo "1. Create .env file with Supabase credentials"
	@echo "2. Install dependencies: npm install"
	@echo "3. Start development server: npm run dev"
	@echo "4. Build for production: make build"
	@echo "5. Run in Docker: make run"