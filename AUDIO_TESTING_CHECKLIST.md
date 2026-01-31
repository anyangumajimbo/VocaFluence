# Audio Playback Fix - Testing Checklist

## ✅ What Was Fixed

### Database Issues
- [x] Identified invalid audio file references in MongoDB
- [x] Removed reference to non-existent file: `/uploads/reference-audio/referenceAudio-1769792844171-22136941.mp3`
- [x] Verified valid reference exists: `/uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3`

### Client-Side Issues
- [x] Added `getAudioMimeType()` helper function
- [x] Fixed audio element to use correct MIME type for file extension
- [x] Added comprehensive debug logging (onLoadStart, onLoadedMetadata, onCanPlay, onError)
- [x] Simplified source tag rendering to avoid multiple MIME type conflicts

### Server-Side Issues
- [x] Enhanced express.static middleware with setHeaders callback
- [x] Ensured MIME types are correctly set for all audio file formats
- [x] Verified CORS headers are present for audio files
- [x] Added server-side logging for audio requests

## 🧪 Testing Steps

### Step 1: Start the Server
```bash
cd server
pnpm dev
```
Should see server logs with `[AUDIO]` prefix for file requests.

### Step 2: Test in Browser
1. Go to http://localhost:5173/practice
2. Select a script with reference audio
3. Check browser console for:
   - `[AUDIO] Rendering source for: /uploads/reference-audio/...`
   - `[AUDIO] Loading: /uploads/reference-audio/...`
   - `[AUDIO] Can play: /uploads/reference-audio/...`

### Step 3: Test Audio Playback
1. Click the audio player play button
2. Audio should start playing without errors
3. No "Unable to play audio" toast notification should appear
4. Should NOT see `[AUDIO ERROR]` in console

### Step 4: Verify Network Request
1. Open DevTools Network tab
2. Look for request to `/uploads/reference-audio/referenceAudio-*.mp3` (or .webm, .wav)
3. Check Response Headers:
   ```
   Content-Type: audio/mpeg (for .mp3)
   Content-Type: audio/webm (for .webm)
   Content-Type: audio/wav (for .wav)
   Access-Control-Allow-Origin: *
   ```
4. Status should be 200 OK

## 📝 Expected Behavior

### Success Case
```
✅ Script loads with reference audio
✅ Audio file exists on server
✅ Audio element renders with correct MIME type
✅ Browser loads audio successfully
✅ Audio plays without errors
✅ No console errors
```

### Failure Case (if audio is missing)
```
❌ Script has referenceAudioURL
❌ File doesn't exist on server
✅ No error shown to user
✅ Audio section hidden or shows gracefully
```

## 🔧 Troubleshooting

### If Audio Still Doesn't Play

1. **Check browser console for `[AUDIO ERROR]`:**
   ```
   MEDIA_ERR_NETWORK (2) → CORS issue
   MEDIA_ERR_SRC_NOT_SUPPORTED (4) → MIME type mismatch
   MEDIA_ERR_DECODE (3) → File is corrupted
   ```

2. **Verify file exists:**
   ```bash
   ls -la server/uploads/reference-audio/
   ```

3. **Run database fix:**
   ```bash
   cd server
   node fix-audio-references.js
   ```

4. **Check server logs:**
   ```
   [AUDIO] Serving audio file: /uploads/reference-audio/...
   [AUDIO] Set MIME type to audio/mpeg for: /uploads/reference-audio/...
   ```

### If CORS Error Appears

Server middleware should auto-add these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
```

If still failing, check that middleware runs BEFORE express.static().

## 📊 Verification Checklist

- [ ] Browser console shows `[AUDIO] Can play:` messages
- [ ] Network tab shows 200 OK for audio file request
- [ ] Content-Type header matches file extension
- [ ] Audio plays without errors
- [ ] No "Unable to play audio" toast notifications
- [ ] "Alignerr Exam" script plays audio correctly
- [ ] No other scripts show in console with audio errors

## 🚀 Deployment Notes

Before deploying to production:

1. **Run database fix:**
   ```bash
   pnpm --prefix server node fix-audio-references.js
   ```

2. **Verify uploads directory exists:**
   ```bash
   mkdir -p server/uploads/reference-audio
   ```

3. **Set proper permissions:**
   ```bash
   chmod 755 server/uploads server/uploads/reference-audio
   chmod 644 server/uploads/reference-audio/*
   ```

4. **Test on staging:**
   - Upload new audio file
   - Verify it plays immediately
   - Check browser console for debug logs

5. **Monitor in production:**
   - Watch server logs for `[AUDIO ERROR]` messages
   - Track if any new broken references appear
   - Run fix script periodically if needed

## 📱 Expected Log Output

### Browser Console
```
[AUDIO] Rendering source for: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
Object { url: "/uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3", type: "audio/mpeg" }
[AUDIO] Loading: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
Object { mimeType: "audio/mpeg", canPlayType: "probably" }
[AUDIO] Metadata loaded for: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
[AUDIO] Can play: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
```

### Server Logs
```
[AUDIO] Serving audio file: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
[AUDIO] Set MIME type to audio/mpeg for: /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3
GET /uploads/reference-audio/referenceAudio-1769662974472-332081710.mp3 200 OK
```
