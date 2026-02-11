# Grammar AI-Scored Recording - Quick Testing Guide

## Prerequisites

- Node.js and npm/pnpm installed
- OpenAI API key set in `.env` (OPENAI_API_KEY)
- MongoDB running
- Server running on `http://localhost:5000`
- Client running on `http://localhost:5173` (Vite)

## Quick Start

### 1. Start the Server

```bash
cd server
npm run dev
# or
pnpm dev
```

### 2. Start the Client

```bash
cd client
npm run dev
# or
pnpm dev
```

### 3. Login or Register

- Go to `http://localhost:5173`
- Register a new account or login with existing credentials
- Navigate to the Grammar section

## Testing the Feature

### Scenario 1: Successful Recording (Score >= 60)

**Steps:**

1. Click on "Lesson 1" in the grammar selector
2. Read the displayed lesson explanation and examples
3. Click "Start Recording"
4. Read the lesson aloud clearly and confidently
5. Click "Stop Recording"
6. Click "Play Recording" to verify (optional)
7. Click "Complete Lesson & Continue"

**Expected Results:**

- System evaluates recording
- Shows: "Excellent! Score: XX/100"
- Color-coded green feedback with comments
- Auto-advances to next lesson after 2 seconds
- Lesson marked as completed in selector

### Scenario 2: Failed Recording (Score < 60)

**Steps:**

1. Click on "Lesson 1"
2. Click "Start Recording"
3. Read only a portion of the lesson (incorrect/incomplete)
4. Click "Stop Recording"
5. Click "Complete Lesson & Continue"

**Expected Results:**

- System evaluates recording
- Shows: "Score: XX/100 - FAILED"
- Color-coded red feedback with comments
- "You need 60+ to proceed" message
- "Record Again" button appears
- Lesson NOT marked as completed

### Scenario 3: Retry After Failed Recording

**Steps:**

1. From Scenario 2 result page
2. Click "Record Again"
3. Read the lesson aloud more carefully
4. Click "Complete Lesson & Continue"

**Expected Results:**

- Recording state cleared from previous attempt
- New recording evaluated
- If score >= 60: Shows success and advances
- If score < 60: Still fails, can retry again

## Checking Backend Logs

### Monitor Recording Evaluation

```bash
# In server terminal, look for:
[Server logs should show]:
- "Starting transcription for grammar lesson: [Lesson Title]"
- "Transcription completed: [User's transcript]"
- "Feedback generated: { score: XX, accuracy: XX, fluency: XX }"
```

### Verify Database Changes

```bash
# Check GrammarProgress collection:
db.grammarprogressions.findOne({ userId: "[your-user-id]" })

# Example output (after successful submission):
{
  userId: "...",
  topicId: "a1-01",
  currentDay: 2,  // Advanced to next day
  completed: false,
  scores: {
    day1: 75  // AI-evaluated score, not random
  }
}
```

## Debug Information

### Enable Detailed Logging

In `server/src/routes/grammar.ts`, the endpoint logs:

1. Transcription start/completion
2. Feedback generation results
3. Score validation results
4. Progress save status

### Check Frontend State

Open browser DevTools Console to see:

```javascript
// After submission, check:
console.log(submissionScore); // Should show actual score
console.log(submissionStatus); // Should be 'pass' or 'fail'
console.log(submissionFeedback); // Should show AI comments
```

## Common Issues & Solutions

### Issue: "Audio file is required" Error

**Solution:** Ensure you're recording audio before clicking submit

- Click "Start Recording" first
- Make sure recording saved (green checkmark appears)

### Issue: "Only audio files are allowed" Error

**Solution:** Browser might be sending wrong MIME type

- Verify browser supports WebM audio
- Try different browser (Chrome/Firefox preferred)

### Issue: Transcription Returns Empty

**Solution:** Whisper API may not detect speech

- Speak louder during recording
- Ensure microphone is working
- Check OPENAI_API_KEY is valid

### Issue: OpenAI API Errors

**Solution:**

```
401 - Invalid API Key: Check .env for OPENAI_API_KEY
429 - Rate Limited: Wait a few minutes, retry
413 - File Too Large: Limit audio to 25MB max
```

## Performance Testing

### Typical Evaluation Times:

- Transcription: 3-5 seconds
- Feedback Generation: < 1 second
- Total Time: ~4-6 seconds

### Monitor Performance:

```
// In browser Network tab:
POST /api/grammar/progress/save-reading
- Look for request size (audio file size)
- Check response time (should be 4-6 seconds)
- Verify Content-Type: multipart/form-data
```

## Acceptance Criteria

- [x] User can record audio in grammar lesson
- [x] Recording is sent to backend as FormData
- [x] Whisper API transcribes recording
- [x] AI calculates accuracy and fluency scores
- [x] Overall score formula: (accuracy × 0.6) + (fluency × 0.4)
- [x] Score < 60: Returns error, blocks progression
- [x] Score >= 60: Saves progress, advances to next lesson
- [x] UI shows score and feedback to user
- [x] Retry mechanism available for failed attempts
- [x] Minimum score requirement (60+) clearly displayed
- [x] Progress saved correctly in database
- [x] ActivityLog entries created on topic completion

## Manual Score Verification

### Verify Scoring Formula:

If system returns:

- Accuracy: 80
- Fluency: 70
- Score displayed: 76

Manually verify:

```
(80 × 0.6) + (70 × 0.4) = 48 + 28 = 76 ✓
```

### Edge Cases to Test:

1. Perfect recording (100 accuracy, 100 fluency) → Should see 100
2. Poor recording (30 accuracy, 40 fluency) → Should see 34 (fail)
3. Borderline recording (60 accuracy, 61 fluency) → Should see ~60 (pass)
4. Complete mispronunciation → Should be < 30 (fail)
