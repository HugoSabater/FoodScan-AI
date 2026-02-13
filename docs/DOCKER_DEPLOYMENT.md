# 🐳 FoodScan AI - Docker Deployment Guide

Complete guide for deploying FoodScan AI using Docker containers.

---

## 📋 Prerequisites

- **Docker** (v20.10+): [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+): Included with Docker Desktop
- **Groq API Key**: [Get your key](https://console.groq.com/)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/HugoSabater/FoodScan-AI.git
cd FoodScan-AI
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.docker.example .env

# Edit .env with your actual values
# REQUIRED: Set GROQ_API_KEY
# RECOMMENDED: Change DB_ROOT_PASSWORD and DB_PASSWORD
```

**Minimum required configuration:**

```env
GROQ_API_KEY=your_actual_groq_api_key_here
DB_ROOT_PASSWORD=secure_root_password
DB_PASSWORD=secure_db_password
JWT_SECRET=your_random_32_char_secret
```

### 3. Build and Start Containers

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MySQL**: localhost:3306

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Frontend (Nginx + Angular)                       │ │
│  │  Port: 80                                         │ │
│  │  - Serves static files                            │ │
│  │  - Proxies /api/* to backend                      │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓ /api/*                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Backend (Node.js + Express)                      │ │
│  │  Port: 3000                                       │ │
│  │  - REST API                                       │ │
│  │  - Groq AI integration                            │ │
│  │  - OpenFoodFacts API                              │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓ SQL                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MySQL Database                                   │ │
│  │  Port: 3306                                       │ │
│  │  - Persistent volume                              │ │
│  │  - Auto-initialization                            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Services

### Frontend (Angular + Nginx)

**Image**: Custom build from `frontend/Dockerfile`

**Features**:
- Multi-stage build (Node.js build → Nginx serve)
- Optimized production bundle
- SPA routing with `try_files`
- API proxy to backend
- Gzip compression
- Security headers

**Ports**: `80:80`

---

### Backend (Node.js)

**Image**: Custom build from `backend/Dockerfile`

**Features**:
- Multi-stage build for smaller image
- Non-root user for security
- Health check endpoint
- Dumb-init for proper signal handling

**Ports**: `3000:3000`

**Environment Variables**:
- `GROQ_API_KEY` (required)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGIN`

---

### MySQL Database

**Image**: `mysql:8.0`

**Features**:
- Persistent volume (`mysql_data`)
- Auto-initialization with `init.sql`
- Health check

**Ports**: `3306:3306`

**Environment Variables**:
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

---

## 🔧 Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Build & Rebuild

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build frontend

# Force rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### Database Management

```bash
# Access MySQL shell
docker-compose exec mysql mysql -u foodscan_user -p foodscan_db

# Backup database
docker-compose exec mysql mysqldump -u root -p foodscan_db > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p foodscan_db < backup.sql

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Debugging

```bash
# Check service status
docker-compose ps

# Check health status
docker-compose ps | grep healthy

# Execute command in container
docker-compose exec backend sh

# View container resource usage
docker stats
```

---

## 🔍 Health Checks

All services include health checks:

### Backend Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T18:00:00.000Z",
  "uptime": 123.456
}
```

### Frontend Health Check

```bash
curl http://localhost/health
```

**Expected response**:
```
healthy
```

### MySQL Health Check

```bash
docker-compose exec mysql mysqladmin ping -h localhost -u root -p
```

---

## 🌐 Production Deployment

### 1. Update Environment Variables

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
DB_ROOT_PASSWORD=very_strong_password
DB_PASSWORD=very_strong_password
JWT_SECRET=random_64_char_secret
```

### 2. Enable HTTPS (Recommended)

Use a reverse proxy like **Nginx**, **Traefik**, or **Caddy**:

**Example with Caddy** (automatic HTTPS):

```yaml
# Add to docker-compose.yml
caddy:
  image: caddy:2-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
  networks:
    - foodscan-network
```

**Caddyfile**:
```
yourdomain.com {
    reverse_proxy frontend:80
}
```

### 3. Secure Database

```bash
# Change MySQL root password
docker-compose exec mysql mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;
```

### 4. Enable Firewall

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🐛 Troubleshooting

### Frontend not loading

**Symptom**: Blank page or 404 errors

**Solution**:
```bash
# Check frontend logs
docker-compose logs frontend

# Verify build output
docker-compose exec frontend ls -la /usr/share/nginx/html

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

### Backend API errors

**Symptom**: 500 errors or connection refused

**Solution**:
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep GROQ_API_KEY

# Check database connection
docker-compose exec backend node -e "require('./src/config/database.js')"
```

---

### MySQL connection issues

**Symptom**: `ECONNREFUSED` or `Access denied`

**Solution**:
```bash
# Check MySQL status
docker-compose ps mysql

# Wait for MySQL to be ready
docker-compose logs mysql | grep "ready for connections"

# Verify credentials
docker-compose exec mysql mysql -u foodscan_user -p
```

---

### Port conflicts

**Symptom**: `port is already allocated`

**Solution**:
```bash
# Change ports in .env
FRONTEND_PORT=8080
BACKEND_PORT=3001
DB_PORT=3307

# Restart services
docker-compose down
docker-compose up -d
```

---

## 📊 Monitoring

### View Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Detailed container info
docker-compose ps -a
```

### Log Management

```bash
# Limit log size in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🧹 Cleanup

### Remove Containers

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: deletes database)
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

### Clean Docker System

```bash
# Remove unused images
docker image prune -a

# Remove all unused resources
docker system prune -a --volumes
```

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ Yes | - | Groq API key for AI analysis |
| `DB_ROOT_PASSWORD` | ✅ Yes | - | MySQL root password |
| `DB_PASSWORD` | ✅ Yes | - | MySQL user password |
| `DB_NAME` | No | `foodscan_db` | Database name |
| `DB_USER` | No | `foodscan_user` | Database username |
| `JWT_SECRET` | ✅ Yes | - | JWT signing secret (32+ chars) |
| `CORS_ORIGIN` | No | `http://localhost` | Frontend URL for CORS |
| `BACKEND_PORT` | No | `3000` | Backend port mapping |
| `FRONTEND_PORT` | No | `80` | Frontend port mapping |
| `DB_PORT` | No | `3306` | MySQL port mapping |

---

## 🎓 Best Practices

1. **Never commit `.env`** - Use `.env.docker.example` as template
2. **Use strong passwords** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS in production** - Use Caddy or Let's Encrypt
4. **Regular backups** - Backup MySQL volume regularly
5. **Monitor logs** - Use `docker-compose logs -f` to catch errors
6. **Update images** - Rebuild periodically for security patches
7. **Limit resources** - Use `deploy.resources` in docker-compose.yml

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Review [GitHub Issues](https://github.com/HugoSabater/FoodScan-AI/issues)
4. Check [SECURITY.md](../SECURITY.md) for vulnerability reporting

---

**Last Updated**: 2026-02-13  
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+
