# Audio Playback Error - Diagnostic Report

## Issue Found
The audio element is throwing an error when trying to play reference audio. The error event is being triggered but the specific error code needs to be identified.

## Recent Changes Made

### 1. Enhanced Error Logging
Added detailed error code reporting to show:
- **MEDIA_ERR_ABORTED (1)**: Loading was aborted
- **MEDIA_ERR_NETWORK (2)**: Network error during load
- **MEDIA_ERR_DECODE (3)**: Audio format not supported or corrupted
- **MEDIA_ERR_SRC_NOT_SUPPORTED (4)**: Source URL not recognized

### 2. Added Audio Type Hints
- Practice.tsx: Added `type="audio/webm"` to audio element
- AdminScripts.tsx: Uses file's MIME type or defaults to webm

### 3. Server-Side MIME Type Configuration
- WebM files: `audio/webm`
- MP3 files: `audio/mpeg`
- WAV files: `audio/wav`
- M4A files: `audio/mp4`

## File Size Issue Identified

The reference audio file is **90MB** (90,313,154 bytes), which is extremely large for audio. This could be:
1. **Corrupted file** - May not be a valid audio file
2. **Video file** - Might be mistakenly uploaded as audio
3. **Uncompressed audio** - Raw PCM data without compression
4. **Encoding issue** - File not properly encoded

## What to Check

### Step 1: Verify File is Valid Audio
```bash
# SSH to server
# Check file type
file server/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm

# Check if it's actually audio
ffprobe server/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm

# Expected output: Audio format like "opus" or "vorbis"
```

### Step 2: Check with These Commands
```bash
# Get file info
ls -lh server/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm

# Try to get duration
ffmpeg -i server/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm 2>&1 | grep Duration
```

### Step 3: After Restart - Open Browser Console
1. Clear cache: Ctrl+Shift+Del, select "All time"
2. Reload page: F5
3. Click reference audio play button
4. Check console for error message
5. **Should now show specific error like:**
   - `Unable to play audio: MEDIA_ERR_DECODE` (file corrupted)
   - `Unable to play audio: MEDIA_ERR_SRC_NOT_SUPPORTED` (format issue)
   - `Unable to play audio: MEDIA_ERR_NETWORK` (CORS/server issue)

## How to Fix

### If Error is MEDIA_ERR_DECODE (Most Likely)
**Solution**: Re-upload a proper audio file
```
1. Logout as student
2. Login as admin
3. Go to Manage Scripts
4. Edit the "Alignerr Exam" script
5. Delete current reference audio
6. Upload a new, small audio file (<5MB)
7. Test the preview player first
8. Save script
```

### If Error is MEDIA_ERR_SRC_NOT_SUPPORTED
**Solution**: Try different audio format
- Use MP3 instead of WebM
- Use WAV format
- Ensure audio codec is standard (AAC, MP3, Opus)

### If Error is MEDIA_ERR_NETWORK
**Solution**: Check CORS headers
```bash
curl -i http://localhost:5000/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm | grep -i "Access-Control"
```

## Quick Action Items

1. **Restart Both Servers** (to get new error logging)
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend (new terminal window)
   npm run dev
   ```

2. **Clear Browser Cache**
   - Ctrl+Shift+Del → All time → Delete

3. **Test Again**
   - Go to Practice page
   - Click script with reference audio
   - Click play button
   - Check console for **specific error code**

4. **Share Error Message**
   - Screenshot the console error
   - Copy the exact error type
   - Note the audio URL

## Expected Console Output After Fix

**If working:**
```
Script "Alignerr Exam" has reference audio: /uploads/reference-audio/referenceAudio-1769661313154-250373471.webm
```
(No error message, audio plays)

**If error (what we'll see now):**
```
Audio Error for "Alignerr Exam": {
  url: "/uploads/reference-audio/referenceAudio-1769661313154-250373471.webm",
  errorCode: 3,  ← This is the key number
  errorType: "MEDIA_ERR_DECODE",  ← Human readable
  message: undefined
}
Toast: "Unable to play audio: MEDIA_ERR_DECODE"
```

## Next Steps

1. **Restart servers** with the updated code
2. **Clear browser cache**
3. **Try to play audio**
4. **Check console for specific error code**
5. **Based on error code**:
   - Code 2-4: Re-upload a valid audio file
   - Code 1: Check network connectivity
   - Code 4: Likely format issue - try MP3 or WAV

## Important Notes

- The **90MB file is likely the problem**
- Audio should be **<5MB** for practice
- Standard formats: MP3, WAV, WebM, M4A
- Check if file is actually audio (not video/corrupted)

**Status**: ✅ Better debugging in place - restart and test to get specific error code
