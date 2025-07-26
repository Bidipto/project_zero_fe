# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for your Project Zero application.

## Prerequisites

- A GitHub account
- Access to your backend API (to handle OAuth token exchange)

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Project Zero (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Application description**: Optional description
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`

4. Click "Register application"
5. Copy the **Client ID** (you'll need this for the environment variables)

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the environment variables in `.env.local`:
   ```env
   # Backend URL
   BACKEND_URL=http://127.0.0.1:8000
   
   # GitHub OAuth Configuration
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
   NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
   ```

3. Replace `your_github_client_id_here` with the Client ID from Step 1.

## Step 3: Backend API Requirements

Your backend API needs to handle the GitHub OAuth callback. The frontend will make a POST request to:

```
POST /v1/auth/github/callback
```

### Request Body:
```json
{
  "code": "authorization_code_from_github",
  "state": "state_parameter_for_security",
  "redirect_uri": "http://localhost:3000/login/github/callback"
}
```

### Expected Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "github_username",
    "email": "user@example.com",
    "name": "User Full Name",
    "avatar_url": "https://github.com/avatars/user.png"
  }
}
```

## Step 4: Backend Implementation (Example)

Here's a basic example of what your backend endpoint should do:

```python
# Python/FastAPI example
import requests
from fastapi import HTTPException

@app.post("/v1/auth/github/callback")
async def github_callback(request: GitHubCallbackRequest):
    # Exchange authorization code for access token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": request.code,
            "redirect_uri": request.redirect_uri
        },
        headers={"Accept": "application/json"}
    )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    # Get user information from GitHub
    user_response = requests.get(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
    )
    
    github_user = user_response.json()
    
    # Create or update user in your database
    user = create_or_update_user(github_user)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url
        }
    }
```

## Step 5: Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click the "Continue with GitHub" button

4. You should be redirected to GitHub for authorization

5. After authorizing, you should be redirected back to your app and logged in

## Security Considerations

1. **State Parameter**: The implementation includes a state parameter to prevent CSRF attacks
2. **HTTPS in Production**: Always use HTTPS in production environments
3. **Client Secret**: Never expose the GitHub client secret in frontend code
4. **Token Storage**: Store JWT tokens securely (localStorage is used for this example, but consider more secure options for production)

## Troubleshooting

### Common Issues:

1. **"GitHub OAuth is not configured"**
   - Make sure `NEXT_PUBLIC_GITHUB_CLIENT_ID` is set in your environment variables

2. **"Invalid state parameter"**
   - This usually happens if the page is refreshed during the OAuth flow
   - Clear localStorage and try again

3. **"Missing required OAuth parameters"**
   - Check that your GitHub OAuth app callback URL matches exactly
   - Ensure the redirect URI in your environment variables matches

4. **Backend API errors**
   - Check that your backend is running and accessible
   - Verify the API endpoint `/v1/auth/github/callback` exists and is working

### Debug Mode:

To enable debug logging, add this to your environment variables:
```env
NEXT_PUBLIC_DEBUG=true
```

## Production Deployment

For production deployment:

1. Update the GitHub OAuth app settings:
   - **Homepage URL**: Your production domain
   - **Authorization callback URL**: `https://yourdomain.com/auth/github/callback`

2. Update environment variables:
   ```env
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_production_client_id
   NEXT_PUBLIC_GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback
   BACKEND_URL=https://your-backend-api.com
   ```

3. Ensure your backend API is deployed and accessible

## Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) 