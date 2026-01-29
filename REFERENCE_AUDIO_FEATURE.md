# Reference Audio Feature Implementation

## Overview
Implemented a comprehensive reference audio system that allows administrators to upload pronunciation examples for scripts, which students can listen to before recording their own practice sessions.

## Features Implemented

### 1. Admin Script Upload (Client-side)
**File**: [client/src/pages/AdminScripts.tsx](client/src/pages/AdminScripts.tsx)

#### Added Functionality:
- **Audio Upload/Recording**: Admins can either:
  - Upload an audio file directly using file input
  - Record audio using their microphone in real-time
- **Audio Management**:
  - Preview uploaded/recorded audio before submission
  - Clear audio and reselect
  - Visual feedback during recording (pulsing indicator)
  - File size validation (max 10MB)
  - Audio format validation (audio files only)

#### New UI Components:
- Reference Audio section in the script form
- Three action buttons:
  - "Upload Audio File" - Opens file picker
  - "Record Audio" - Starts microphone recording
  - "Stop Recording" - Stops recording session (appears during recording)
  - "Clear Audio" - Removes selected audio
- Audio preview player showing uploaded/recorded audio
- Recording status indicator

#### New States:
```typescript
const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null)
const [referenceAudioURL, setReferenceAudioURL] = useState<string>('')
const [isRecordingRef, setIsRecordingRef] = useState(false)
const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
```

#### New Methods:
- `startRecordingReference()` - Initiates microphone recording
- `stopRecordingReference()` - Stops recording and processes audio blob
- `handleFileSelect()` - Processes selected audio file
- `clearReferenceAudio()` - Clears all audio data

#### Form Submission:
- Updated form submission to send `FormData` instead of JSON
- Audio file is sent as `referenceAudio` field in multipart form
- Tags are serialized as JSON string due to FormData limitations

### 2. Backend Script Upload (Server-side)
**File**: [server/src/routes/scripts.ts](server/src/routes/scripts.ts)

#### Multer Configuration:
- Configured separate upload destination for reference audio: `uploads/reference-audio/`
- 10MB file size limit
- Audio MIME type validation
- Automatic filename generation with timestamp

#### Route Updates:

**POST /scripts** (Create script):
- Added `upload.single('referenceAudio')` middleware
- Parses `tags` from JSON string to array
- Stores `referenceAudioURL` as relative path: `/uploads/reference-audio/{filename}`
- Validates all required fields

**PUT /scripts/:id** (Update script):
- Added `upload.single('referenceAudio')` middleware
- Allows updating reference audio for existing scripts
- Handles both JSON and string tag formats

#### Example API Response:
```json
{
  "message": "Script created successfully.",
  "script": {
    "_id": "...",
    "title": "Greetings",
    "textContent": "Hello, how are you?",
    "language": "english",
    "difficulty": "beginner",
    "referenceAudioURL": "/uploads/reference-audio/referenceAudio-1234567890-123456789.webm",
    "tags": ["greetings", "basic"],
    "uploadedBy": "..."
  }
}
```

### 3. Student Practice Interface (Client-side)
**File**: [client/src/pages/Practice.tsx](client/src/pages/Practice.tsx)

#### Student Experience:
1. When selecting a script with reference audio:
   - Before recording starts, students see the reference audio player
   - Player includes message: "Listen to Reference Audio First"
   - Help text: "Listen to how the script should be pronounced before recording"

2. Audio Player Features:
   - Full browser audio controls (play, pause, volume, seek)
   - Professional styling with blue primary color
   - Responsive width on mobile devices
   - Only visible before recording starts

#### UI Changes:
- Start Recording button section now flexbox column layout
- Reference audio player positioned above Start Recording button
- Uses `Volume2` icon for visual indication
- Light blue background (`primary-50`) with blue border

#### Script Interface Updated:
```typescript
interface Script {
    referenceAudioURL?: string
    // ... other fields
}
```

### 4. Feedback Audio Labeling Update
**File**: [client/src/pages/Feedback.tsx](client/src/pages/Feedback.tsx)

#### Renamed Audio Section:
- **Old**: "Reference Pronunciation Guide"
- **New**: "Pronunciation Correction"

#### Updated Text:
- Button text changed to "Play Correction Audio" (was "Play Reference Audio")
- Help text now clarifies: "Listen to how your instructor pronounces the text correctly"

#### Purpose Clarification:
This distinguishes between:
- **Reference Audio** (new feature): Admin-provided pronunciation examples for scripts before recording
- **Correction Audio** (in Feedback): Admin's corrective pronunciation after student recording

## Directory Structure

```
server/
├── uploads/
│   ├── reference-audio/          (NEW - stores reference audio files)
│   └── 8cd3a56ecff...           (existing - stores student recordings)
```

## Technical Details

### Frontend Technologies Used:
- MediaRecorder API for audio recording
- getUserMedia for microphone access
- Blob and File APIs for audio handling
- FormData for multipart file upload
- React hooks (useState, useRef, useEffect) for state management

### Backend Technologies Used:
- Multer for file upload handling
- Express static file serving
- Path utilities for file naming

### Audio Format Support:
- Upload: Any audio format supported by browser (MP3, WAV, M4A, WebM, etc.)
- Recording: WebM with Opus codec
- Storage: Stored with original extension
- URLs: Relative paths accessible via `/uploads/reference-audio/`

## Key Features

1. **Flexible Audio Input**:
   - Upload existing audio files
   - Record new audio using microphone
   - Audio format validation
   - File size limits (10MB)

2. **User Experience**:
   - Real-time recording indicator
   - Audio preview before submission
   - Clear error messages
   - Toast notifications for user feedback

3. **Security**:
   - Admin-only script creation/upload
   - Audio MIME type validation
   - File size limits prevent abuse
   - Authentication middleware on all routes

4. **Accessibility**:
   - Standard HTML5 audio controls
   - Clear labeling and help text
   - Responsive design for mobile
   - Icon indicators for audio content

## Testing Checklist

✅ Admin can upload audio file when creating script
✅ Admin can record audio using microphone when creating script
✅ Audio file is validated (type and size)
✅ Recorded audio plays correctly in preview
✅ Script saves successfully with reference audio URL
✅ Students see reference audio player in Practice page
✅ Reference audio is playable for students before recording
✅ Feedback section shows "Pronunciation Correction" with correct audio playback
✅ Audio files are properly stored in `/uploads/reference-audio/`
✅ Static file serving works correctly for audio URLs
✅ Form submission handles both multipart and JSON data

## Future Enhancements

1. **Audio Trimming**: Allow admins to trim/edit audio before upload
2. **Multiple Reference Audio**: Support multiple examples per script
3. **Audio Visualization**: Waveform display during recording/playback
4. **Transcription**: Auto-transcribe reference audio for accessibility
5. **Student Upload Permission**: Allow selected students to upload reference audio
6. **Audio Quality Metrics**: Show bitrate, duration, quality information
7. **Audio Library**: Reuse audio across multiple scripts
8. **Bulk Upload**: Upload multiple scripts with audio at once

## Deployment Notes

1. Ensure `uploads/` and `uploads/reference-audio/` directories exist on deployment server
2. Configure storage to persist uploads (for platforms like Render)
3. Set appropriate file upload size limits in reverse proxy (nginx, etc.)
4. Consider CDN for audio file serving in production
5. Implement cleanup jobs for unused audio files

## API Documentation

### Create Script with Reference Audio
```bash
curl -X POST http://localhost:5000/api/scripts \
  -H "Authorization: Bearer {token}" \
  -F "title=Greetings" \
  -F "textContent=Hello, how are you?" \
  -F "language=english" \
  -F "difficulty=beginner" \
  -F "tags=greetings,basic" \
  -F "referenceAudio=@/path/to/audio.mp3"
```

### Update Script Reference Audio
```bash
curl -X PUT http://localhost:5000/api/scripts/{scriptId} \
  -H "Authorization: Bearer {token}" \
  -F "referenceAudio=@/path/to/new-audio.wav"
```

## Files Modified

1. **Client Files**:
   - `client/src/pages/AdminScripts.tsx` - Added reference audio upload UI
   - `client/src/pages/Practice.tsx` - Added reference audio player
   - `client/src/pages/Feedback.tsx` - Renamed feedback audio section

2. **Server Files**:
   - `server/src/routes/scripts.ts` - Added multipart file handling

## Compatibility

- ✅ Chrome/Chromium (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (iOS 14.5+, macOS)
- ✅ Edge (all versions)
- ✅ Mobile browsers (with microphone permission)
- ⚠️ IE11 and older (not supported - WebRTC required)

## Troubleshooting

### Audio Upload Fails
- Check file format (must be audio MIME type)
- Check file size (must be under 10MB)
- Verify admin authentication token
- Check server disk space

### Microphone Recording Not Working
- Grant microphone permission in browser
- Check browser console for errors
- Ensure HTTPS on production (required for getUserMedia)
- Verify MediaRecorder API browser support

### Audio Playback Issues
- Check network tab for correct URL
- Verify file exists in `uploads/reference-audio/`
- Check browser audio policies/autoplay settings
- Verify audio file integrity

## Performance Considerations

- Large audio files (>5MB) may slow down file transfer
- Consider compressing audio before upload in production
- Implement audio streaming for large files
- Use CDN for audio delivery in production
