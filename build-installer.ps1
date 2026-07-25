<#
.SYNOPSIS
    Builds a self-contained native app package for Office Management.
    End users do NOT need Java or Docker — the JRE is bundled inside.

.DESCRIPTION
    Runs three stages on the developer's machine:
      1. Build the Angular frontend   (requires Node.js)
      2. Build the Spring Boot JAR    (requires JDK 21 + Maven)
      3. Package with jpackage        (bundled in JDK 14+)

    Output is placed in the  installer\  folder.

.PARAMETER Version
    App version stamped into the package (default: 1.0.0).

.PARAMETER Type
    jpackage output type:
      app-image  (default) — self-contained folder; zip and share.
                             No extra tools required.
      msi        — Windows Installer package.
                   Requires WiX Toolset 3.x  https://wixtoolset.org/
      exe        — EXE installer wrapping an MSI.
                   Requires WiX Toolset 3.x

.EXAMPLE
    .\build-installer.ps1
    .\build-installer.ps1 -Version 2.0.0 -Type msi
#>
param(
    [string]$Version = "1.0.0",
    [ValidateSet("app-image", "msi", "exe")]
    [string]$Type = "app-image"
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

# ── 1. Build Angular ──────────────────────────────────────────────────────────
Write-Step "Building Angular frontend..."
Push-Location "$Root\frontend"
try {
    npm ci --silent
    npm run build
} finally {
    Pop-Location
}

# ── 2. Copy dist into Spring Boot static resources ───────────────────────────
Write-Step "Copying Angular dist to backend static resources..."
$StaticDir = "$Root\backend\src\main\resources\static"
if (Test-Path $StaticDir) { Remove-Item -Recurse -Force $StaticDir }
New-Item -ItemType Directory -Path $StaticDir | Out-Null
Copy-Item -Recurse "$Root\frontend\dist\frontend\browser\*" $StaticDir

# ── 3. Build Spring Boot JAR ──────────────────────────────────────────────────
Write-Step "Building Spring Boot JAR..."
Push-Location "$Root\backend"
try {
    mvn -q -DskipTests package
} finally {
    Pop-Location
}

# ── 4. Package with jpackage ──────────────────────────────────────────────────
Write-Step "Packaging with jpackage (type: $Type)..."
$OutputDir = "$Root\installer"
if (Test-Path $OutputDir) { Remove-Item -Recurse -Force $OutputDir }
New-Item -ItemType Directory -Path $OutputDir | Out-Null

$IconArgs = @()
$IconPath = "$Root\frontend\public\favicon.ico"
if (Test-Path $IconPath) { $IconArgs = @("--icon", $IconPath) }

# win-dir-chooser / win-menu / win-shortcut only apply to msi/exe installers
$WinArgs = @()
if ($Type -ne "app-image") {
    $WinArgs = @("--win-dir-chooser", "--win-menu", "--win-shortcut")
}

jpackage `
    --input       "$Root\backend\target" `
    --name        "Office Management" `
    --main-jar    "office-management.jar" `
    --type        $Type `
    --app-version $Version `
    --description "Personal office activity, todos and bookmarks tracker" `
    --dest        $OutputDir `
    @IconArgs `
    @WinArgs

Write-Host "`nDone! Output: $OutputDir" -ForegroundColor Green

if ($Type -eq "app-image") {
    Write-Host @"

Next steps for distribution:
  1. Zip the 'Office Management' folder inside  $OutputDir
  2. Send the zip to the end user
  3. They extract it and double-click 'Office Management.exe'
     - The browser opens automatically at http://localhost:8080
     - A system-tray icon lets them re-open or quit the app
     - Data is saved to  %USERPROFILE%\.office-management\office.db
"@ -ForegroundColor Yellow
}
