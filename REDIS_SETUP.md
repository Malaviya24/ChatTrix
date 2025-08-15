# Redis Setup and Socket API Improvements

## Overview

The socket API has been completely refactored to replace in-memory Maps with Redis persistent storage, add comprehensive input validation, and implement consistent error handling.

## Changes Made

### 1. Persistent Storage Implementation
- **Replaced in-memory Maps** with Redis-based persistent store
- **Added fallback to memory** when Redis is unavailable (documented last-resort)
- **Implemented TTLs** for automatic data expiration (24 hours default)
- **Added atomic operations** for join/leave operations using Redis transactions

### 2. Input Validation
- **Added Zod schemas** for all request types
- **Implemented field validation** with length limits and character restrictions
- **Added required field checks** for all endpoints
- **Standardized error responses** with consistent JSON schema

### 3. Error Handling
- **Consistent error format**: `{ error: string, details?: string, env: string }`
- **Proper HTTP status codes**: 400, 403, 404, 405, 500
- **Environment-aware logging**: Full errors in development, sanitized in production
- **Content-Type headers** on all responses

### 4. Security Improvements
- **Input sanitization** for nicknames and URLs
- **Permission checks** for room operations
- **User verification** before allowing actions

## Redis Setup

### Prerequisites
- Redis server (version 6.0+ recommended)
- Node.js with npm

### Installation

1. **Install Redis dependencies:**
   ```bash
   npm install redis ioredis
   ```

2. **Set up Redis server:**
   
   **Option A: Local Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   
   # Windows
   # Download from https://redis.io/download
   ```

   **Option B: Redis Cloud (free tier available)**
   - Sign up at https://redis.com/
   - Get connection string
   - Set `REDIS_URL` environment variable

3. **Configure environment variables:**
   ```bash
   # Copy example file
   cp env.example .env.local
   
   # Edit .env.local with your Redis configuration
   REDIS_URL=redis://localhost:6379
   REDIS_TTL=86400  # 24 hours in seconds
   ```

### Redis Configuration

The Redis store automatically:
- Connects with retry logic and connection pooling
- Falls back to in-memory storage if Redis is unavailable
- Implements TTL for automatic data cleanup
- Uses Redis hashes for room participants
- Uses Redis lists for room messages
- Uses Redis strings for user-room mappings

### Health Check

The API includes a health check endpoint that reports Redis status:
```bash
GET /api/socket
```

Response includes Redis health:
```json
{
  "status": "running",
  "redis": {
    "status": "healthy",
    "details": "Redis connection successful"
  }
}
```

## API Endpoints

### POST /api/socket

**Request Format:**
```json
{
  "action": "join-room|send-message|get-messages|typing|leave-room|kick-user",
  "data": { /* action-specific data */ }
}
```

**Validation:**
- All requests are validated against Zod schemas
- Required fields are checked
- Field lengths and formats are validated
- Character restrictions are enforced

**Error Responses:**
```json
{
  "error": "Error description",
  "details": "Additional error details",
  "env": "development|production|unknown"
}
```

## Fallback Behavior

When Redis is unavailable:
1. **Automatic fallback** to in-memory Maps
2. **Logging** of fallback activation
3. **Health check** reports degraded status
4. **Data persistence** limited to server lifetime

## Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3000/api/socket

# Join room
curl -X POST http://localhost:3000/api/socket \
  -H "Content-Type: application/json" \
  -d '{
    "action": "join-room",
    "data": {
      "roomId": "test-room",
      "userId": "user1",
      "nickname": "TestUser",
      "avatar": "https://example.com/avatar.jpg"
    }
  }'
```

### Error Testing
```bash
# Invalid action
curl -X POST http://localhost:3000/api/socket \
  -H "Content-Type: application/json" \
  -d '{
    "action": "invalid-action",
    "data": {}
  }'

# Missing required fields
curl -X POST http://localhost:3000/api/socket \
  -H "Content-Type: application/json" \
  -d '{
    "action": "join-room",
    "data": {
      "roomId": "test-room"
    }
  }'
```

## Monitoring

### Redis Metrics
- Connection status
- Operation success/failure rates
- Fallback activation frequency
- Memory usage (when using fallback)

### Logs
- Redis connection events
- Fallback activations
- Validation failures
- Operation errors

## Production Considerations

1. **Redis Configuration:**
   - Use Redis Cluster for high availability
   - Configure appropriate memory limits
   - Set up monitoring and alerting

2. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Use secure Redis URLs
   - Configure appropriate TTL values

3. **Monitoring:**
   - Monitor Redis connection health
   - Track fallback usage
   - Set up alerts for Redis failures

4. **Backup:**
   - Configure Redis persistence (RDB/AOF)
   - Regular backup schedules
   - Disaster recovery procedures

## Troubleshooting

### Common Issues

1. **Redis Connection Failed:**
   - Check Redis server status
   - Verify `REDIS_URL` format
   - Check firewall/network settings

2. **Fallback Activated:**
   - Check Redis logs
   - Verify Redis server is running
   - Check connection string

3. **Validation Errors:**
   - Check request format
   - Verify field types and lengths
   - Check character restrictions

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.
