@echo off
echo Copying PNG files modified in last 30 minutes to D:\GitWechatGame\art-assets\atlas
echo.

if not exist "D:\GitWechatGame\art-assets\atlas" (
    mkdir "D:\GitWechatGame\art-assets\atlas"
)

powershell -Command "Get-ChildItem -Path '%~dp0*.png' | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-30) } | ForEach-Object { Copy-Item -Path $_.FullName -Destination 'D:\GitWechatGame\art-assets\atlas' -Force; Write-Host 'Copied:' $_.Name }"

echo.
echo Done!
pause
