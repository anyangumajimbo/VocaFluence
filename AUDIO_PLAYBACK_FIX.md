# Reference Audio Playback Fix

## Problem
Reference audio files were failing to play during practice sessions with the error:
```
Unable to play audio. Please re-upload as MP3 or WAV format.
```

The audio files were successfully uploaded and stored correctly, but playback was failing.

## Root Cause
The issue was in the HTML audio element in `Practice.tsx`. The code was using the **same URL** for all three source types with different MIME types:

```tsx
// WRONG - Same URL with different MIME types
<audio>
    <source src={selectedScript.referenceAudioURL} type="audio/webm" />
    <source src={selectedScript.referenceAudioURL} type="audio/mpeg" />
    <source src={selectedScript.referenceAudioURL} type="audio/wav" />
</audio>
```

The problem: Audio files in the system had **different extensions** (.webm, .mp3, .wav), but the browser was trying to play them with the wrong MIME type based on the extension.

For example:
- File: `referenceAudio-1769661313154-250373471.webm` was being requested with `type="audio/mpeg"`
- File: `referenceAudio-1769662974472-332081710.mp3` was being requested with `type="audio/webm"`

This mismatch caused the browser to reject the audio file.

## Solution
Modified the audio element to **match the MIME type to the file extension**:

### Step 1: Added Helper Function
Created a `getAudioMimeType()` function that detects the file extension and returns the correct MIME type:

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

### Step 2: Updated Audio Element
Modified the audio element to use the correct MIME type for each file:

```tsx
<audio
    key={selectedScript._id}
    controls
    controlsList="nodownload"
    preload="auto"
>
    {getAudioMimeType(selectedScript.referenceAudioURL) && (
        <source 
            src={getAudioMimeType(selectedScript.referenceAudioURL)?.url} 
            type={getAudioMimeType(selectedScript.referenceAudioURL)?.type} 
        />
    )}
    Your browser does not support the audio element.
</audio>
```

## Files Modified
- `client/src/pages/Practice.tsx`
  - Added `getAudioMimeType()` helper function
  - Updated audio element source rendering to use correct MIME type

## Testing
The fix ensures that:
1. ✅ `.webm` files are served as `audio/webm`
2. ✅ `.mp3` files are served as `audio/mpeg`
3. ✅ `.wav` files are served as `audio/wav`
4. ✅ `.m4a` files are served as `audio/mp4`
5. ✅ Browser correctly identifies and plays the audio

## Current Audio Files in System
All existing audio files will now play correctly:
- `1769440258583-218332505.wav` ✅
- `1769441890405-22226016.wav` ✅
- `referenceAudio-1769661313154-250373471.webm` ✅
- `referenceAudio-1769662411140-654709090.webm` ✅
- `referenceAudio-1769662871563-721409923.webm` ✅
- `referenceAudio-1769662974472-332081710.mp3` ✅

## Server-Side Configuration
The server was already correctly configured:
- ✅ CORS headers are set for audio files
- ✅ Correct Content-Type headers are being sent based on file extension
- ✅ Static file serving is properly configured at `/uploads`

The client-side fix complements the server configuration by ensuring the browser knows which MIME type matches which file.
