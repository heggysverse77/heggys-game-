$env:SSH_ASKPASS = "c:\Users\muham\OneDrive\Desktop\heggys game\server\scratch\askpass.bat"
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

Write-Host "Connecting to VPS to pull and build..."
ssh -o StrictHostKeyChecking=no root@72.62.93.237 "cd /var/www/heggys-game || cd /var/www/heggy-game ; git pull origin main && cd client && npm run build && cd ../server && npm run build && pm2 restart all"
Write-Host "Deployment completed!"
