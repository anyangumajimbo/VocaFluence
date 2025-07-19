# Environment Setup for VocaFluence

## Required Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/vocfluence

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration (REQUIRED for Whisper API)
OPENAI_API_KEY=your-openai-api-key-here

# Email Configuration (for reminders)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the key and paste it as the value for `OPENAI_API_KEY`

## Important Notes

- The OpenAI API key is required for the Whisper audio-to-text functionality
- Keep your API key secure and never commit it to version control
- The Whisper API has usage limits and costs associated with it
- For development, you can use the free tier which includes some free API calls 