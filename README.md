# 🎯 VocaFluence - AI Fluency Trainer

**VocaFluence** is an AI-powered web application that helps users practice and improve fluency in **English, French, and Swahili**. The app guides students to read aloud, record their voice, and receive automated feedback based on a comparison between the spoken and reference texts.

## ✨ Features

### 🎓 Student Features
- **User Authentication**: Secure login/register with JWT
- **Script Management**: Browse and select training scripts by language
- **Voice Recording**: Record audio using browser MediaRecorder API
- **AI-Powered Transcription**: Real-time audio-to-text conversion using OpenAI Whisper API
- **AI Feedback**: Get instant scoring and feedback comments
- **Progress Tracking**: View history, statistics, and improvement trends
- **Practice Schedule**: Set up daily/weekly practice reminders
- **Dashboard**: Comprehensive overview of practice sessions and progress

### 👨‍💼 Admin Features
- **Script Upload**: Upload training scripts with reference audio
- **User Management**: View and manage student accounts
- **Analytics**: Monitor system usage and student progress
- **Reminder System**: Send custom reminders to students

### 🤖 AI Features
- **OpenAI Whisper Integration**: Real-time audio-to-text conversion
- **Scoring Algorithm**: Calculate accuracy, fluency, and overall scores
- **Feedback Generation**: Provide targeted feedback comments per session
- **Progress Analysis**: Track improvement over time
- **Transcript Comparison**: Side-by-side comparison of original script vs. user speech

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with **bcrypt** password hashing
- **Multer** for file uploads
- **NodeMailer** for email notifications
- **node-cron** for scheduled reminders
- **OpenAI SDK** for Whisper API integration

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API communication

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenAI API key (for Whisper functionality)

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vocfluence
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=5000
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## 🎯 Core Workflow

### 1. User Registration/Login
- Students register with email, password, and preferred language
- Admins can create accounts or be promoted via database

### 2. Script Selection
- Students browse available scripts filtered by language
- Scripts include text content and optional reference audio

### 3. Practice Session
- Student reads the script aloud while recording
- Audio is uploaded to server for processing
- **OpenAI Whisper API transcribes audio to text**
- System compares transcribed text with original script
- System calculates accuracy, fluency, and overall score
- Student receives targeted feedback comments
- **Transcript comparison is displayed for review**

### 4. Progress Tracking
- All sessions are saved with scores, feedback, and transcripts
- Dashboard shows statistics and recent sessions
- History page displays all practice sessions
- Progress charts show improvement over time

### 5. Reminder System
- Students set practice schedule (daily/weekly/custom)
- System checks for missed sessions daily
- Email reminders sent to students who haven't practiced

## 🔧 OpenAI Whisper Integration

### Features
- **Real-time Audio Transcription**: Converts recorded speech to text using OpenAI's Whisper API
- **Multi-language Support**: Supports English, French, and Swahili transcription
- **Confidence Scoring**: Provides confidence levels for transcription accuracy
- **Error Handling**: Graceful fallback when API is unavailable

### Setup
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add the key to your `.env` file as `OPENAI_API_KEY`
3. The system will automatically initialize the Whisper integration

### Usage
- Record audio during practice sessions
- Audio is automatically sent to Whisper API for transcription
- Transcribed text is compared with the original script
- Results include both the original script and your transcribed speech

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set build command: `cd server && pnpm install && pnpm run build`
3. Set start command: `cd server && pnpm start`
4. Add environment variables in Render dashboard

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set build command: `cd client && pnpm install && pnpm run build`
3. Set output directory: `client/dist`
4. Add environment variables in Vercel dashboard

## 📁 Project Structure

```
VocaFluence/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Backend Node.js app
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (including AI service)
│   │   └── index.ts        # Server entry point
│   ├── uploads/            # File uploads
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 