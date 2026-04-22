# Admin-Managed Background Media System

## Overview
Implemented a complete admin-managed background media system that allows administrators to upload, manage, and control animated backgrounds (videos, GIFs, images) that display on the home page.

## Features Implemented

### Backend (Node.js/Express)

#### 1. **BackgroundMedia Model** (`backend/models/BackgroundMedia.js`)
- Schema fields:
  - `url`: Filename of the uploaded media
  - `type`: Media type (video, gif, image)
  - `filename`: Original filename
  - `active`: Boolean to show/hide media
  - `order`: Display order
  - `createdAt`: Timestamp

#### 2. **Admin API Routes** (added to `backend/server.js`)
- `POST /admin/background-media` - Upload new background media (video/gif/image)
- `GET /admin/background-media` - Get all background media (admin only)
- `PUT /admin/background-media/:id` - Update media (toggle active, change order)
- `DELETE /admin/background-media/:id` - Delete media and file from uploads folder

#### 3. **Public API Route**
- `GET /background-media` - Fetch active backgrounds for public display

### Frontend (React)

#### 1. **Home Component Updates** (`frontend/src/components/Home.js`)
- Added state for background media and current background index
- `fetchBackgroundMedia()` - Fetches active backgrounds from API
- Auto-rotation every 10 seconds using `useEffect` interval
- Dynamic rendering of video/gif/image backgrounds
- Smooth fade transitions between backgrounds
- Fallback to default video if no backgrounds uploaded

#### 2. **Admin Dashboard** (`frontend/src/App.js`)
- New "🎬 Backgrounds" section in admin sidebar
- Upload interface for videos, GIFs, and images
- Grid display of all uploaded backgrounds with previews
- Controls for each media:
  - **Activate/Deactivate** - Toggle visibility on home page
  - **Delete** - Remove media and file
- Visual indicators:
  - Active/Inactive badges
  - Media type labels
  - Preview thumbnails/videos
  - Upload progress indicator

#### 3. **CSS Updates** (`frontend/src/App.css`)
- Added smooth 2-second fade transitions between backgrounds
- `.hero-video-bg.active` class for visible background
- Opacity transitions for seamless rotation

## How It Works

### For Admins:
1. Login as admin (admin@properestate.com)
2. Navigate to Admin Panel → 🎬 Backgrounds
3. Upload videos (MP4, WebM), GIFs, or images
4. Toggle active/inactive status for each media
5. Delete unwanted backgrounds
6. Active backgrounds automatically rotate on home page

### For Users:
1. Visit home page
2. See animated backgrounds rotating every 10 seconds
3. Smooth fade transitions between backgrounds
4. Backgrounds enhance the cinematic aesthetic

## Technical Details

### File Upload
- Uses Multer middleware for file handling
- Files stored in `backend/uploads/` directory
- Automatic type detection from file extension
- Sequential ordering for new uploads

### Background Rotation
- React state manages current background index
- `setInterval` rotates every 10 seconds
- CSS transitions provide smooth fading
- Multiple backgrounds can be active simultaneously

### Media Types Supported
- **Videos**: MP4, WebM, MOV
- **GIFs**: Animated GIFs
- **Images**: PNG, JPEG

### Security
- Admin-only upload and management routes
- File validation on upload
- Proper file cleanup on deletion

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/admin/background-media` | Admin | Upload new background |
| GET | `/admin/background-media` | Admin | Get all backgrounds |
| PUT | `/admin/background-media/:id` | Admin | Update background |
| DELETE | `/admin/background-media/:id` | Admin | Delete background |
| GET | `/background-media` | Public | Get active backgrounds |

## Files Modified/Created

### Created:
- `backend/models/BackgroundMedia.js` - Database model

### Modified:
- `backend/server.js` - Added routes and model import
- `frontend/src/components/Home.js` - Background fetching and rotation
- `frontend/src/App.js` - Admin dashboard section
- `frontend/src/App.css` - Transition styles

## Next Steps (Optional Enhancements)

1. **Drag-and-drop reordering** - Allow admins to change display order
2. **Duration control** - Let admins set rotation interval per background
3. **Preview mode** - Test backgrounds before activating
4. **Bulk upload** - Upload multiple files at once
5. **Analytics** - Track which backgrounds users see most
6. **Compression** - Auto-compress large video files
7. **CDN integration** - Store media on cloud storage

## Testing

To test the system:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Login as admin
4. Navigate to Admin Panel → Backgrounds
5. Upload a video or GIF
6. Activate it
7. Visit home page to see it rotating

## Status: ✅ COMPLETE

The admin-managed background media system is fully functional and ready for use!
