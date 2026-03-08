---
name: docker
description: |
  Docker 容器化专家。
  优化镜像构建和容器配置。
---

# Docker

专业的 Docker 容器化解决方案。

## Core Concepts

### Images vs Containers

- **Image**: A read-only template with instructions for creating a container
- **Container**: A runnable instance of an image

### Basic Commands

```bash
# Build an image
docker build -t myapp:1.0 .

# Run a container
docker run -d -p 8080:80 myapp:1.0

# List running containers
docker ps

# Stop a container
docker stop <container_id>

# View logs
docker logs <container_id>

# Execute command in running container
docker exec -it <container_id> /bin/bash
```

## Dockerfile Best Practices

### Multi-Stage Builds
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Layer Optimization

1. **Order layers by change frequency**
   - Put rarely-changing instructions first
   - Put frequently-changing instructions last

2. **Combine related commands**
   ```dockerfile
   RUN apt-get update && apt-get install -y \
       package1 \
       package2 \
       && rm -rf /var/lib/apt/lists/*
   ```

3. **Use .dockerignore**
   ```
   node_modules
   npm-debug.log
   .git
   .env
   ```

## Docker Compose

### Basic Configuration
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - postgres_data:/data
    environment:
      - POSTGRES_DB=mydb

volumes:
  postgres_data:
```

### Development Setup
```yaml
services:
  app:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
```

## Security Best Practices

1. **Use specific image tags**, not `latest`
2. **Run as non-root user**
   ```dockerfile
   RUN addgroup -g 1001 -S appgroup && \
       adduser -S appuser -G appgroup -u 1001
   USER appuser
   ```
3. **Scan images for vulnerabilities**
4. **Don't include secrets in images**

## Common Issues

### Container exits immediately
- Ensure a long-running process (like `tail -f /dev/null` for debugging)
- Check entrypoint/cmd configuration

### Port already in use
- Change host port mapping: `-p 8081:80`

### Permission denied
- Fix file permissions or run with appropriate user
