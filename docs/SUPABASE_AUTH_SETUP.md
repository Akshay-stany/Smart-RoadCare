# RoadCare — Supabase Authentication & Email OTP Setup Guide

This guide details the exact Supabase Dashboard configuration required for RoadCare's production-grade authentication flow, email 6-digit OTP verification, role-based access control, and Google OAuth integration.

---

## 1. Audit of Historical Migrations & Confirmation Shortcuts

### Historical Issue in Migration `20260331160728_remote_schema.sql`
In an earlier version of the project, development convenience SQL was added:
```sql
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
```
### Security & Architectural Assessment:
- **Do not repeat this behavior for new users.** Bypassing email verification manually in SQL subverts account ownership validation and allows unverified email addresses to file civic complaints or impersonate citizens.
- In RoadCare Phase 2:
  - Users sign up with full name, email, password, and terms acceptance.
  - Supabase Auth dispatches a genuine 6-digit OTP code to the user's email.
  - The citizen is navigated to `/verify-otp?email=...` where they enter the 6-digit code.
  - Verification is confirmed via `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
  - Only upon successful Supabase confirmation is the account considered active.

---

## 2. Supabase Dashboard Configuration

Navigate to your Supabase project dashboard at `https://supabase.com/dashboard/project/<project-id>`.

### Step 2.1 — Enable Email Signup & Confirmations
1. Go to **Authentication** > **Providers** > **Email**.
2. **Enable Email provider:** Toggle ON.
3. **Confirm email:** Toggle ON. (Ensures that new signups must enter their OTP before protected dashboard access).
4. **Secure email change:** Toggle ON.

### Step 2.2 — Configure the 6-Digit OTP Email Template
By default, Supabase email templates use magic links (`{{ .ConfirmationURL }}`). To use the 6-digit OTP interface built into RoadCare (`/verify-otp`):
1. Go to **Authentication** > **Email Templates** > **Confirm signup**.
2. **Subject:** `Your RoadCare Verification Code: {{ .Token }}`
3. **Body:** Replace the HTML content with the following responsive civic template:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="display: flex; align-items: center; margin-bottom: 24px;">
    <h2 style="color: #0b1328; margin: 0; font-size: 22px; font-weight: 700;">Road<span style="color: #10b981;">Care</span></h2>
  </div>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
    Hello,
  </p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Thank you for registering with RoadCare. Use the 6-digit verification code below to verify your email address and activate your citizen account:
  </p>
  <div style="background: #f1f5f9; padding: 18px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
    <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0b1328; font-family: monospace;">{{ .Token }}</span>
  </div>
  <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
    This verification code will expire in 10 minutes. If you did not create a RoadCare account, you can safely ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
    RoadCare Civic Infrastructure Reporting Platform &copy; 2026. All rights reserved.
  </p>
</div>
```
4. Click **Save**.

### Step 2.3 — Configure Rate Limits & Expiry
1. Go to **Authentication** > **Rate Limits**.
2. **Email OTP Expiry:** Set to `600` seconds (10 minutes).
3. **Resend Email Limit:** Standard Supabase limit is 3 requests per 60 seconds. The frontend implements a 60-second cooldown timer on the Resend button.

### Step 2.4 — Configure URL Configuration & Redirects
1. Go to **Authentication** > **URL Configuration**.
2. **Site URL:**
   - Development: `http://localhost:8080` (or `http://localhost:5173`)
   - Production: `https://your-domain.gov`
3. **Redirect URLs:** Add:
   - `http://localhost:8080/**`
   - `http://localhost:8080/auth`
   - `http://localhost:8080/verify-otp`
   - `http://localhost:8080/reset-password`

### Step 2.5 — Optional Google OAuth Setup
If enabling Google Sign-In (Screen 2 from the reference visual):
1. In Google Cloud Console, create an OAuth 2.0 Web Client.
2. Add Authorized Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
4. Enable Google, paste `Client ID` and `Client Secret`, and Save.

---

## 3. Database Roles & Row Level Security

RoadCare supports 3 distinct user roles defined in `public.app_role`:
1. `citizen`: Can report issues, track own issues, view public map, and receive updates.
2. `officer`: Field maintenance officer. Assigned to specific tasks, uploads repair evidence, updates status to `in_progress` or `resolved`.
3. `admin`: Municipal administrator. Can triage complaints, assign officers, override priority, and review analytics.

### Role Table (`public.user_roles`)
The `user_roles` table stores the authoritative role:
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Initial Administrator Provisioning
To grant administrator access to your initial account:
```sql
-- Replace with your Supabase auth user ID
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = 'YOUR-USER-UUID-HERE';
```
*(Never allow users to modify `public.user_roles` through client-side Supabase requests; RLS only permits administrators or backend service-role access to edit roles).*
