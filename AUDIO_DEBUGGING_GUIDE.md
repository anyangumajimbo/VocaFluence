# Reference Audio Playback - Troubleshooting & Debugging Guide

## 🔍 Issues Found & Fixes Applied

### Issue 1: Missing Audio Element Attributes
**Problem**: Audio element was missing CORS headers and proper browser attributes
**Solution**: Added the following attributes to all audio elements:
- `crossOrigin="anonymous"` - Allows CORS requests
- `preload="metadata"` - Pre-loads audio metadata
- `controlsList="nodownload"` - Removes download button
- `onError` handler - Logs playback errors
- Proper styling with `width: 100%` and `outline: none`

### Issue 2: CORS Headers Missing on Static Files
**Problem**: Server wasn't explicitly setting CORS headers for uploaded files
**Solution**: Added explicit CORS middleware:
```typescript
app.use((req, res, next) => {
    if (req.path.startsWith('/uploads')) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
});
```

### Issue 3: Missing Debug Information
**Problem**: No way to see if audio URLs were being fetched correctly
**Solution**: Added console logging in fetchScripts() to show:
- Which scripts have reference audio
- What the audio URL path is
- Any errors during audio operations

---

## 🧪 Step-by-Step Testing Guide

### Step 1: Verify Backend Setup

**Check 1.1: File Directory Exists**
```bash
# SSH into server or open file manager
ls -la server/uploads/reference-audio/

# Should show files like:
# referenceAudio-1234567890-123456789.webm
# referenceAudio-1234567890-987654321.mp3
```

**Check 1.2: Server Logs**
```bash
# In terminal running server, watch for:
# - File upload confirmations
# - No errors in multer middleware
# - CORS headers being set

# Expected when uploading: 
# Incoming POST /api/scripts 201
# File saved: referenceAudio-XXXX-XXXX.webm
```

**Check 1.3: Verify Static File Serving**
```bash
# Test URL directly in browser:
http://localhost:5000/uploads/reference-audio/referenceAudio-1234567890-123456789.webm

# Should return: 
# HTTP 200 OK with audio file
# Content-Type: audio/webm (or appropriate type)
# Access-Control-Allow-Origin: *
```

---

### Step 2: Verify Admin Upload

**Check 2.1: Create Script with Audio Upload**
1. Login as admin
2. Go to "Manage Scripts"
3. Click "Add Script"
4. Fill all required fields:
   - Title: "Test Script"
   - Language: English
   - Difficulty: Beginner
   - Content: "This is a test"
5. Scroll to "Reference Audio"
6. Click "Upload Audio File"
7. Select an audio file (MP3, WAV, or WebM)
8. See the preview player appear
9. Test the preview:
   - Click play button
   - Adjust volume
   - Seek through timeline
10. Click "Create Script"
11. See success message

**Check 2.2: Verify Database**
```bash
# Use MongoDB Compass or Atlas UI
# Check Script collection
# Look for the new script
# Verify referenceAudioURL field contains: /uploads/reference-audio/referenceAudio-XXXX-XXXX.webm

# Should look like:
{
  "_id": ObjectId(...),
  "title": "Test Script",
  "referenceAudioURL": "/uploads/reference-audio/referenceAudio-1234567890-123456789.webm",
  ...
}
```

**Check 2.3: Check Browser Network Tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Create script with audio file
4. Look for:
   - POST /api/scripts - Status 201
   - Response should include referenceAudioURL
5. Response example:
```json
{
  "message": "Script created successfully.",
  "script": {
    "_id": "...",
    "referenceAudioURL": "/uploads/reference-audio/referenceAudio-1234567890-123456789.webm"
  }
}
```

---

### Step 3: Verify Student View

**Check 3.1: Student Can See Reference Audio**
1. Logout from admin
2. Login as student
3. Go to "Practice"
4. Filter by the language of your test script
5. Click on your test script
6. **Should see**:
   ```
   📢 Listen to Reference Audio First
   [Play button] [Seek bar] [Volume control] [Time display]
   "Listen to how the script should be pronounced..."
   ```

**Check 3.2: Check Browser Console**
1. Open DevTools Console
2. Should see log message:
   ```
   Script "Test Script" has reference audio: /uploads/reference-audio/referenceAudio-XXXX-XXXX.webm
   ```
3. If not logged, the script doesn't have referenceAudioURL

**Check 3.3: Test Audio Playback**
1. Click **Play** button
2. Should start playing
3. **Try these controls**:
   - Pause button - should pause audio
   - Seek bar - should jump to new position
   - Volume slider - should adjust volume
   - Time display - should update current time
4. If any control doesn't work:
   - Check browser console for errors
   - Note which browser you're using
   - Report specific control that fails

---

## 🐛 Debugging Checklist

### If Audio Won't Play

**Debug 1: Check URL Format**
```javascript
// Open browser console (F12 > Console)
// Find the script element and check the src:
document.querySelector('audio')?.src
// Should output: /uploads/reference-audio/referenceAudio-XXXX-XXXX.webm
```

**Debug 2: Check File Exists**
```bash
# SSH to server
# Check if file exists at the path
ls -la server/uploads/reference-audio/ | grep "referenceAudio"
# Should show the file
```

**Debug 3: Check CORS Headers**
```javascript
// In browser DevTools > Network tab
// Click on the audio request (GET /uploads/reference-audio/...)
// Check Response Headers section
// Should include:
// Access-Control-Allow-Origin: *
```

**Debug 4: Check Network Request**
```javascript
// In DevTools > Network tab
// Play audio
// Look for GET request to /uploads/reference-audio/...
// Status should be 200
// If 404: file doesn't exist
// If 403: permission denied
// If CORS error: headers not set
```

**Debug 5: Browser Console Errors**
```javascript
// Open DevTools > Console
// Look for red errors
// Audio.onerror event should trigger if there's an issue
// Check for messages like: "Unable to play reference audio"
```

### If Volume Control Doesn't Work

**Debug 6: Browser Compatibility**
- Chrome/Chromium: ✅ Should work
- Firefox: ✅ Should work
- Safari: ⚠️ May need Full Screen permission
- Edge: ✅ Should work
- IE11: ❌ Not supported

**Debug 7: Audio Element Attributes**
```javascript
// Check if audio element has proper attributes
const audio = document.querySelector('audio');
console.log('crossOrigin:', audio.crossOrigin);  // should be 'anonymous'
console.log('volume:', audio.volume);            // should be between 0-1
console.log('muted:', audio.muted);              // should be false
```

### If Seek Bar Doesn't Work

**Debug 8: Metadata Loaded**
```javascript
// Check if audio metadata is loaded
const audio = document.querySelector('audio');
console.log('duration:', audio.duration);        // should be > 0
console.log('readyState:', audio.readyState);    // should be 4 (HAVE_ENOUGH_DATA)
```

---

## 📋 Complete Testing Checklist

### Admin Tests
```
[ ] Can upload MP3 file
    - Check file appears in preview
    - Check preview player works
    - Check volume adjustable in preview

[ ] Can upload WAV file
    - Same as above

[ ] Can upload WebM file
    - Same as above

[ ] Can record audio
    - Microphone permission granted
    - Recording indicator appears
    - Stop button works
    - Recorded audio plays in preview
    - Preview volume control works

[ ] Script saves successfully
    - No errors in browser
    - No errors in server logs
    - Script appears in list with audio icon (if added)

[ ] Database saved correctly
    - Check MongoDB Atlas
    - referenceAudioURL field populated
    - URL format correct: /uploads/reference-audio/...

[ ] File stored correctly
    - SSH to server
    - File exists in uploads/reference-audio/
    - File has correct permissions (644)
    - File size reasonable (not 0 bytes)
```

### Student Tests
```
[ ] Can see reference audio in practice page
    - Logged in as student
    - Selected script with reference audio
    - Audio player visible
    - "Listen to Reference Audio First" text visible
    - Audio element has controls

[ ] Play button works
    - Click play
    - Audio starts playing
    - Play button changes to pause icon

[ ] Pause button works
    - Click pause during playback
    - Audio stops
    - Pause icon changes to play

[ ] Volume control works
    - Move volume slider
    - Audio volume changes
    - Mute button (if present) works

[ ] Seek bar works
    - Click on seek bar at different positions
    - Audio jumps to that position
    - Time display updates

[ ] Timer displays correctly
    - Current time updates as audio plays
    - Total duration shown
    - Format: MM:SS (e.g., 1:23 / 3:45)

[ ] Audio plays on different browsers
    - Chrome: ✓
    - Firefox: ✓
    - Safari: ✓
    - Edge: ✓

[ ] Audio plays on mobile
    - iOS: ✓
    - Android: ✓
    - Different browsers on mobile: ✓

[ ] No audio = no player shown
    - Scripts without reference audio
    - No player visible
    - No errors in console
```

### Error Handling Tests
```
[ ] Corrupted audio file uploaded
    - Browser accepts file
    - Server accepts file
    - Student tries to play
    - Error message appears (don't crash)

[ ] Very large audio file (>10MB)
    - Upload rejected with error message
    - Error says "File size must be less than 10MB"

[ ] Non-audio file uploaded
    - Upload rejected with error message
    - Error says "Please select an audio file"

[ ] Missing audio file on server
    - Script has referenceAudioURL
    - File doesn't exist on disk
    - Student tries to play
    - 404 error, helpful message shown
```

---

## 🔧 Common Fixes

### If Audio Still Won't Play After Changes

**Fix 1: Clear Browser Cache**
```
- Chrome: Ctrl+Shift+Del (Windows) or Cmd+Shift+Del (Mac)
- Firefox: Ctrl+Shift+Del
- Safari: Cmd+Shift+Del
- Select "All time" and delete
- Reload page
```

**Fix 2: Restart Server**
```bash
# Stop server (Ctrl+C in terminal)
# Delete node_modules and reinstall
rm -rf node_modules
npm install
# Rebuild TypeScript
npm run build
# Start server
npm start
```

**Fix 3: Check File Permissions**
```bash
# SSH to server
# Verify file permissions
ls -la server/uploads/reference-audio/referenceAudio-*.webm
# Should show: -rw-r--r-- (644)

# If not, fix permissions
chmod 644 server/uploads/reference-audio/*
```

**Fix 4: Check Disk Space**
```bash
# If server is out of disk space
df -h
# Look for 100% usage
# Clean up old uploads if needed
```

**Fix 5: CORS Headers Not Applied**
```bash
# Restart server
# Verify middleware order in index.ts
# CORS middleware must come before static file serving
# Order should be:
# 1. helmet()
# 2. cors()
# 3. body parsing
# 4. CORS headers for uploads
# 5. static file serving
```

---

## 📞 Getting Help

### Provide This Information When Reporting Issues

1. **Browser & OS**
   - Browser name and version
   - Operating system
   - Mobile or desktop

2. **Steps to Reproduce**
   - Exactly what you did
   - What you expected
   - What actually happened

3. **Screenshots/Videos**
   - Screenshot of audio player
   - Video of trying to play (if possible)

4. **Console Errors**
   - Open DevTools (F12)
   - Go to Console
   - Reproduce error
   - Copy any red error messages
   - Share exact error text

5. **Network Errors**
   - DevTools > Network tab
   - Look for failed requests
   - Share status codes and errors

6. **Server Logs**
   - Share relevant server console output
   - Timestamp of when error occurred

---

## ✅ Success Indicators

Reference audio is working correctly when:
1. ✅ Admin can upload/record audio for scripts
2. ✅ Audio file stored in `/uploads/reference-audio/`
3. ✅ Database shows referenceAudioURL for scripts
4. ✅ Student sees audio player in practice page
5. ✅ Play button works (audio audible)
6. ✅ Pause button works
7. ✅ Volume slider adjusts sound
8. ✅ Seek bar jumps to new position
9. ✅ No errors in browser console
10. ✅ No errors in server logs
11. ✅ Works on multiple browsers
12. ✅ Works on mobile devices

---

## 🚀 Next Steps

After completing all tests:
1. [ ] Note any remaining issues
2. [ ] Gather error messages and screenshots
3. [ ] Test on production server (if available)
4. [ ] Document any browser-specific issues
5. [ ] Create user guide for admins
6. [ ] Train admins on feature
7. [ ] Monitor for user issues
8. [ ] Gather feedback for improvements

