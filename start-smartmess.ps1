$BackendDir = "c:\Users\Abhira\OneDrive\Desktop\smart-mess-upgraded\backend"
$FrontendDir = "c:\Users\Abhira\OneDrive\Desktop\smart-mess-upgraded\frontend"
Write-Host "🚀 Starting MateMess Stack..." -ForegroundColor Cyan

# 1. Fetch IP
try { $PublicIP = (Invoke-WebRequest "https://ifconfig.me/ip" -UseBasicParsing).Content.Trim() } catch { $PublicIP = "Check at whatsmyip.org" }

# 2. Start Backend & Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $BackendDir; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
Write-Host "🐍 Backend Starting..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $FrontendDir; npm run dev -- --port 5174 --host"
Write-Host "⚛️ Frontend Starting..."

# 3. EXTRA WAIT for stability
Write-Host "⏳ Waiting 10 seconds for services to fully bind..." -ForegroundColor Yellow
Start-Sleep -s 10

# 4. Start Tunnel (using 127.0.0.1 to avoid IPv6 issues)
Write-Host "🌐 Opening Public Tunnel..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx localtunnel --port 5174 --local-host 127.0.0.1"

Write-Host "`n✅ Done! Use the LINK in the tunnel window." -ForegroundColor Green
Write-Host "Bypass IP: $PublicIP"
