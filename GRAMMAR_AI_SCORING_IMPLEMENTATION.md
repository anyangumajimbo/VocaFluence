# Grammar Lesson AI-Scored Recording Implementation

## Overview

Implemented mandatory AI-scored video recording requirement for grammar lesson progression. Users must achieve a minimum score of **60/100** to unlock the next lesson. Recordings are evaluated using OpenAI's Whisper API and AI feedback generation.

## Implementation Summary

### Backend Changes

#### 1. **server/src/routes/grammar.ts**

**New Features:**

- Added `multer` middleware to handle audio file uploads
- Memory storage configuration for efficient file handling
- Audio file validation (only accepts audio/\* MIME types)
- 25MB file size limit

**Updated Endpoint: `POST /grammar/progress/save-reading`**

```typescript
router.post(
  "/progress/save-reading",
  upload.single("audio"),
  async (req: any, res: Response) => {
    // Key changes:
    // 1. Accepts audio file via multer middleware
    // 2. Fetches lesson content (explanation + example sentences)
    // 3. Transcribes audio using AIService.transcribeAudio()
    // 4. Generates feedback using AIService.generateFeedback()
    // 5. Compares expected content vs user's reading
    // 6. Validates score >= 60 minimum requirement
    // 7. Returns error with score if score < 60
    // 8. Only saves progress if score >= 60
    // 9. Advances to next day/topic only on success
  },
);
```

**Input Parameters:**

- `audio` (FormData file): User's recording in audio/webm format
- `topicId` (string): Grammar topic ID
- `day` (number): Lesson day
- `duration` (optional number): Recording duration (defaults to 10 seconds)

**Response Structure (Success - Score >= 60):**

```json
{
  "success": true,
  "message": "Excellent! Score: 75/100. Moving to next lesson...",
  "score": 75,
  "accuracy": 80,
  "fluency": 70,
  "feedback": ["Great pronunciation!", "Good pace", "Keep practicing"],
  "data": {
    /* GrammarProgress object */
  }
}
```

**Response Structure (Failure - Score < 60):**

```json
{
  "success": false,
  "message": "Score too low (45/100). You need 60+ to proceed. Please try again.",
  "score": 45,
  "accuracy": 50,
  "fluency": 40,
  "feedback": ["Work on pronunciation", "Increase speaking pace"],
  "minimumRequired": 60
}
```

### Frontend Changes

#### 2. **client/src/pages/Grammar.tsx**

**New State Variables:**

```typescript
const [submissionScore, setSubmissionScore] = useState<number | null>(null);
const [submissionFeedback, setSubmissionFeedback] = useState<string[] | null>(
  null,
);
const [submissionStatus, setSubmissionStatus] = useState<
  "idle" | "pass" | "fail" | "submitting"
>("idle");
```

**Updated `submitLesson()` Function:**

- Changed from accepting random score to sending audio blob via FormData
- Sends request as `multipart/form-data` with audio file
- Handles both success (score >= 60) and failure (score < 60) responses
- Shows score feedback to user with pass/fail status
- Auto-refreshes lesson list on successful submission
- Returns to selector view after 2 seconds on success

**Updated UI Elements:**

1. **Recording Requirement Indicator:**

   ```
   ⚠️ Minimum Score Required: 60+ to unlock the next lesson
   ```

2. **Score Feedback Display:**
   - Shows score (e.g., "Score: 75/100")
   - Pass/Fail status with visual indicators
   - AI-generated feedback comments
   - Color-coded: Green for pass, Red for fail

3. **Button Logic:**
   - **Normal State:** "Complete Lesson & Continue" (enabled when audio recorded)
   - **Submitting State:** "Evaluating..." (disabled while processing)
   - **Failed State:** "Record Again" (allows retry)
   - **Passed State:** Auto-advances after 2 seconds

4. **Retry Mechanism:**
   - Users who score < 60 can click "Record Again"
   - Clears previous recording and feedback
   - Allows unlimited retry attempts

## Scoring System

### AI Evaluation Process:

1. **Transcription:** Audio is transcribed using OpenAI Whisper API (French language)
2. **Comparison:** User's transcript compared against lesson content (explanation + example sentences)
3. **Metrics Calculated:**
   - **Accuracy:** Word match percentage (0-100)
   - **Fluency:** Based on speaking pace and accuracy (0-100)
   - **Overall Score:** `(Accuracy × 0.6) + (Fluency × 0.4)`

### Minimum Score Requirement:

- **Minimum:** 60/100 required to unlock next lesson
- **Feedback:** AI generates up to 3 comment strings for user improvement
- **Progression:** Only saves progress and advances if score >= 60

## Technical Stack

### Dependencies Used:

- **multer:** Audio file upload handling
- **AIService:** OpenAI Whisper API for transcription and feedback generation
- **FormData:** Frontend audio transmission

### API Flow:

```
User Records → FormData Created → POST to /grammar/progress/save-reading
       ↓
   multer Processes Audio → AIService.transcribeAudio()
       ↓
   AIService.generateFeedback() → Score Calculated
       ↓
   If Score >= 60 → Save Progress, Advance to Next Day
   If Score < 60 → Return Error, Allow Retry
       ↓
   Frontend Shows Score + Feedback
```

## User Experience Flow

### Successful Path (Score 60+):

1. User selects lesson and views content
2. User starts recording and reads the lesson aloud
3. User clicks "Complete Lesson & Continue"
4. System evaluates recording:
   - Transcribes audio
   - Compares against lesson content
   - Calculates accuracy and fluency
5. Score displayed: "75/100 - PASSED"
6. Auto-advances to next lesson after 2 seconds
7. Progress saved in database

### Unsuccessful Path (Score < 60):

1. User goes through steps 1-4 above
2. Score displayed: "45/100 - FAILED"
3. Message: "You need 60+ to proceed. Try again!"
4. User clicks "Record Again" to retry
5. Previous recording cleared
6. User can re-record and resubmit
7. Retry cycle continues until score >= 60

## Database Impact

### GrammarProgress Model Updates:

- `scores.dayX` field stores the AI-evaluated score (not random)
- `completed` flag set to `true` only when last day's score >= 60
- `currentDay` advances only on successful score >= 60
- `completedAt` timestamp set when topic fully completed

### ActivityLog Updates:

- Entries created only on topic completion (all days scored >= 60)
- Score in log is average of all day scores
- Activity type: 'grammar'

## Testing Checklist

- [ ] User successfully records audio
- [ ] Recording evaluates correctly with AI Whisper transcription
- [ ] Score calculated as (accuracy × 0.6) + (fluency × 0.4)
- [ ] Score < 60 prevents progression and shows error message
- [ ] Score >= 60 allows progression and shows success message
- [ ] Feedback comments display correctly
- [ ] "Record Again" button clears state and allows retry
- [ ] Progress saved correctly for score >= 60
- [ ] ActivityLog entry created only on topic completion
- [ ] Next lesson automatically displayed after pass
- [ ] Minimum score requirement text visible to user

## Error Handling

### Specific Error Cases:

1. **No Audio File:**

   ```
   Status 400: "Audio file is required"
   ```

2. **Lesson Not Found:**

   ```
   Status 404: "Lesson not found"
   ```

3. **Low Score:**

   ```
   Status 400: "Score too low (XX/100). You need 60+ to proceed. Please try again."
   ```

4. **AI Service Error:**
   ```
   Status 500: "Failed to evaluate recording"
   ```

## Performance Considerations

- **Memory Storage:** Audio files stored in memory, not on disk (more efficient)
- **File Size:** Limited to 25MB to prevent memory issues
- **API Timeout:** Whisper API has 30-second timeout to prevent hanging
- **Auto-Advance:** 2-second delay allows users to see success message

## Future Enhancements

- [ ] Store audio recordings for later review
- [ ] Display detailed accuracy/fluency breakdown
- [ ] Implement pronunciation difficulty levels
- [ ] Add comparison between user's and native speaker's recording
- [ ] Create detailed progress analytics
- [ ] Allow admin to adjust minimum score threshold
