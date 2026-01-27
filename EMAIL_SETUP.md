# Email Configuration Setup Guide

This guide will help you configure email functionality for password reset and notifications.

## Required Environment Variables

Add these variables to your `.env` file in the server directory:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

## Gmail Configuration (Recommended for Development)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "VocaFluence" or similar
4. Click "Generate"
5. Copy the 16-character password
6. Use this as your `EMAIL_PASS` in the `.env` file

### Step 3: Update .env File

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # The 16-char app password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Alternative Email Providers

### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Outlook/Office365

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

## Production Configuration

For production (e.g., Vercel, Render, etc.), set these environment variables in your hosting platform:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-production-domain.com
NODE_ENV=production
```

## Testing Email Functionality

### 1. Start the Server

```bash
cd server
npm run dev
```

### 2. Request Password Reset

- Navigate to http://localhost:5173/forgot-password
- Enter a registered email address
- Click "Send reset instructions"

### 3. Check Email

- In **development mode**: Token will display on screen + email sent
- In **production mode**: Only email will be sent (token hidden)

### 4. Check Server Logs

Look for these messages:

```
✅ Email Service initialized successfully
Password reset email sent: <message-id>
```

## Troubleshooting

### "Invalid credentials" Error

- Double-check your app password (no spaces)
- Ensure 2FA is enabled on Gmail
- Regenerate app password if needed

### "Connection timeout" Error

- Check if port 587 is blocked by firewall
- Try port 465 with `secure: true` option
- Verify EMAIL_HOST is correct

### Email Not Received

- Check spam/junk folder
- Verify EMAIL_USER is correct
- Check server logs for errors
- Test with a different email provider

### Development Mode Token Not Showing

- Ensure `NODE_ENV=development` in `.env`
- Check browser console for errors
- Verify backend is returning `resetToken` in response

## Security Notes

1. **Never commit .env files** - Add `.env` to `.gitignore`
2. **Use app-specific passwords** - Never use your main email password
3. **Rotate credentials regularly** - Especially in production
4. **Token expiration** - Reset tokens expire after 1 hour
5. **Rate limiting** - Consider adding rate limits to prevent abuse

## Email Templates

The system includes professionally designed HTML email templates for:

- Password reset instructions
- Welcome emails (optional)
- Practice reminders (optional)

These templates are fully responsive and work across all email clients.
