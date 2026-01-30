# Security Implementation: httpOnly Cookie Authentication

## ✅ **What We Implemented**

### Backend Changes (FastAPI)

1. **Cookie-Based Authentication** ([backend/app/routers/auth.py](../backend/app/routers/auth.py))
   - `/auth/login` and `/auth/register` now set httpOnly cookies via `Set-Cookie` header
   - `/auth/logout` endpoint properly clears the cookie
   - No more tokens in response body

2. **Secure Cookie Configuration**
   ```python
   COOKIE_CONFIG = {
       "httponly": True,    # JavaScript cannot access (XSS protection)
       "secure": True,      # HTTPS only in production
       "samesite": "lax",   # CSRF protection
       "max_age": 1800,     # 30 minutes
       "path": "/",
   }
   ```

### Frontend Changes (Next.js)

1. **Removed Token Storage** ([frontend/src/shared/lib/http-client.ts](../frontend/src/shared/lib/http-client.ts))
   - Deleted `localStorage`/`sessionStorage` token handling
   - Removed manual `Authorization` header management
   - Browser automatically sends cookies via `credentials: "include"`

2. **Simplified Auth Service** ([frontend/src/features/auth/services/auth.service.ts](../frontend/src/features/auth/services/auth.service.ts))
   - No token extraction/storage logic
   - Login/register just calls API
   - Cookies are set automatically by browser

3. **Streamlined Auth Context** ([frontend/src/features/auth/context/AuthContext.tsx](../frontend/src/features/auth/context/AuthContext.tsx))
   - Removed JWT decoding utilities
   - Checks auth by calling `/users/me` endpoint
   - No client-side token validation needed

---

## 🔒 **Security Improvements**

### Before (localStorage + Bearer tokens)
❌ Tokens stored in JavaScript-accessible storage  
❌ Vulnerable to XSS attacks  
❌ Manual token management error-prone  
❌ No automatic expiry handling  

### After (httpOnly cookies)
✅ Tokens inaccessible to JavaScript  
✅ XSS attacks cannot steal tokens  
✅ Browser handles cookies automatically  
✅ SameSite attribute prevents CSRF  
✅ Secure flag enforces HTTPS  

---

## ⚙️ **Configuration Required**

### Backend `.env` (already configured)
```env
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Local Development Note
For local development over HTTP, set `secure=False` in `COOKIE_CONFIG`:
```python
COOKIE_CONFIG = {
    "httponly": True,
    "secure": False,  # Set to False for localhost HTTP
    "samesite": "lax",
    "max_age": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    "path": "/",
}
```

**In production (HTTPS), always use `secure=True`.**

---

## 🚀 **How It Works**

### Login Flow
```
1. User submits login form
   ↓
2. Frontend calls POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT token
   ↓
5. Backend sets httpOnly cookie via Set-Cookie header
   ↓
6. Browser automatically stores cookie (inaccessible to JS)
   ↓
7. Frontend fetches user data from /users/me
   ↓
8. All future requests include cookie automatically
```

### Authenticated Request Flow
```
1. Frontend calls any API endpoint
   ↓
2. Browser automatically includes cookie in request
   ↓
3. Backend reads cookie, validates JWT
   ↓
4. Backend returns data
```

### Logout Flow
```
1. User clicks logout
   ↓
2. Frontend calls POST /api/v1/auth/logout
   ↓
3. Backend clears cookie via Set-Cookie with max-age=0
   ↓
4. Frontend clears user state
```

---

## 📝 **API Changes Summary**

| Endpoint | Before | After |
|----------|--------|-------|
| `POST /auth/login` | Returns `{access_token, token_type}` | Returns `{message, expires_in}` + Sets cookie |
| `POST /auth/register` | Returns user + manual token handling | Returns user + Sets cookie |
| `POST /auth/logout` | ❌ Not implemented | ✅ Clears httpOnly cookie |

---

## 🛡️ **Additional Security Recommendations**

### Implemented ✅
- [x] httpOnly cookies (prevents XSS token theft)
- [x] SameSite=lax (prevents CSRF)
- [x] Secure flag for HTTPS
- [x] Credentials: include for CORS
- [x] Automatic token expiry (30 minutes)

### Recommended for Production 🔜
- [ ] **CSRF Token Protection** - Add double-submit cookie pattern
- [ ] **Token Refresh Mechanism** - Implement refresh tokens
- [ ] **Rate Limiting** - Prevent brute force attacks (e.g., `slowapi`)
- [ ] **Security Headers** - Add helmet middleware
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  from fastapi.middleware.trustedhost import TrustedHostMiddleware
  
  app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])
  ```
- [ ] **Content Security Policy (CSP)** - Restrict script sources
- [ ] **Session Management** - Track active sessions, allow revocation
- [ ] **Monitoring** - Log failed login attempts (e.g., Sentry)
- [ ] **Input Sanitization** - Already using Pydantic, but audit for SQL injection

---

## 🧪 **Testing**

### Manual Testing
1. **Test Login**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "testpass"}' \
     -c cookies.txt
   ```

2. **Test Authenticated Request**
   ```bash
   curl http://localhost:8000/api/v1/users/me \
     -b cookies.txt
   ```

3. **Test Logout**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/logout \
     -b cookies.txt \
     -c cookies.txt
   ```

### Browser DevTools
1. Open Chrome DevTools → Application → Cookies
2. After login, verify `access_token` cookie has:
   - ✅ HttpOnly flag
   - ✅ Secure flag (in production)
   - ✅ SameSite = Lax

---

## 📚 **Why NOT Axios?**

**Native `fetch` is preferred for modern applications:**

| Feature | fetch | axios |
|---------|-------|-------|
| Bundle size | 0 KB (built-in) | ~13 KB |
| TypeScript support | Native | External types |
| httpOnly cookies | ✅ `credentials: "include"` | ✅ `withCredentials: true` |
| Browser support | All modern browsers | All browsers |
| Node.js support | ✅ Node 18+ | ✅ Requires polyfill |
| Streaming | ✅ Native | Limited |
| Interceptors | Via middleware | Built-in |

**Conclusion:** `fetch` is simpler, smaller, and sufficient for this use case. Senior engineers choose the right tool—not the most popular one.

---

## 🔍 **Comparison: Before vs After**

### Code Complexity

**Before (localStorage):**
```typescript
// Manual token management everywhere
localStorage.setItem("auth_token", token);
const token = localStorage.getItem("auth_token");
headers.Authorization = `Bearer ${token}`;
if (isTokenExpired(token)) { /* handle */ }
```

**After (httpOnly cookies):**
```typescript
// Cookies are automatic!
fetch("/api/endpoint", { credentials: "include" });
// That's it. Browser handles everything.
```

**Lines of code removed: ~150 lines**

### Security Posture

**Before:**
- 🔴 Token accessible via `localStorage`
- 🔴 Vulnerable to XSS
- 🔴 Manual expiry handling

**After:**
- 🟢 Token inaccessible to JavaScript
- 🟢 XSS cannot steal tokens
- 🟢 Automatic expiry via cookie max-age

---

## 🚦 **Deployment Checklist**

- [ ] Set `COOKIE_CONFIG["secure"] = True` in production
- [ ] Verify HTTPS is enabled
- [ ] Test login/logout flow in staging
- [ ] Monitor error logs for cookie issues
- [ ] Update CORS settings if frontend domain changes
- [ ] Clear user localStorage (migration step)
- [ ] Document new API behavior for team

---

## 🆘 **Troubleshooting**

### Cookies Not Being Set
1. Check CORS settings include `credentials=True`
2. Verify `credentials: "include"` in frontend fetch
3. Ensure frontend/backend on same domain or proper CORS

### "Unauthorized" After Login
1. Check cookie domain/path matches
2. Verify `httponly=True` not blocking legitimate requests
3. Check token expiry time

### Local Development Issues
1. Use `secure=False` for HTTP (localhost)
2. Ensure frontend calls `http://localhost:8000` not `https://`

---

## 📖 **Further Reading**

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [FastAPI: Security](https://fastapi.tiangolo.com/tutorial/security/)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)

---

**Implementation Date:** January 30, 2026  
**Contributors:** Senior Engineer Refactor  
**Status:** ✅ Complete (Core), 🔜 Enhancements Recommended
