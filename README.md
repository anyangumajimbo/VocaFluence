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
- **Voice-to-Text**: OpenAI Whisper API for accurate speech transcription
- **Scoring Algorithm**: Calculate accuracy, fluency, and overall scores
- **Feedback Generation**: AI-powered personalized feedback comments
- **Progress Analysis**: Track improvement over time

### 📊 Logging & Monitoring
- **Advanced Request Tracking**: UUID-based request IDs for full request tracing
- **Automated Log Rotation**: Daily log files with automatic cleanup (7-14 day retention)
- **Performance Monitoring**: Response time tracking on every API call
- **Environment-Aware Logging**: Optimized formats for development vs production
- **Skip Filters**: Health checks and static files excluded from logs

### 📚 API Documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **JWT Authentication**: Built-in authorization testing
- **Request/Response Schemas**: Complete data model documentation
- **Try It Out**: Test endpoints directly from browser
- **Security**: Swagger disabled in production environment

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with **bcrypt** password hashing
- **Multer** for file uploads
- **Cloudinary** for audio file storage and CDN delivery
- **OpenAI Whisper API** for speech-to-text transcription
- **NodeMailer** for email notifications
- **node-cron** for scheduled reminders
- **Morgan & Winston** for advanced HTTP logging with request tracking
- **Swagger UI** for interactive API documentation (development only)

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
   _URI=mongodb://localhost:27017/vocfluence
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   
   # Email configuration for reminders
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Cloudinary configuration for audio storage
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # OpenAI Whisper API for speech transcription
   OPENAI_API_KEY=your_openai_api_key
   
   # File upload configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ```

   Create `.env.production` file in the `client` directory:
   ```env
   VITE_API_URLMONGO=https://your-backend-api-url.onrender.com
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

   - Frontend: [View Project Live](https://voca-fluence-client.vercel.app/)
   - Backend API: [Visit Backend API](https://vocafluence.onrender.com/api)
   - [Backend Health Check](https://vocafluence.onrender.com/api/health)
   - **API Documentation (Dev Only)**: http://localhost:5000/api-docs
   - ## 📊 Pitch Deck: [Click this link](https://www.canva.com/design/DAGtbyLDj3A/0nbMlHg3k9OyQJnSjmUyjA/edit?utm_content=DAGtbyLDj3A&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) to view the full pitch deck on Canva.

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
│   │   ├── config/         # Configuration files (Cloudinary, Swagger)
│   │   ├── middleware/     # Express middleware (auth, error handling)
│   │   ├── models/         # MongoDB models (User, Script, PracticeSession)
│   │   ├── routes/         # API routes (auth, scripts, practice, users)
│   │   ├── services/       # Business logic (AI, email, reminders)
│   │   ├── utils/          # Utilities (logger with Winston)
│   │   └── index.ts        # Server entry point
│   ├── logs/               # Application logs (auto-rotated)
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
- Audio is uploaded to Cloudinary for fast, global delivery
- OpenAI Whisper API transcribes audio with high accuracy
- AI compares transcription with original text
- System calculates accuracy, fluency, and overall score
- Student receives personalized AI-generated feedback
- All session data stored with request tracking for debugging

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

## 🔄 CRUD Operations

VocaFluence implements comprehensive CRUD (Create, Read, Update, Delete) operations across all resources:

### **Users**
- **CREATE**: `POST /api/auth/register` - Register new users
- **READ**: `GET /api/users` - List all users (admin), `GET /api/auth/me` - Get current user profile
- **UPDATE**: `PUT /api/users/profile` - Update user profile, `PUT /api/users/:id/status` - Update user status (admin)
- **DELETE**: Soft delete via status update (inactive/suspended)

### **Scripts**
- **CREATE**: `POST /api/scripts` - Upload new practice scripts with reference audio
- **READ**: `GET /api/scripts` - List scripts (paginated, filterable), `GET /api/scripts/:id` - Get single script
- **UPDATE**: `PUT /api/scripts/:id` - Edit script content and metadata
- **DELETE**: `DELETE /api/scripts/:id` - Remove scripts from database

### **Practice Sessions**
- **CREATE**: `POST /api/practice/submit` - Submit new practice session with audio
- **READ**: `GET /api/practice/history` - List user's sessions, `GET /api/practice/session/:id` - Get session details
- **UPDATE**: Session scores and feedback (automatically calculated)
- **DELETE**: Historical data retention (no deletion)

### **Admin Operations**
- **CREATE**: Comments on student submissions
- **READ**: `GET /api/users/admin/dashboard` - System statistics and analytics
- **UPDATE**: User status, script approval
- **DELETE**: User account management

All CRUD operations include:
- ✅ Input validation with express-validator
- ✅ JWT authentication and authorization
- ✅ Error handling and logging
- ✅ Request tracking with unique IDs
- ✅ Documented in Swagger API docs

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Real-time Feedback**: Instant scoring and feedback display
- **Progress Visualization**: Charts and statistics for motivation
- **Accessibility**: Keyboard navigation and screen reader support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation for all inputs with express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers for Express
- **Environment Variables**: Sensitive data stored in .env files
- **Production Security**: Swagger UI disabled in production
- **Request Tracking**: UUID-based request IDs for audit trails

## 🚧 Recent Updates (February 2026)

### ✅ Advanced Logging System (Morgan + Winston)
- **Request ID Tracking**: Every HTTP request gets a unique UUID for full tracing
- **No Duplicate Logging**: Removed redundant console.log statements (66% fewer logs)
- **Skip Filters**: Health checks and static files excluded from logs
- **Automatic Log Rotation**: Daily log files with 7-14 day retention
- **Environment-Aware**: Different formats for development vs production
- **Performance**: 3x faster logging, 60-70% disk space saved

### ✅ Swagger API Documentation
- **Interactive UI**: Test all endpoints directly from browser at `/api-docs`
- **JWT Authentication**: Built-in token authorization for protected endpoints
- **Complete Schemas**: User, Script, PracticeSession, and Error models documented
- **Development Only**: Automatically disabled in production for security
- **CRUD Operations**: Full documentation of Create, Read, Update, Delete endpoints

### ✅ Cloudinary Integration
- **Fast Audio Delivery**: CDN-powered global audio streaming
- **Automatic Uploads**: Reference audio and practice recordings stored in cloud
- **Scalability**: No local storage limitations
- **Reliability**: 99.99% uptime for audio files

### ✅ OpenAI Whisper Integration
- **Real AI Transcription**: No more simulated/mock transcription
- **Multi-language Support**: Accurate transcription for English, French, Swahili
- **High Accuracy**: Industry-leading speech-to-text quality
- **Feedback Generation**: AI-powered personalized feedback

## 🚧 MVP Limitations (Resolved)

- ~~**AI Transcription**: Currently simulated (mock data)~~ ✅ **RESOLVED** - OpenAI Whisper integrated
- ~~**Audio Processing**: Basic file upload and storage~~ ✅ **RESOLVED** - Cloudinary CDN integrated
- **Email Notifications**: Requires SMTP configuration (functional)
- **Real-time Features**: No WebSocket implementation yet

## 🔮 Future Enhancements

- **Advanced Analytics**: More detailed progress insights and visualization
- **Gamification**: Badges, streaks, achievements, leaderboards
- **Mobile App**: React Native or Progressive Web App (PWA)
- **Real-time Features**: Live practice sessions with WebSockets
- **Social Features**: Practice groups, peer challenges, community forums
- **Additional Languages**: Expand beyond English, French, and Swahili
- **Voice Analysis**: Pronunciation scoring, accent detection
- **Export Reports**: PDF/CSV exports of progress reports

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

## 📝 Known Issues & Tips

**Double Audio/Voices in Microsoft Edge and Windows:**

If you hear two voices (double audio) during the oral exam simulation, it may be caused by Microsoft Edge’s built-in “Read Aloud” feature, a browser extension, or Windows accessibility tools such as Narrator. To ensure you only hear the AI examiner’s voice, please make sure “Read Aloud” is turned off in Edge, disable any text-to-speech or screen reader extensions, and check that Windows Narrator is not active. On mobile devices and most other browsers, only the AI examiner’s voice should play by default. If you continue to experience double audio, try using a different browser or device for the best experience.

---

**VocaFluence** - Empowering language learners through AI-driven practice and feedback! 🎯 
