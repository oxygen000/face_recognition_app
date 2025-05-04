# Face Recognition Application

This application provides a reliable face recognition system with a frontend UI and backend API.

## Key Features

- **Real Face Recognition**: Uses the `face_recognition` library for accurate face detection and recognition
- **Database Storage**: Stores user data and face encodings in a SQLite database
- **Enhanced Recognition**: Includes image preprocessing and optimized matching algorithms for better accuracy
- **User-Friendly UI**: Easy-to-use frontend for registration and recognition

## Recent Improvements

### Face Recognition Enhancements

1. **Enhanced Image Processing**:

   - Automatic adjustment of brightness and contrast
   - Image sharpening for better feature extraction
   - Robust face detection using multiple methods

2. **Improved Recognition Accuracy**:

   - Better tolerance handling to recognize faces from different angles
   - Support for possible matches with confidence scores
   - Multiple encoding samples for more reliable matching

3. **Better Error Handling**:
   - Detailed error messages with diagnostics
   - Suggestions for improving recognition
   - Near-match detection for ambiguous cases

### Code Refactoring

The codebase has been refactored to improve:

1. **Modularity**:

   - Split monolithic files into smaller, focused modules
   - Separated concerns between routes, services, and middleware
   - Improved code organization and maintainability

2. **Performance**:

   - Added response caching for frequently accessed data
   - Optimized image processing pipeline
   - Improved React component rendering with memoization

3. **User Experience**:

   - Enhanced navigation between pages
   - Better error handling and recovery
   - Improved loading states and feedback

4. **Code Quality**:
   - Removed duplicate code and console logs
   - Added comprehensive documentation
   - Implemented proper TypeScript typing

## Running the Application

### Prerequisites

- Python 3.8+
- Node.js 14+
- Required Python packages (see `backend/requirements.txt`)
- Required NPM packages (see `frontend/package.json`)

### Backend

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install requirements:

   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python server.py
   ```

The server will start on http://localhost:8000

### Client

1. Navigate to the client directory:

   ```
   cd client
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The client will be available at http://localhost:5173

## API Documentation

API documentation is available at http://localhost:8000/docs when the server is running.

The API provides the following main endpoints:

- **User Management**: `/api/users`, `/api/users/{user_id}`, `/api/users/{user_id}/image`
- **Face Recognition**: `/api/recognize`, `/api/register`, `/api/register_with_file`
- **Health and Admin**: `/api/health`, `/api/metrics`, `/api/cache/clear`

## Maintenance

Use the maintenance script to fix any issues with face encodings:

```
python backend/fix_encodings.py
```

Or use the batch file for comprehensive maintenance:

```
maintenance.bat
```

## Usage Tips for Better Face Recognition

1. **For Registration**:

   - Use a clear, well-lit photo with face looking directly at the camera
   - Ensure face is not covered by glasses, masks, or hair
   - Use a neutral expression for best results

2. **For Recognition**:
   - Position face in the center of the frame
   - Ensure good lighting conditions
   - Try different angles if recognition fails initially
   - Check confidence score to evaluate match quality
