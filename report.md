# Google OAuth Login — Analysis Report

> **Date:** June 20, 2026  
> **Scope:** Login & Register pages (Storefront + Admin), Backend Auth, Shared Components

---

## 1. Current Implementation Overview

### Architecture

```
┌─────────────────────────────┐
│   Frontend (Storefront/Admin)│
│   GoogleOAuthProvider        │
│     └─ GoogleLoginButton     │
│          └─ @react-oauth/    │
│             google           │
└──────────┬──────────────────┘
           │ credential (JWT)
           ▼
┌─────────────────────────────┐
│   Backend /api/auth/google   │
│   google-auth-library        │
│     └─ verifyIdToken()       │
│     └─ find or create user   │
│     └─ issue JWT + cookie    │
└─────────────────────────────┘
```

### Files Involved

| Layer | File | Role |
|-------|------|------|
| Shared | `packages/shared/src/components/GoogleLoginButton.tsx` | Reusable Google Sign-In button using `@react-oauth/google` |
| Shared | `packages/shared/src/utils/api.ts` | `authApi.googleLogin()` sends token to backend |
| Storefront | `apps/storefront/src/App.tsx` | Wraps app in `GoogleOAuthProvider`, passes `showGoogleLogin={true}` |
| Storefront | `apps/storefront/src/components/LoginView.tsx` | Renders `<GoogleLoginButton role="consumer">` |
| Storefront | `apps/storefront/src/components/RegisterView.tsx` | Renders `<GoogleLoginButton role="consumer">` |
| Admin | `apps/admin/src/App.tsx` | Wraps app in `GoogleOAuthProvider`, passes `showGoogleLogin={true}` |
| Admin | `apps/admin/src/components/AdminLogin.tsx` | Renders `<GoogleLoginButton role="admin">` |
| Admin | `apps/admin/src/components/AdminRegister.tsx` | Renders `<GoogleLoginButton role="admin">` |
| Backend | `apps/backend/controllers/AuthController.ts` | `googleLogin()` — verifies token, upserts user, issues JWT |
| Backend | `apps/backend/routes/authRoutes.ts` | `POST /api/auth/google` route |
| Backend | `apps/backend/migrations/001_add_google_oauth_columns.sql` | Adds `google_id`, `full_name`, `profile_picture_url`, `auth_provider` |

---

## 2. What's Missing or Broken

### 🔴 Critical — Won't Work Without These

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 1 | **No Google Cloud Console credentials configured** | `.env` files | Both `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend) are missing from actual `.env` files. The code falls back to `"GOCSPX-placeholder"` which will cause the Google button to fail silently or show an error. |
| 2 | **`GOOGLE_CLIENT_ID` missing from `render.yaml` env vars** | `render.yaml` | The env var is listed but has `sync: false` with no value — it must be set in the Render dashboard before deployment. |
| 3 | **Backend `.env.example` doesn't list `GOOGLE_CLIENT_ID`** | `apps/backend/.env.example` | Only shows `DATABASE_URL` and `JWT_SECRET`. Developers won't know this env var is required. |

### 🟡 Security Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 4 | **Anyone can create an admin account via Google** | `AuthController.ts` → `googleLogin()` | The `role` parameter is taken directly from `req.body` with no validation. A user can POST `{ token, role: "admin" }` to `/api/auth/google` from the admin register page and get a full admin account. |
| 5 | **No Google Workspace domain restriction** | `AuthController.ts` | The `verifyIdToken()` call doesn't restrict `hd` (hosted domain). Any Gmail account can register. For an e-commerce admin panel, this is dangerous. |
| 6 | **No `unique` constraint on `google_id`** | `001_add_google_oauth_columns.sql` | The migration adds an index but no `UNIQUE` constraint. Duplicate Google accounts could be created. |
| 7 | **`google_id` lookup not optimized** | `AuthController.ts` | The query `WHERE email = ? OR google_id = ?` does a full scan on the `OR`. Should be two separate lookups or a `UNION`. |
| 8 | **JWT token returned in both cookie AND response body** | `AuthController.ts` → `googleLogin()` | The response includes `token` in JSON even though it's also set as an httpOnly cookie. The frontend only uses the cookie (via `withCredentials: true`), so the body token is unnecessary and could leak via logs or client-side storage if mishandled. |

### 🟠 Missing Functionality

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 9 | **No account linking** | `AuthController.ts` | If a user registers with email `john@gmail.com` and later tries Google login with the same email, the backend creates a new `google_id` entry but doesn't link the existing account properly — it updates `google_id` but the user's `auth_provider` stays `'email'` if it was already set. |
| 10 | **No password reset for Google-linked accounts** | Backend | A user who signed up via Google gets a random bcrypt password (`Math.random().toString(36)`). If they try "forgot password" flow (not yet implemented), they'd be stuck. |
| 11 | **No `showGoogleLogin` toggle via env var** | `App.tsx` (both) | `showGoogleLogin` is hardcoded to `true`. There's no way to disable Google login if credentials aren't configured — the button will show but fail. |
| 12 | **No error boundary around GoogleLoginButton** | `GoogleLoginButton.tsx` | If the Google SDK fails to load (network, ad blocker, wrong client ID), there's no graceful fallback — the component just renders nothing or shows a broken button. |
| 13 | **No loading state during Google OAuth redirect/popup** | `GoogleLoginButton.tsx` | The button doesn't show a loading spinner while the Google popup/redirect is processing. |
| 14 | **`onSuccess` doesn't update auth context properly** | `LoginView.tsx`, `RegisterView.tsx` | The `onSuccess` callback only calls `onNavigate("/products")` — it doesn't call `setUser()` from AuthContext. The user might appear logged out until page refresh. |

### 🟢 Minor / Nice-to-Have

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 15 | **No profile picture display after Google login** | `Navbar.tsx` | The backend returns `profile_picture_url` but the navbar doesn't display it. |
| 16 | **No "Signed in with Google" badge** | `ConsumerDashboard.tsx` | Users can't see which auth method they used. |
| 17 | **No account deletion / data export for GDPR** | Backend | Google OAuth users may need account deletion rights. |
| 18 | **Duplicate `.env.example` Google OAuth section** | Root `.env.example` | The Google OAuth block is duplicated (lines 28-42). |

---

## 3. Step-by-Step Setup Guide (to make it work)

### Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   - `http://localhost:5173` (storefront dev)
   - `http://localhost:5174` (admin dev)
   - `https://your-storefront-domain.onrender.com` (production)
   - `https://your-admin-domain.onrender.com` (production)
7. Authorized redirect URIs:
   - `http://localhost:5173/` 
   - `http://localhost:5174/`
   - `https://your-storefront-domain.onrender.com/`
   - `https://your-admin-domain.onrender.com/`
8. Copy the **Client ID** (starts with something like `123456789-xxxx.apps.googleusercontent.com`)

### Step 2: Set Environment Variables

**Frontend `.env` files** (both storefront and admin):
```env
VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

**Backend `.env` file:**
```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

**Render Dashboard** — set for the backend service:
```
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

### Step 3: Run Database Migration

The seed script already includes the Google OAuth columns in the `users` table definition. If you have an existing database, run:

```bash
cd apps/backend && mysql -u user -p dbname < migrations/001_add_google_oauth_columns.sql
```

Or re-seed: `pnpm --filter @eshopnepal/backend seed`

---

## 4. Recommended Code Fixes

### Fix 1: Add admin role whitelist for Google login

```typescript
// AuthController.ts — googleLogin()
const ADMIN_EMAILS = (process.env.ADMIN_GOOGLE_EMAILS || '').split(',').filter(Boolean);

// After verifying token:
if (userRole === 'admin' && !ADMIN_EMAILS.includes(email)) {
  return res.status(403).json({ error: 'Not authorized for admin access.' });
}
```

### Fix 2: Add `UNIQUE` constraint on `google_id`

```sql
-- In migration or seed
ALTER TABLE users ADD UNIQUE INDEX idx_users_google_id_unique (google_id);
```

### Fix 3: Conditionally show Google button based on env

```typescript
// App.tsx
const showGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID 
  && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'GOCSPX-placeholder';

// Pass showGoogleLogin={showGoogle} to login/register views
```

### Fix 4: Update auth context after Google login

```typescript
// LoginView.tsx / RegisterView.tsx
<GoogleLoginButton
  role="consumer"
  onSuccess={(user) => {
    setUser(user);  // <-- Add this line
    onNavigate("/products");
  }}
  onError={(msg) => {
    alert(msg);
  }}
/>
```

### Fix 5: Add error boundary to GoogleLoginButton

```typescript
// GoogleLoginButton.tsx — wrap in try-catch for SDK load failures
// Also add a visible error state instead of rendering nothing
```

### Fix 6: Remove token from response body

```typescript
// AuthController.ts — googleLogin() return
return res.json({
  message: 'Google login successful',
  // token removed — cookie is sufficient
  user: { id: userId, username, email, role: finalRole, ... }
});
```

---

## 5. Priority Checklist

| Priority | Task | Effort |
|----------|------|--------|
| 🔴 P0 | Configure Google Cloud Console and set `VITE_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_ID` | Manual setup |
| 🔴 P0 | Set `GOOGLE_CLIENT_ID` in Render dashboard env vars | Manual setup |
| 🔴 P0 | Update `apps/backend/.env.example` to include `GOOGLE_CLIENT_ID` | 1 min |
| 🟡 P1 | Add admin email whitelist to prevent unauthorized admin creation | 15 min |
| 🟡 P1 | Add `UNIQUE` constraint on `google_id` column | 5 min |
| 🟡 P1 | Conditionally show Google button when credentials are missing | 10 min |
| 🟡 P1 | Call `setUser()` in `onSuccess` callback for Google login | 5 min |
| 🟢 P2 | Remove JWT token from JSON response body | 5 min |
| 🟢 P2 | Add error boundary / fallback for GoogleLoginButton | 15 min |
| 🟢 P2 | Display profile picture in Navbar after Google login | 10 min |
| 🟢 P2 | Fix duplicate Google OAuth section in root `.env.example` | 2 min |

---

## 6. Summary

The Google OAuth implementation is **architecturally complete** — the frontend components, API layer, backend controller, routes, and database schema are all in place. However, **it will not work without Google Cloud Console credentials**, and there are significant **security gaps** (especially the admin role escalation vulnerability). The recommended path is:

1. **Immediate:** Set up Google Cloud Console and configure env vars
2. **Before production:** Add admin whitelist, unique constraint, conditional button visibility
3. **Post-launch:** Add profile picture display, error boundaries, account linking
