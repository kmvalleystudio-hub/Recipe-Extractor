# Forward USB-connected phone's localhost to your PC Metro bundler.
# Run this if you see "Could not connect to development server" on a physical device.

$port = 8081
adb reverse "tcp:$port" "tcp:$port"
Write-Host "Done. Phone localhost:$port now points to PC Metro on port $port."
Write-Host "Make sure Metro is running: npm start"
Write-Host "Then reload the app (press R twice or tap RELOAD)."
