@echo off
echo ============================================
echo    Starting NeuroScan Application
echo ============================================
echo.

echo [1/3] Setting up environment...
set USE_SQLITE=true

echo [2/3] Starting Backend Server on http://localhost:8000 ...
start "NeuroScan Backend" /min cmd /c "cd /d E:\1604pro\digital-footprint-analyzer\backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 4 /nobreak >nul

echo [3/3] Starting Frontend Server on http://localhost:5173 ...
start "NeuroScan Frontend" /min cmd /c "cd /d E:\1604pro\digital-footprint-analyzer\frontend && npx vite --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo    NeuroScan is running!
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to open the site in browser...
pause >nul
start http://localhost:5173
