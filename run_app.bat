@echo off
echo Starting Face Recognition Application...

REM Set environment variables for face recognition
SET USE_CNN_MODEL=false
SET PERFORMANCE_MODE=true

echo Face Recognition Options:
echo 1. Fast Mode (Default) - HOG detection, lower accuracy but faster
echo 2. Accurate Mode - CNN detection, better accuracy but slower
choice /C 12 /M "Select recognition mode"
if %ERRORLEVEL% EQU 2 (
  SET USE_CNN_MODEL=true
  SET PERFORMANCE_MODE=false
  echo Selected: Accurate Mode (CNN model)
) else (
  echo Selected: Fast Mode (HOG model)
)

REM Start backend in a new window with optimized settings
start cmd /k "cd backend/src && set USE_CNN_MODEL=%USE_CNN_MODEL% && set PERFORMANCE_MODE=%PERFORMANCE_MODE% && python main.py"
REM Wait a bit for backend to initialize
timeout /t 5

REM Start client in a new window with production build
start cmd /k "cd client && npm run dev && npx serve -s dist"

echo Application started! 
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/api
echo Backend Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application in your browser...
pause > nul
start http://localhost:5173