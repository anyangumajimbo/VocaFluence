# Audio Playback Fix - Complete Solution

## Problem Analysis

Users were getting "Unable to play audio" errors when trying to listen to reference audio during practice sessions.

### Root Causes Identified:

1. **MIME Type Mismatch** (Client-side)
   - Audio files had different extensions (.webm, .mp3, .wav)
   - HTML audio element was using the same URL with different MIME type attributes
   - Browser couldn't match the MIME type to the file extension

2. **Invalid Database References** (Server-side)
   - Some scripts had `referenceAudioURL` pointing to files that didn't exist
   - Example: `/uploads/reference-audio/referenceAudio-1769792844171-22136941.mp3` didn't exist
   - This caused MEDIA_ERR_SRC_NOT_SUPPORTED or MEDIA_ERR_NETWORK errors

## Solutions Implemented

### 1. Client-Side Fix: Correct MIME Type Detection

**File:** `client/src/pages/Practice.tsx`

**Changes:**
- Added `getAudioMimeType()` helper function that detects file extension and returns correct MIME type
- Modified audio element to render only ONE source tag with matching MIME type
- Added comprehensive debug logging for audio loading/playback events

```typescript
const getAudioMimeType = (url: string | undefined): { url: string; type: string } | null => {
    if (!url) return null;
    
    if (url.endsWith('.webm')) {
        return { url, type: 'audio/webm' };
    } else if (url.endsWith('.mp3')) {
        return { url, type: 'audio/mpeg' };
    } else if (url.endsWith('.wav')) {
        return { url, type: 'audio/wav' };
    } else if (url.endsWith('.m4a')) {
        return { url, type: 'audio/mp4' };
    }
    return { url, type: 'audio/*' };
};
```

### 2. Server-Side Fix: Improved MIME Type Headers

**File:** `server/src/index.ts`

**Changes:**
- Added `setHeaders` callback in express.static to ensure MIME types are correctly set
- Added comprehensive logging for audio file requests
- Ensured CORS headers are always present for audio files
- Added double-checking of MIME types at the static file serving level

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, filePath) => {
        // Set correct MIME type for audio files
        if (filePath.includes('reference-audio')) {
            if (filePath.endsWith('.webm')) {
                res.setHeader('Content-Type', 'audio/webm');
            } else if (filePath.endsWith('.mp3')) {
                res.setHeader('Content-Type', 'audio/mpeg');
            }
            // ... etc
        }
        // Always set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));
```

### 3. Database Fix: Remove Invalid References

**File:** `server/fix-audio-references.js`

**What it does:**
- Connects to MongoDB
- Finds all scripts with `referenceAudioURL`
- Checks if referenced files actually exist in `server/uploads/reference-audio/`
- Removes invalid references
- Optionally updates references to similar files if found

**Results:**
```
✅ Total scripts checked: 2
✅ Valid references: 1
❌ Invalid references removed: 1
```

**To run the fix:**
```bash
cd server
node fix-audio-references.js
```

## Current State

### Valid Audio Files:
✅ `1769440258583-218332505.wav` - Being used
✅ `1769441890405-22226016.wav` - Available
✅ `referenceAudio-1769661313154-250373471.webm` - Available
✅ `referenceAudio-1769662411140-654709090.webm` - Available
✅ `referenceAudio-1769662871563-721409923.webm` - Available
✅ `referenceAudio-1769662974472-332081710.mp3` - Being used by "Alignerr Exam"

### Fixed Issues:
- ✅ "Alignerr Exam" - Audio playback working
- ✅ "France: les nouveautés de la rentrée scolaire" - Invalid reference removed

## Testing Instructions

1. **Client-side:**
   - Navigate to Practice page
   - Select a script with reference audio
   - Check browser console for log messages starting with `[AUDIO]`
   - Should see: "Can play: /uploads/reference-audio/..."

2. **Server-side:**
   - Check server logs for `[AUDIO]` messages
   - Should see MIME type being set correctly for each file

3. **Audio Playback:**
   - Click on the audio player controls
   - Audio should play without errors
   - No "Unable to play audio" toast notifications

## Debugging Commands

```bash
# Fix database references
cd server && node fix-audio-references.js

# List existing audio files
ls -la server/uploads/reference-audio/

# Start server with detailed logging
pnpm --prefix server dev
```

## Browser Console Expected Output

```
[AUDIO] Rendering source for: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
{url: "/uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3", type: "audio/mpeg"}
[AUDIO] Loading: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
{mimeType: "audio/mpeg", canPlayType: "probably"}
[AUDIO] Metadata loaded for: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
[AUDIO] Can play: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
```

## Files Modified

1. `client/src/pages/Practice.tsx` - Client-side MIME type handling
2. `server/src/index.ts` - Server-side MIME type and CORS headers
3. `server/fix-audio-references.js` - NEW - Database fix utility

## Future Improvements

1. Add validation when uploading audio files to ensure they're valid
2. Convert all audio to a single format (e.g., MP3) on upload
3. Add audio transcoding service to standardize formats
4. Implement audio validation middleware
5. Add monitoring/alerting for broken audio references
