# Security Documentation

## Security Improvements Implemented

### 1. Dependency Security ✅

- **Issue**: Next.js vulnerability (GHSA-223j-4rm8-mrmf)
- **Fix**: Updated to Next.js 15.3.5+
- **Status**: Resolved

### 2. Security Headers ✅

- **Content-Security-Policy**: Prevents XSS and code injection
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Limits referrer information
- **Permissions-Policy**: Restricts browser features

### 3. Input Validation ✅

- **Message Format**: Validates message structure and content
- **Role Validation**: Ensures only valid roles (user, assistant, system)
- **Content Length**: Limits message content to 10,000 characters
- **Array Validation**: Ensures messages is a non-empty array

### 4. Rate Limiting ✅

- **Limit**: 20 requests per minute per IP+User-Agent combination
- **Headers**: Provides rate limit status in response headers
- **Cleanup**: Automatic cleanup of expired rate limit records
- **Status Code**: Returns 429 when rate limit exceeded

### 5. SSRF Protection ✅

- **URL Validation**: Validates MCP URLs against allowed domains
- **Protocol Restriction**: Only allows HTTPS (except localhost)
- **Domain Whitelist**: Restricts to trusted domains only

### 6. Information Disclosure Prevention ✅

- **Production Logging**: Reduced verbose logging in production
- **Generic Errors**: Returns generic error messages to prevent leakage
- **Error Handling**: Comprehensive error handling with proper cleanup

## Environment Configuration

### Required Environment Variables

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-id

# Clerk Authentication
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

### Optional Security Configuration

```bash
# MCP Configuration (Optional - defaults to QuerySculptor toolbox)
MCP_URL=https://agent-query-builder-toolbox.vercel.app/mcp

# Environment
NODE_ENV=production
```

## Security Best Practices

### 1. Environment Variables

- Never commit actual secret keys to version control
- Use different keys for development and production
- Ensure all environment variables are properly configured

### 2. MCP URL Configuration

- MCP_URL should only point to trusted domains
- Ensure HTTPS for production MCP URLs
- Current allowed domains:
  - `agent-query-builder-toolbox.vercel.app`
  - `localhost` (development only)
  - `127.0.0.1` (development only)

### 3. Rate Limiting

- Current limit: 20 requests per minute per IP+User-Agent
- Configurable via code modification if needed
- Automatic cleanup prevents memory leaks

### 4. Content Security Policy

- Configured to work with Clerk, Convex, and MCP services
- Blocks unauthorized script execution
- Prevents content injection attacks

## Security Headers Details

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.dev;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://*.convex.cloud https://*.convex.dev https://clerk.com https://*.clerk.com https://*.clerk.dev https://agent-query-builder-toolbox.vercel.app wss://*.convex.cloud wss://*.convex.dev;
frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.dev;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

## Security Score: 9/10

### Remaining Considerations

1. **Web Application Firewall (WAF)**: Consider adding for additional protection
2. **Database Security**: Ensure Convex access controls are properly configured
3. **Session Management**: Regularly review Clerk authentication configuration
4. **Monitoring**: Implement security monitoring and alerting

## Testing Security

### Rate Limiting Test

```bash
# Test rate limiting (should return 429 after 20 requests)
for i in {1..25}; do curl -X POST http://localhost:3000/api/assistant-chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}]}'; done
```

### Security Headers Test

```bash
# Check security headers
curl -I http://localhost:3000/
```

## Incident Response

If security issues are discovered:

1. Immediately update dependencies with `npm audit fix`
2. Review and update security headers as needed
3. Monitor application logs for suspicious activity
4. Update environment variables if compromised
5. Review and update allowed domains list

## Contact

For security concerns or questions, please review the code and configuration files in this repository.
