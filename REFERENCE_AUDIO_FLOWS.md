# Reference Audio Feature - User Flows

## Admin Flow: Upload Reference Audio

### Step 1: Admin Creates/Edits Script
```
Admin Dashboard → Manage Scripts → Add Script (or Edit Script)
```

### Step 2: Fill Script Details
```
┌─────────────────────────────────────┐
│ Add New Script                      │
├─────────────────────────────────────┤
│ Title: [Greetings]                 │
│ Language: [English]                │
│ Difficulty: [Beginner]             │
│ Tags: [greetings, basic]           │
│ Content: [Hello, how are you?]     │
└─────────────────────────────────────┘
```

### Step 3: Add Reference Audio (NEW)
```
┌──────────────────────────────────────────────────────┐
│ Reference Audio (Optional)                           │
├──────────────────────────────────────────────────────┤
│ Upload audio for students to listen to before       │
│ recording their own pronunciation                    │
│                                                      │
│ [Upload Audio File] [Record Audio] [Clear Audio]   │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🎵 Recorded Audio                              │ │
│ │ <audio player controls>                         │ │
│ │ Play | ≡ 00:15                                  │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Step 4: Save Script
```
[Cancel] [Create Script]
   ↓
Script saved with reference audio URL:
/uploads/reference-audio/referenceAudio-1234567890-123456789.webm
```

---

## Student Flow: Practice with Reference Audio

### Step 1: Select Script
```
Practice Page
  ↓
Scripts List (filtered by language/difficulty)
  ↓
Click Script: "Greetings"
```

### Step 2: See Reference Audio
```
┌─────────────────────────────────────────────────────┐
│ Greetings                                           │
│ English • Beginner                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📢 Listen to Reference Audio First           │   │
│ │ ┌──────────────────────────────────────────┐ │   │
│ │ │ <audio player>                          │ │   │
│ │ │ 🔊 Volume: ════════  00:00 / 00:15     │ │   │
│ │ └──────────────────────────────────────────┘ │   │
│ │ Listen to how the script should be            │   │
│ │ pronounced before recording                   │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│           [🎙 Start Recording]                     │
│                                                     │
│ Font Size: [A-] 16px [A+]                         │
│                                                     │
│ Script Text:                                       │
│ "Hello, how are you?"                             │
└─────────────────────────────────────────────────────┘
```

### Step 3: Listen & Learn
- Student clicks play on reference audio
- Hears correct pronunciation
- Identifies key pronunciation points
- Pauses/rewinds as needed

### Step 4: Record Practice
- Student clicks "Start Recording"
- Records their own pronunciation
- Audio controls appear during recording
- Stops recording when done

### Step 5: Get Feedback & Correction Audio
```
Practice Results
├─ Score: 85%
├─ Accuracy: 90%
├─ Duration: 0:15
│
├─ Pronunciation Analysis
│ ├─ Hello: ✓ Correct
│ ├─ how: ✓ Correct
│ ├─ are: ✓ Correct
│ └─ you: ✓ Correct
│
└─ Feedback
  └─ Great pronunciation! Keep practicing
```

Later, when admin reviews:
```
Admin Reviews → Sends Correction Audio (if needed)

Student receives in Feedback page:
┌──────────────────────────────────────────┐
│ 🎵 Pronunciation Correction              │
├──────────────────────────────────────────┤
│ Listen to how your instructor            │
│ pronounces the text correctly to         │
│ improve your speaking                    │
│                                          │
│ [▶ Play Correction Audio] (0:15)         │
└──────────────────────────────────────────┘
```

---

## Feature Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ADMIN                             │
├─────────────────────────────────────────────────────┤
│  AdminScripts.tsx                                   │
│  ├─ Upload audio file                              │
│  └─ Record audio from microphone                   │
└──────────────┬──────────────────────────────────────┘
               │ FormData (multipart)
               │ POST /api/scripts
               ↓
┌─────────────────────────────────────────────────────┐
│              BACKEND (Express)                      │
├─────────────────────────────────────────────────────┤
│  routes/scripts.ts                                  │
│  ├─ Multer: File upload handling                   │
│  ├─ Validate: Audio MIME type, <10MB              │
│  └─ Store: /uploads/reference-audio/{filename}     │
│     Save URL in DB: referenceAudioURL              │
└──────────────┬──────────────────────────────────────┘
               │ Returns: {script with referenceAudioURL}
               ↓
┌─────────────────────────────────────────────────────┐
│                  DATABASE                          │
├─────────────────────────────────────────────────────┤
│  Script Collection                                  │
│  {                                                  │
│    _id: ObjectId,                                  │
│    title: "Greetings",                             │
│    referenceAudioURL: "/uploads/reference-audio/...", │
│    ...                                              │
│  }                                                  │
└──────────────┬──────────────────────────────────────┘
               │ GET /api/scripts
               ↓
┌─────────────────────────────────────────────────────┐
│                  STUDENT                           │
├─────────────────────────────────────────────────────┤
│  Practice.tsx                                       │
│  ├─ Display reference audio player                 │
│  ├─ Fetch audio from /uploads/reference-audio/...  │
│  └─ <audio> HTML5 control                          │
└─────────────────────────────────────────────────────┘
```

---

## Key Interactions

### 1. File Upload
```
Admin selects file → File validated → Sent with FormData → 
Multer processes → Stored in server → URL saved in DB
```

### 2. Microphone Recording
```
Admin clicks "Record" → getUserMedia permission → 
Recording starts → Blob collected → Audio preview → 
Ready to upload with form
```

### 3. Student Playback
```
Student clicks reference audio button → 
Browser fetches from /uploads/reference-audio/{filename} → 
HTML5 <audio> element plays → Standard controls available
```

### 4. Correction Audio
```
Admin uploads correction (in Feedback page) → 
Stored as referenceAudio field in Comment model →
Student sees "Pronunciation Correction" section →
Can play to hear corrected version
```

---

## Storage Locations

```
server/
├── uploads/
│   ├── reference-audio/              ← NEW: Reference audio files
│   │   ├── referenceAudio-1234567890-123456789.webm
│   │   ├── referenceAudio-1234567890-123456790.mp3
│   │   └── ...
│   │
│   └── 8cd3a56ecff.../              ← Existing: Student recordings
│       ├── recording-1234567890-123456789.webm
│       └── ...
```

Accessible via:
- `/uploads/reference-audio/referenceAudio-...` (web URL)
- `server/uploads/reference-audio/referenceAudio-...` (file path)

---

## User Experience Timeline

### Admin Perspective
```
T+0:00   Admin opens "Manage Scripts"
T+0:15   Admin clicks "Add Script"
T+0:30   Admin fills in script details (title, content, language, difficulty)
T+1:00   Admin clicks "Record Audio" OR "Upload Audio File"
T+1:30   Admin records/uploads reference audio
T+2:00   Admin sees preview of uploaded audio
T+2:15   Admin clicks "Create Script"
T+2:30   ✓ Script created with reference audio
T+2:45   Admin receives success toast notification
```

### Student Perspective
```
T+0:00   Student clicks "Practice"
T+0:15   Student filters by language (English)
T+0:30   Student sees script list
T+0:45   Student clicks "Greetings" script
T+1:00   ✓ Script page loads with reference audio player
T+1:15   Student plays reference audio
T+2:00   Student clicks "Start Recording"
T+2:15   Student records their pronunciation
T+3:00   Student clicks "Submit"
T+3:15   ✓ Results show pronunciation analysis
T+3:30   Student reviews feedback
(Later)
T+N:00   Admin uploads correction audio
T+N:15   Student sees "Pronunciation Correction" in Feedback page
T+N:30   Student plays correction audio to learn
```

---

## File Size & Duration Examples

| File | Size | Duration | Format | Use Case |
|------|------|----------|--------|----------|
| Short word | 50KB | 0:05 | WebM | Single word example |
| Phrase | 150KB | 0:15 | MP3 | Short phrase |
| Sentence | 400KB | 0:30 | WAV | Full sentence |
| Paragraph | 1.5MB | 1:30 | MP3 | Extended text |
| Dialog | 3MB | 3:00 | WebM | Conversation example |

All files must be < 10MB to upload.

---

## Error Handling

```
Admin Actions → Error Scenarios:

1. File Too Large
   User clicks Upload → Selects 15MB file → 
   ✗ Error: "File size must be less than 10MB"

2. Wrong File Type
   User clicks Upload → Selects image file →
   ✗ Error: "Please select an audio file"

3. Microphone Permission Denied
   User clicks Record → Browser permission prompt → 
   User clicks "Deny" →
   ✗ Error: "Failed to access microphone"

4. Network Error During Upload
   User clicks Create → Network drops →
   ✗ Error: "Failed to save script"
   Form remains filled with data for retry

All errors shown as red toast notifications with ❌ icon
```
