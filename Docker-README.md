# Docker Setup for Contribium

This directory contains Docker configuration files for containerizing the Contribium React application.

## Files Overview

- `Dockerfile` - Multi-stage build configuration for production
- `docker-compose.yml` - Docker Compose configuration for easy deployment
- `nginx.conf` - Nginx configuration for serving the React app
- `Makefile` - Convenient commands for Docker operations
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Prerequisites
- Docker installed on your system
- Docker Compose (optional, for docker-compose commands)
- Supabase project credentials (URL and anon key)

### Environment Setup

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file** with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Check environment variables**:
   ```bash
   make env-check
   ```

### Build and Run

1. **Quick start** (build and run in one command):
   ```bash
   make quick-start
   ```

2. **Manual steps**:
   ```bash
   # Build the Docker image
   make build
   
   # Run the container
   make run
   ```

3. **Using Docker Compose**:
   ```bash
   make up
   ```

The application will be available at `http://localhost:3000`

## Available Make Commands

Run `make help` to see all available commands:

### Basic Operations
- `make env-check` - Check if environment variables are set
- `make build` - Build the Docker image
- `make run` - Run container in detached mode
- `make stop` - Stop and remove the container
- `make restart` - Restart the container
- `make logs` - View container logs

### Development
- `make dev` - Run with volume mounting for development
- `make shell` - Get a shell inside the container
- `make status` - Show container status
- `make health` - Check application health

### Maintenance
- `make clean` - Clean up containers and images
- `make rebuild` - Clean rebuild of the image
- `make stats` - Show container resource usage

### Docker Compose
- `make up` - Start services with docker-compose
- `make down` - Stop services with docker-compose

## Docker Image Details

### Multi-stage Build
The Dockerfile uses a multi-stage build process:

1. **Builder stage**: Uses Node.js 18 Alpine to build the React application
2. **Production stage**: Uses Nginx Alpine to serve the built application

### Features
- **Optimized for production**: Multi-stage build reduces final image size
- **Security headers**: Nginx configured with security headers
- **Gzip compression**: Enabled for better performance
- **Client-side routing**: Configured to handle React Router
- **Health check**: `/health` endpoint for monitoring
- **Static asset caching**: Optimized cache headers for static files

## Environment Variables

### Required Supabase Variables
These variables are required for the application to work:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Docker Configuration Variables
You can customize the build and runtime behavior using these variables:

- `PORT` - Port to expose the application (default: 3000)
- `IMAGE_NAME` - Docker image name (default: contribium)
- `TAG` - Docker image tag (default: latest)
- `CONTAINER_NAME` - Container name (default: contribium-app)

### Setting Environment Variables

**Option 1: Using .env file (recommended)**
```bash
cp .env.example .env
# Edit .env with your values
make build
```

**Option 2: Command line**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_ANON_KEY=your_key \
make build
```

**Option 3: Export variables**
```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your_key
make build
```

## Production Deployment

### Using Docker Compose
```bash
# Start the application
docker-compose up -d

# Stop the application  
docker-compose down
```

### Using Make Commands
```bash
# Deploy (build + run)
make deploy

# Check status
make status

# View logs
make logs
```

### With Reverse Proxy
For production with reverse proxy, use the nginx profile:
```bash
docker-compose --profile production up -d
```

## Development Workflow

1. **Local development**:
   ```bash
   npm run dev
   ```

2. **Test in Docker**:
   ```bash
   make build
   make run
   ```

3. **Development with Docker**:
   ```bash
   make dev
   ```

## Troubleshooting

### Container won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- View container logs: `make logs`
- Check container status: `make status`

### Build fails
- Ensure all dependencies are in package.json
- Check if there are any TypeScript errors: `npm run build`
- Clean and rebuild: `make rebuild`

### WebSocket connection errors (Supabase realtime)
- The nginx configuration automatically allows WebSocket connections to Supabase
- CSP headers are configured to allow `wss://` connections to `*.supabase.co`
- If using a custom Supabase domain, the nginx config will be updated dynamically

### Permission issues
- Make sure Docker daemon is running
- Check if your user is in the docker group (Linux)

### Health check fails
- Verify the application builds successfully locally
- Check nginx configuration in the container: `make shell`

## Monitoring

### Health Check
The application includes a health check endpoint at `/health`:
```bash
curl http://localhost:3000/health
```

### Container Stats
```bash
make stats
```

### Container Processes
```bash
make top
```

## Registry Operations

### Tag for Registry
```bash
make tag REGISTRY=your-registry.com
```

### Push to Registry
```bash
make push
```

### Pull from Registry
```bash
make pull
```

## Cleanup

### Remove containers and images
```bash
make clean
```

### Quick stop and cleanup
```bash
make quick-stop
```

## Support

For issues related to Docker configuration, please check:
1. Docker version compatibility
2. Available system resources (memory, disk space)
3. Network port availability
4. Application-specific environment variables