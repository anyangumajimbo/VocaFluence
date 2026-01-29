# Quick Start Guide - Reference Audio Feature Testing

## 🚀 Getting Started (5 minutes)

### Prerequisites
- Node.js installed
- MongoDB connection working
- Microphone access allowed in browser

### Step 1: Start the Backend
```bash
cd server
npm install  # if not already done
npm run dev  # or npm start
```
Expected output:
```
✓ Connected to MongoDB
✓ Server running on port 5000
```

### Step 2: Start the Frontend
```bash
cd client
npm install  # if not already done
npm run dev
```
Browser opens to: `http://localhost:5173`

---

## 👨‍💼 Test as Admin

### Login
1. Go to login page
2. Use admin credentials:
   - Email: `admin@example.com`
   - Password: `your-admin-password`
3. Click "Dashboard" → "Manage Scripts"

### Create Script with Audio Upload

1. Click **"Add Script"** button
2. Fill in form:
   ```
   Title: "Hello World"
   Language: English
   Difficulty: Beginner
   Tags: greetings, basic
   Content: "Hello, how are you today?"
   ```
3. Scroll to **"Reference Audio"** section
4. Click **"Upload Audio File"**
   - Select any MP3, WAV, or WebM file from your computer
   - Or record a short audio file first with any app
5. See audio preview with player
6. Click **"Create Script"**
7. ✅ See success message

### Create Script with Microphone Recording

1. Click **"Add Script"** button
2. Fill in form details (same as above)
3. Scroll to **"Reference Audio"** section
4. Click **"Record Audio"**
   - Browser asks for microphone permission
   - Click "Allow"
5. Speak into microphone: "Hello, how are you?"
6. Click **"Stop Recording"**
7. See audio preview with recorded audio
8. Click **"Create Script"**
9. ✅ See success message

### Verify Script Saved
1. Go to "Manage Scripts"
2. Look for your new script in the list
3. Confirm it shows in the scripts table

---

## 👨‍🎓 Test as Student

### Switch to Student Account
1. Logout from admin account
2. Login as student:
   - Email: `student@example.com`
   - Password: `your-student-password`

### Go to Practice Section
1. Click **"Practice"** in navigation
2. See scripts filtered by language/difficulty
3. Look for the script you just created

### Listen to Reference Audio
1. Click on the script you created
2. You should see:
   ```
   📢 Listen to Reference Audio First
   [Play] [Pause] [Volume] [Seek] controls
   "Listen to how the script should be pronounced..."
   ```
3. Click **"Play"** to hear the reference audio
4. Adjust volume, seek through audio
5. Click **"Pause"** to stop

### Record and Practice
1. After listening, click **"🎙 Start Recording"**
2. Speak the script
3. Click **"Stop Recording"** when done
4. See your recording playback
5. Click **"Submit"** to save practice session
6. View your score and feedback

---

## 💬 Test Feedback Audio (Correction)

### As Admin - Leave Correction
1. Go to **"Admin"** → **"Admin Review"**
2. Select a student's practice session
3. Leave feedback comment
4. Under **"Correction Audio"** section:
   - Click **"Record Audio"** or **"Upload Audio File"**
   - Record/select the correct pronunciation
5. Click **"Save Feedback"**

### As Student - View Correction
1. Go to **"Feedback"** page
2. Find the practice session with your correction
3. Look for section:
   ```
   🎵 Pronunciation Correction
   "Listen to how your instructor pronounces..."
   [▶ Play Correction Audio]
   ```
4. Click **"Play Correction Audio"**
5. Listen to instructor's corrected pronunciation

---

## 🧪 Test Cases

### Upload Tests

```
[ ] Test 1: Upload MP3 file
    Expected: Accepts file, shows preview

[ ] Test 2: Upload WAV file
    Expected: Accepts file, shows preview

[ ] Test 3: Upload large file (>10MB)
    Expected: Shows error "File size must be less than 10MB"

[ ] Test 4: Try uploading PDF
    Expected: Shows error "Please select an audio file"

[ ] Test 5: Upload then clear
    Expected: Removes preview, can re-upload
```

### Recording Tests

```
[ ] Test 6: Record audio
    Expected: Browser asks for microphone permission

[ ] Test 7: Record then preview
    Expected: Audio plays in preview

[ ] Test 8: Record then clear
    Expected: Removes preview, can re-record or upload

[ ] Test 9: Record on mobile
    Expected: Microphone works (if permission granted)

[ ] Test 10: Record in Safari
    Expected: Works with iOS 14.5+
```

### Student Practice Tests

```
[ ] Test 11: View reference audio before recording
    Expected: Audio player visible and functional

[ ] Test 12: Play reference audio
    Expected: Audio plays with standard controls

[ ] Test 13: Record after listening to reference
    Expected: Start Recording appears after reference

[ ] Test 14: No reference audio
    Expected: Scripts without audio don't show player

[ ] Test 15: Mobile practice with reference
    Expected: Audio player responsive, recording works
```

### Feedback Tests

```
[ ] Test 16: Admin uploads correction audio
    Expected: Shows success message

[ ] Test 17: Student sees correction audio
    Expected: Shows "Pronunciation Correction" section

[ ] Test 18: Play correction audio
    Expected: Audio plays correctly

[ ] Test 19: Correction labeled clearly
    Expected: Says "instructor pronounces" not "reference"

[ ] Test 20: Multiple corrections
    Expected: Can play each correction
```

---

## 📊 Verification Checklist

After running tests, verify:

### Frontend
- [x] AdminScripts page shows new "Reference Audio" section
- [x] Audio upload button works
- [x] Audio record button works
- [x] Audio preview displays correctly
- [x] Practice page shows reference audio player
- [x] Feedback page shows "Pronunciation Correction"
- [x] Mobile responsive on all screen sizes

### Backend
- [x] Scripts saved with referenceAudioURL
- [x] Audio files stored in `server/uploads/reference-audio/`
- [x] Audio URLs accessible via `/uploads/reference-audio/{filename}`
- [x] No errors in server console

### Database
- [x] Script documents include referenceAudioURL field
- [x] URLs are correct relative paths
- [x] Database shows new scripts

### Network
- [x] Audio files download correctly
- [x] Audio plays in browser
- [x] File upload progress shows
- [x] No CORS errors

---

## 🐛 Debugging

### If Audio Upload Fails

**Check 1**: Browser Console
```javascript
// Open Developer Tools (F12)
// Go to Console tab
// Look for error messages
```

**Check 2**: Network Tab
```
- Look for POST /api/scripts
- Check Status: Should be 201 (Created)
- Check Response: Should have referenceAudioURL
```

**Check 3**: Server Logs
```bash
# Terminal running server should show:
POST /api/scripts 201
# Any errors will show here
```

### If Audio Won't Play

**Check 1**: File Location
```bash
# Verify file exists
ls -la server/uploads/reference-audio/
# Should see referenceAudio-*.webm files
```

**Check 2**: Browser Network
```
- Open DevTools Network tab
- Click play on audio
- Look for request to /uploads/reference-audio/...
- Check Status: Should be 200 (OK)
```

**Check 3**: Audio Format
```
- Try different browsers
- Try different audio formats
- Check file isn't corrupted
```

---

## 📱 Mobile Testing

### iOS
```
1. Install Testflight version
2. Login as student
3. Go to Practice page
4. Click script with reference audio
5. See if audio player shows
6. Try playing audio
7. Try recording with microphone
```

### Android
```
1. Install APK or use development build
2. Grant microphone permission when prompted
3. Repeat iOS steps
4. Test on Chrome and Firefox browsers
```

---

## ⚡ Performance Check

While testing, monitor:

### Page Load Time
- Admin Scripts page: <2 seconds
- Practice page: <2 seconds
- Reference audio appears immediately

### Audio Upload
- Small files (<2MB): <3 seconds
- Medium files (2-5MB): <10 seconds
- Large files (5-10MB): <20 seconds

### Audio Playback
- Starts within 500ms
- No buffering on good connection
- Pause/resume instant

---

## 📝 Test Results Template

Copy this and fill in for each test:

```
TEST: [Test Name]
Date: [Today]
Tester: [Your Name]
Browser: [Chrome/Firefox/Safari/Edge]
Device: [Desktop/Mobile]

Setup:
- [ ] Backend running
- [ ] Frontend running
- [ ] Logged in as admin/student

Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Status: [ ] PASS [ ] FAIL

Issues Found:
[Any problems]

Screenshots:
[Attach if needed]
```

---

## ✅ Done!

If all tests pass, the feature is ready for:
- [ ] Deployment to staging
- [ ] Deployment to production
- [ ] User documentation
- [ ] Admin training

## 🎯 Success Indicators

Feature is working correctly when:
1. ✅ Admins can upload/record reference audio
2. ✅ Students see and can play reference audio
3. ✅ Correction audio displays with clear label
4. ✅ No errors in console or logs
5. ✅ Mobile devices work correctly
6. ✅ Audio files stored and served properly

---

**Happy Testing! 🎉**

Need help? Check:
- REFERENCE_AUDIO_FEATURE.md (detailed documentation)
- REFERENCE_AUDIO_FLOWS.md (visual workflows)
- CODE_CHANGES_REFERENCE.md (code details)
