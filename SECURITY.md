# Security Features - Chattrix

## Overview
Chattrix implements multiple layers of security to protect against abuse, malicious attacks, and ensure safe room creation and access. **Room creation is unlimited** - users can create as many rooms as they want.

## Security Measures

### 1. Rate Limiting
- **Room Creation**: **UNLIMITED** - Users can create unlimited rooms
- **Other Actions**: Rate limiting still applies to room joining and validation attempts
- **Automatic Reset**: Rate limits reset after 1 hour for non-creation actions

### 2. Input Validation & Sanitization
- **XSS Prevention**: Blocks script tags, javascript: URLs, and other malicious patterns
- **HTML Encoding**: Automatically encodes special characters
- **Length Validation**: Enforces minimum and maximum lengths for inputs
- **Character Validation**: Only allows safe characters (alphanumeric, spaces, basic punctuation)

### 3. IP-based Abuse Prevention
- **Suspicious Activity Detection**: Monitors failed attempts and total activity (excluding room creation)
- **Automatic Blocking**: Blocks IPs with >10 failed attempts in 5 minutes for non-creation actions
- **Block Duration**: IPs remain blocked until manually unblocked. (Note: BLOCK_DURATION_MINUTES environment variable is currently unused.)
- **Real-time Monitoring**: Continuous monitoring of all API requests

### 4. Access Logging
- **Comprehensive Logging**: All room creation, joining, and validation attempts
- **IP Tracking**: Records client IP addresses and user agents
- **Success/Failure Tracking**: Logs both successful and failed attempts
- **Reason Logging**: Records why attempts failed
- **Log Retention**: Keeps last 1000 logs to prevent memory issues

### 5. Room Security
- **Password Hashing**: Secure SHA-256 hashing with salt
- **Room Expiry**: Automatic 5-minute expiration
- **Panic Mode**: Room creators can instantly deactivate rooms
- **Capacity Limits**: Prevents room overcrowding

## API Security

### Protected Endpoints
All API endpoints implement security measures:
- `/api/rooms` - **Unlimited room creation** and listing
- `/api/rooms/join` - Room joining (with rate limiting)
- `/api/rooms/validate` - Room validation (with rate limiting)
- `/api/rooms/panic` - Panic mode activation
- `/api/security/stats` - Security statistics

### Security Headers
- IP blocking checks (excluding room creation)
- Rate limiting validation (excluding room creation)
- Input sanitization
- Access logging

## Monitoring & Analytics

### Security Dashboard
Access security statistics at `/api/security/stats`:
- Total access logs
- **Room creation statistics** (total rooms, rooms per hour, unique IPs)
- Number of blocked IPs (for non-creation actions)
- Recent activity feed

### Real-time Monitoring
- Automatic cleanup every 5 minutes
- Suspicious activity detection (excluding room creation)
- IP blocking management
- Log rotation

## Configuration

### Environment Variables
```bash
# Room creation is unlimited - no rate limiting
MAX_ROOMS_PER_IP_PER_HOUR=unlimited
MAX_FAILED_ATTEMPTS_BEFORE_BLOCK=10
# BLOCK_DURATION_MINUTES=5  # Currently unused - blocks are permanent until manually unblocked
LOG_RETENTION_HOURS=24
```

### Customization
Security thresholds can be adjusted in `src/lib/security.ts`:
- **Room creation**: Always unlimited
- Blocking thresholds for other actions
- Log retention limits
- Suspicious pattern detection

## Best Practices

### For Developers
1. Always validate and sanitize user inputs
2. **Room creation is unlimited** - no need for rate limiting
3. Implement rate limiting on other public endpoints
4. Log security events for monitoring
5. Use HTTPS in production
6. Regularly review security logs

### For Users
1. **Create unlimited rooms** - no restrictions on room creation
2. Use strong, unique passwords for private rooms
3. Don't share room credentials publicly
4. Report suspicious activity
5. Use panic mode if security is compromised

## Threat Mitigation

### Common Attacks Prevented
- **DDoS**: Rate limiting prevents overwhelming requests (excluding room creation)
- **XSS**: Input sanitization blocks malicious scripts
- **Brute Force**: IP blocking after multiple failures (excluding room creation)
- **Spam**: **No restrictions on room creation** - users can create unlimited rooms
- **Data Injection**: Input validation blocks malicious data

### Security Monitoring
- Real-time threat detection (excluding room creation)
- Automatic response to suspicious activity
- Comprehensive audit trail
- Performance impact monitoring

## Incident Response

### Automatic Responses
1. **Room Creation**: Always allowed - no rate limiting
2. **Rate Limit Exceeded**: Return 429 status with retry info (for non-creation actions)
3. **IP Blocked**: Return 403 status with block reason (for non-creation actions)
4. **Invalid Input**: Return 400 status with validation errors
5. **Suspicious Activity**: Log and potentially block IP (excluding room creation)

### Manual Intervention
- Review security logs
- Unblock legitimate IPs
- Adjust security thresholds
- Investigate security incidents

## Compliance & Privacy

### Data Protection
- No personal information stored
- IP addresses logged for security only
- Automatic log rotation
- No external data sharing

### Privacy Features
- **Anonymous room creation** - unlimited rooms
- No user registration required
- Temporary room storage
- Automatic data cleanup

## Future Enhancements

### Planned Security Features
- Geographic IP blocking (excluding room creation)
- Advanced threat detection (excluding room creation)
- Machine learning abuse prevention (excluding room creation)
- Two-factor authentication for rooms
- Encrypted room data storage

### Security Audits
- Regular security reviews
- Penetration testing
- Code security analysis
- Third-party security assessments

## Summary

**Key Change**: Room creation is now **UNLIMITED** for all users. This means:
- ✅ Users can create as many rooms as they want
- ✅ No rate limiting on room creation
- ✅ No IP blocking for room creation
- ✅ All other security features remain active
- ✅ Input validation and sanitization still apply
- ✅ Access logging for all activities
- ✅ Room security features (passwords, expiry, panic mode) still work

This change makes Chattrix more user-friendly while maintaining security for other operations.
