# Docker Deployment Guide

This guide covers deploying the MRTGuessr application using Docker in production.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional, for easier orchestration)

## Quick Start

### Using Docker Compose (Recommended)

Build and start the application:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f
```

Stop the application:

```bash
docker-compose down
```

### Using Docker CLI

Build the image:

```bash
docker build -t mrtguessr:latest .
```

Run the container:

```bash
docker run -d \
  --name mrtguessr \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  mrtguessr:latest
```

## Production Deployment

### Environment Variables

You can pass environment variables to customize the deployment:

```bash
docker run -d \
  --name mrtguessr \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  mrtguessr:latest
```

### Using a Reverse Proxy

For production, it's recommended to use a reverse proxy like Nginx or Caddy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Dockerfile Details

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Installs dependencies and builds the application
2. **Runner stage**: Creates a minimal production image with only runtime dependencies

Key features:
- Uses Node.js 22 Alpine for minimal image size
- Runs as non-root user for security
- Includes health check for container orchestration
- Optimized layer caching for faster rebuilds

## Monitoring

Check container health:

```bash
docker ps
docker inspect --format='{{json .State.Health}}' mrtguessr | jq
```

View logs:

```bash
docker logs -f mrtguessr
```

## Troubleshooting

### Container won't start

Check logs for errors:
```bash
docker logs mrtguessr
```

### Port already in use

Change the host port mapping:
```bash
docker run -p 8080:3000 mrtguessr:latest
```

### Build fails

Clear Docker cache and rebuild:
```bash
docker builder prune
docker build --no-cache -t mrtguessr:latest .
```

## Resources

- [TanStack Start Hosting Guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Deploy TanStack Start with Docker & Bun](https://rogasper.com/blog/how-to-deploy-tanstack-start-1767579369589)
- [Docker Compose with TanStack Start Discussion](https://github.com/TanStack/router/discussions/3147)
