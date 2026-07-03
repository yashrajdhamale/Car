# Android Setup Script for CarziHolidaysApp
Write-Host "[INFO] Setting up Android environment for CarziHolidaysApp..." -ForegroundColor Cyan

# Function to check if a command exists
function Command-Exists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if Node.js is installed
if (-not (Command-Exists "node")) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Java is installed
if (-not (Command-Exists "java")) {
    Write-Host "[WARNING] Java is not installed. Please install OpenJDK 11 or later" -ForegroundColor Yellow
}

# Check if Android Studio is installed
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    Write-Host "[WARNING] ANDROID_HOME is not set. Please install Android Studio and set up the environment variables" -ForegroundColor Yellow
}

# Install project dependencies
Write-Host "[INFO] Installing project dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "[SUCCESS] Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Install Expo modules
Write-Host "[INFO] Installing required Expo modules..." -ForegroundColor Yellow
try {
    npx expo install expo-location expo-notifications expo-status-bar react-native-screens react-native-safe-area-context @react-navigation/native @react-navigation/native-stack
    Write-Host "[SUCCESS] Expo modules installed successfully" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Some Expo modules might not have installed correctly" -ForegroundColor Yellow
}

# Create necessary Android directories if they don't exist
$androidAppDir = "./android/app"
if (-not (Test-Path $androidAppDir)) {
    New-Item -ItemType Directory -Path $androidAppDir -Force | Out-Null
    Write-Host "[INFO] Created Android app directory" -ForegroundColor Green
}

# Create local.properties file if it doesn't exist
$localPropertiesPath = "./android/local.properties"
if (-not (Test-Path $localPropertiesPath) -and $androidHome) {
    $sdkDir = $androidHome -replace '\\', '\\\\'
    "sdk.dir=$sdkDir" | Out-File -FilePath $localPropertiesPath -Encoding ASCII
    Write-Host "[INFO] Created local.properties file" -ForegroundColor Green
}

# Create keystore.properties file if it doesn't exist
$keystorePropertiesPath = "./android/keystore.properties"
if (-not (Test-Path $keystorePropertiesPath)) {
    @"
storePassword=android
keyPassword=android
keyAlias=androiddebugkey
storeFile=debug.keystore
"@ | Out-File -FilePath $keystorePropertiesPath -Encoding ASCII
    Write-Host "[INFO] Created keystore.properties file" -ForegroundColor Green
}

Write-Host ""
Write-Host "[SUCCESS] Android setup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Connect an Android device or start an emulator"
Write-Host "2. Run 'npx expo run:android' to build and run the app"
Write-Host "3. Or run 'npx expo start' to start the development server"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
