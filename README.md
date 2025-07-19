# 🎯 VocaFluence - AI Fluency Trainer

**VocaFluence** is an AI-powered web application that helps users practice and improve fluency in **English, French, and Swahili**. The app guides students to read aloud, record their voice, and receive automated feedback based on a comparison between the spoken and reference texts.

## ✨ Features

### 🎓 Student Features
- **User Authentication**: Secure login/register with JWT
- **Script Management**: Browse and select training scripts by language
- **Voice Recording**: Record audio using browser MediaRecorder API
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
- **Voice-to-Text**: Convert audio recordings to text (simulated for MVP)
- **Scoring Algorithm**: Calculate accuracy, fluency, and overall scores
- **Feedback Generation**: Provide 3 targeted feedback comments per session
- **Progress Analysis**: Track improvement over time

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with **bcrypt** password hashing
- **Multer** for file uploads
- **NodeMailer** for email notifications
- **node-cron** for scheduled reminders

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API communication
- **Lucide React** for icons
- **Recharts** for data visualization

### Development Tools
- **pnpm** for package management
- **ESLint** for code linting
- **Prettier** for code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (install with `npm install -g pnpm`)
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VocaFluence
   ```

2. **Install dependencies**
   ```bash
   pnpm install:all
   ```

3. **Environment Setup**

   Create `.env` file in the `server` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/vocfluence
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   
   # Email configuration for reminders
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # File upload configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ```

   Create `.env.production` file in the `client` directory:
   ```env
   VITE_API_URL=https://your-backend-api-url.onrender.com
   ```

4. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start individually
   pnpm --filter server dev    # Backend on http://localhost:5000
   pnpm --filter client dev    # Frontend on http://localhost:5173
   ```

5. **Access the Application**

   -## 📊 Pitch Deck: [Click this link](https://www.canva.com/design/DAGtbyLDj3A/0nbMlHg3k9OyQJnSjmUyjA/edit?utm_content=DAGtbyLDj3A&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) to view the full pitch deck on Canva.
   - Frontend: [View Project Live](https://voca-fluence-client.vercel.app/)
   - Backend API: [Visit Backend API](https://vocafluence.onrender.com/api)
   - [Backend Health Check](https://vocafluence.onrender.com/api/health)

## 📁 Project Structure

```
VocaFluence/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Backend Node.js app
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Server entry point
│   ├── uploads/            # File uploads
│   └── package.json
├── package.json            # Root package.json
└── README.md
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
- AI transcribes audio and compares with original text
- System calculates accuracy, fluency, and overall score
- Student receives 3 targeted feedback comments

### 4. Progress Tracking
- All sessions are saved with scores and feedback
- Dashboard shows statistics and recent sessions
- History page displays all practice sessions
- Progress charts show improvement over time

### 5. Reminder System
- Students set practice schedule (daily/weekly/custom)
- System checks for missed sessions daily
- Email reminders sent to students who haven't practiced

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set build command: `cd server && pnpm install && pnpm run build`
3. Set start command: `cd server && pnpm start`
4. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set root directory to `client`
3. Vercel will auto-detect Vite configuration
4. Add environment variable:
   - `VITE_API_URL` (your backend URL)

## 🔧 Development

### Available Scripts

```bash
# Root level
pnpm dev              # Start both frontend and backend
pnpm build            # Build both applications
pnpm install:all      # Install all dependencies

# Backend only
pnpm --filter server dev     # Start backend in development
pnpm --filter server build   # Build backend
pnpm --filter server start   # Start production backend

# Frontend only
pnpm --filter client dev     # Start frontend in development
pnpm --filter client build   # Build frontend
pnpm --filter client preview # Preview production build
```

### Database Models

**User**
- email, password, role (student/admin)
- preferredLanguage, schedule settings
- createdAt, updatedAt

**Script**
- title, textContent, language
- referenceAudioURL, difficulty, tags
- uploadedBy, isActive

**PracticeSession**
- userId, scriptId, userAudioURL
- aiTranscript, score, feedbackComments
- accuracy, fluency, duration
- timestamp

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Real-time Feedback**: Instant scoring and feedback display
- **Progress Visualization**: Charts and statistics for motivation
- **Accessibility**: Keyboard navigation and screen reader support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers for Express

## 🚧 MVP Limitations

- **AI Transcription**: Currently simulated (mock data)
- **Audio Processing**: Basic file upload and storage
- **Email Notifications**: Requires SMTP configuration
- **Real-time Features**: No WebSocket implementation yet

## 🔮 Future Enhancements

- **Real AI Integration**: OpenAI Whisper for transcription
- **Advanced Analytics**: Detailed progress insights
- **Gamification**: Badges, streaks, achievements
- **Mobile App**: React Native or PWA
- **Real-time Features**: Live practice sessions
- **Social Features**: Practice groups and challenges

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**VocaFluence** - Empowering language learners through AI-driven practice and feedback! 🎯 
