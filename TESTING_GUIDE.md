# Testing Guide - Background Media System

## Prerequisites
- ✅ Backend server running on http://localhost:5000
- ✅ Frontend server running on http://localhost:3000
- ✅ MongoDB connected
- ✅ Admin account: admin@properestate.com

---

## Test 1: Upload Background Media

### Steps:
1. Open browser: http://localhost:3000
2. Login as admin (admin@properestate.com)
3. Navigate to Admin Panel (you should be redirected automatically)
4. Click **🎬 Backgrounds** in the sidebar
5. Click the file input under "Upload New Background"
6. Select a video file (MP4) or GIF
7. Wait for upload to complete

### Expected Results:
- ✅ "Uploading..." message appears
- ✅ Upload completes successfully
- ✅ New media appears in the grid below
- ✅ Media shows preview (video plays or image displays)
- ✅ Badge shows "ACTIVE" (green)
- ✅ Type label shows "VIDEO" or "GIF"

### Test Files:
You can use these free sources:
- https://cdn.coverr.co/videos/coverr-aerial-view-of-beautiful-resort-2732/1080p.mp4
- https://cdn.coverr.co/videos/coverr-night-city-lights-4321/1080p.mp4
- Any GIF from Giphy or Tenor

---

## Test 2: View Background on Home Page

### Steps:
1. After uploading, open a new tab
2. Navigate to http://localhost:3000
3. Observe the hero section background

### Expected Results:
- ✅ Uploaded background is visible
- ✅ Background has subtle opacity (not too bright)
- ✅ Text is readable over background
- ✅ Background loops smoothly (for videos)

---

## Test 3: Upload Multiple Backgrounds

### Steps:
1. Return to Admin Panel → Backgrounds
2. Upload 2-3 more videos or GIFs
3. Ensure all are marked as ACTIVE

### Expected Results:
- ✅ All uploads succeed
- ✅ All media appear in grid
- ✅ Each has unique preview
- ✅ All show "ACTIVE" badge

---

## Test 4: Background Rotation

### Steps:
1. With multiple active backgrounds, visit home page
2. Wait and observe for 10 seconds
3. Watch the background change

### Expected Results:
- ✅ Background fades out smoothly (2 seconds)
- ✅ Next background fades in smoothly (2 seconds)
- ✅ Rotation continues every 10 seconds
- ✅ Cycles through all active backgrounds
- ✅ Returns to first background after last one

---

## Test 5: Deactivate Background

### Steps:
1. Return to Admin Panel → Backgrounds
2. Click **Deactivate** on one of the backgrounds
3. Observe badge change to "INACTIVE" (red)
4. Visit home page

### Expected Results:
- ✅ Badge changes to red "INACTIVE"
- ✅ Deactivated background no longer appears in rotation
- ✅ Only active backgrounds show on home page
- ✅ Rotation continues with remaining active backgrounds

---

## Test 6: Reactivate Background

### Steps:
1. Return to Admin Panel → Backgrounds
2. Click **Activate** on the deactivated background
3. Visit home page

### Expected Results:
- ✅ Badge changes to green "ACTIVE"
- ✅ Background reappears in rotation
- ✅ Rotation includes the reactivated background

---

## Test 7: Delete Background

### Steps:
1. Return to Admin Panel → Backgrounds
2. Click **Delete** on one background
3. Confirm deletion in popup
4. Check the grid

### Expected Results:
- ✅ Confirmation popup appears
- ✅ Background is removed from grid
- ✅ File is deleted from server
- ✅ Remaining backgrounds still work
- ✅ Home page rotation continues with remaining backgrounds

---

## Test 8: Upload Different Media Types

### Steps:
1. Upload a video (MP4)
2. Upload a GIF
3. Upload an image (PNG or JPEG)
4. Activate all three

### Expected Results:
- ✅ All three upload successfully
- ✅ Video shows "VIDEO" label and plays
- ✅ GIF shows "GIF" label and animates
- ✅ Image shows "IMAGE" label and displays
- ✅ All three rotate on home page

---

## Test 9: No Backgrounds (Fallback)

### Steps:
1. Delete all backgrounds OR deactivate all
2. Visit home page

### Expected Results:
- ✅ Default video background appears
- ✅ No errors in console
- ✅ Page loads normally
- ✅ Fallback video: https://cdn.coverr.co/videos/coverr-aerial-view-of-beautiful-resort-2732/1080p.mp4

---

## Test 10: Performance Test

### Steps:
1. Upload 5-6 backgrounds
2. Activate all of them
3. Visit home page
4. Open browser DevTools (F12)
5. Check Performance tab

### Expected Results:
- ✅ Page loads in under 3 seconds
- ✅ Smooth 60fps animations
- ✅ No lag during transitions
- ✅ Memory usage stable
- ✅ No console errors

---

## Test 11: Mobile Responsiveness

### Steps:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone, Android)
4. Visit home page

### Expected Results:
- ✅ Background scales properly
- ✅ Text remains readable
- ✅ Rotation works on mobile
- ✅ No horizontal scroll
- ✅ Touch interactions work

---

## Test 12: Browser Compatibility

### Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

### Expected Results:
- ✅ All features work in all browsers
- ✅ Transitions smooth in all browsers
- ✅ No console errors
- ✅ Consistent appearance

---

## Common Issues & Solutions

### Issue: Upload fails
**Solution**: 
- Check file size (must be under 100MB)
- Verify file format (MP4, WebM, GIF, PNG, JPEG)
- Check backend server is running
- Check MongoDB connection

### Issue: Background not showing
**Solution**:
- Ensure background is marked ACTIVE
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors
- Verify file uploaded successfully

### Issue: Slow transitions
**Solution**:
- Compress video files before uploading
- Reduce video resolution to 1080p
- Limit active backgrounds to 3-4
- Use WebM format instead of MP4

### Issue: Background too bright
**Solution**:
- Adjust opacity in CSS (.hero-video-bg.active)
- Choose darker source videos
- Increase overlay darkness

---

## API Testing (Optional)

### Test with Postman or curl:

#### 1. Get Active Backgrounds (Public)
```bash
GET http://localhost:5000/background-media
```

#### 2. Get All Backgrounds (Admin)
```bash
GET http://localhost:5000/admin/background-media
```

#### 3. Upload Background (Admin)
```bash
POST http://localhost:5000/admin/background-media
Content-Type: multipart/form-data
Body: 
  - media: [file]
  - type: "video" | "gif" | "image"
```

#### 4. Update Background (Admin)
```bash
PUT http://localhost:5000/admin/background-media/:id
Content-Type: application/json
Body: { "active": true/false }
```

#### 5. Delete Background (Admin)
```bash
DELETE http://localhost:5000/admin/background-media/:id
```

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Smooth animations
- ✅ Fast loading times
- ✅ Proper file management
- ✅ Correct rotation behavior
- ✅ Responsive design
- ✅ Cross-browser compatibility

---

## Reporting Issues

If any test fails:
1. Note the test number
2. Describe the expected vs actual behavior
3. Include browser and OS information
4. Check browser console for errors
5. Verify server logs for backend errors

---

## Status: Ready for Testing

All features implemented and ready for comprehensive testing!

**Happy Testing! 🚀**
