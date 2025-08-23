# WhatsApp Sender - Browser Profile Cleanup Script
# This script helps clean up browser profiles and reset containers when Puppeteer errors occur

param(
    [Parameter(Position=0)]
    [string]$Action = "help",
    
    [Parameter(Position=1)]
    [string]$Container = ""
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Usage {
    Write-Host "WhatsApp Sender - Browser Profile Cleanup" -ForegroundColor $White
    Write-Host ""
    Write-Host "Usage: .\cleanup-browser-profiles.ps1 [ACTION] [CONTAINER]" -ForegroundColor $White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $White
    Write-Host "  clean [container]     Clean browser profiles for all containers or specific container" -ForegroundColor $White
    Write-Host "  reset [container]     Stop, clean, and restart containers" -ForegroundColor $White
    Write-Host "  status                Show container and volume status" -ForegroundColor $White
    Write-Host "  help                  Show this help message" -ForegroundColor $White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $White
    Write-Host "  .\cleanup-browser-profiles.ps1 clean              # Clean all browser profiles" -ForegroundColor $White
    Write-Host "  .\cleanup-browser-profiles.ps1 clean wa-0         # Clean wa-0 browser profile" -ForegroundColor $White
    Write-Host "  .\cleanup-browser-profiles.ps1 reset wa-1         # Reset wa-1 container" -ForegroundColor $White
}

function Clean-BrowserProfiles {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Cleaning browser profiles for all containers..."
        
        # Stop all containers
        docker-compose down
        
        # Remove all browser profile volumes
        docker volume rm whatsapp-sender_wa-0-browser-profiles -f 2>$null
        docker volume rm whatsapp-sender_wa-1-browser-profiles -f 2>$null
        docker volume rm whatsapp-sender_wa-2-browser-profiles -f 2>$null
        docker volume rm whatsapp-sender_wa-3-browser-profiles -f 2>$null
        
        Write-Success "All browser profiles cleaned successfully!"
        
        # Start containers again
        Write-Status "Starting containers with fresh browser profiles..."
        docker-compose up -d
        Write-Success "All containers started with clean browser profiles!"
    }
    else {
        Write-Status "Cleaning browser profile for container: $ContainerName"
        
        # Stop specific container
        docker-compose stop $ContainerName
        
        # Remove specific browser profile volume
        $volumeName = "whatsapp-sender_$ContainerName-browser-profiles"
        docker volume rm $volumeName -f 2>$null
        
        Write-Success "Browser profile for $ContainerName cleaned successfully!"
        
        # Start container again
        Write-Status "Starting $ContainerName with fresh browser profile..."
        docker-compose up -d $ContainerName
        Write-Success "$ContainerName started with clean browser profile!"
    }
}

function Reset-Container {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Resetting all containers..."
        Clean-BrowserProfiles
    }
    else {
        Write-Status "Resetting container: $ContainerName"
        Clean-BrowserProfiles $ContainerName
    }
}

function Show-Status {
    Write-Status "Container Status:"
    Write-Host ""
    docker-compose ps
    Write-Host ""
    
    Write-Status "Volume Status:"
    Write-Host ""
    docker volume ls | findstr "whatsapp-sender"
    Write-Host ""
    
    Write-Status "Browser Profile Volumes:"
    Write-Host ""
    docker volume ls | findstr "browser-profiles"
}

# Main script logic
switch ($Action.ToLower()) {
    "clean" {
        Clean-BrowserProfiles $Container
    }
    "reset" {
        Reset-Container $Container
    }
    "status" {
        Show-Status
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Error "Unknown action: $Action"
        Write-Host ""
        Show-Usage
        exit 1
    }
}
