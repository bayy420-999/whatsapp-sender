# WhatsApp Sender Docker Manager Script (PowerShell)
# This script helps manage multiple WhatsApp sender containers

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Container = ""
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# Function to print colored output
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

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to show usage
function Show-Usage {
    Write-Host "WhatsApp Sender Docker Manager" -ForegroundColor $White
    Write-Host ""
    Write-Host "Usage: .\docker-manager.ps1 [COMMAND] [CONTAINER]" -ForegroundColor $White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor $White
    Write-Host "  start [container]     Start all containers or specific container" -ForegroundColor $White
    Write-Host "  stop [container]      Stop all containers or specific container" -ForegroundColor $White
    Write-Host "  restart [container]   Restart all containers or specific container" -ForegroundColor $White
    Write-Host "  status                Show status of all containers" -ForegroundColor $White
    Write-Host "  logs [container]      Show logs for all containers or specific container" -ForegroundColor $White
    Write-Host "  build                 Build all containers" -ForegroundColor $White
    Write-Host "  clean                 Stop and remove all containers and volumes" -ForegroundColor $White
    Write-Host "  backup                Create backup of all data" -ForegroundColor $White
    Write-Host "  help                  Show this help message" -ForegroundColor $White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $White
    Write-Host "  .\docker-manager.ps1 start              # Start all containers" -ForegroundColor $White
    Write-Host "  .\docker-manager.ps1 start wa-0         # Start only wa-0 container" -ForegroundColor $White
Write-Host "  .\docker-manager.ps1 logs wa-1          # Show logs for wa-1 container" -ForegroundColor $White
    Write-Host "  .\docker-manager.ps1 status             # Show status of all containers" -ForegroundColor $White
}

# Function to start containers
function Start-Containers {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Starting all containers..."
        docker-compose up -d
        Write-Success "All containers started successfully!"
    }
    else {
        Write-Status "Starting container: $ContainerName"
        docker-compose up -d $ContainerName
        Write-Success "Container $ContainerName started successfully!"
    }
}

# Function to stop containers
function Stop-Containers {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Stopping all containers..."
        docker-compose down
        Write-Success "All containers stopped successfully!"
    }
    else {
        Write-Status "Stopping container: $ContainerName"
        docker-compose stop $ContainerName
        Write-Success "Container $ContainerName stopped successfully!"
    }
}

# Function to restart containers
function Restart-Containers {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Restarting all containers..."
        docker-compose restart
        Write-Success "All containers restarted successfully!"
    }
    else {
        Write-Status "Restarting container: $ContainerName"
        docker-compose restart $ContainerName
        Write-Success "Container $ContainerName restarted successfully!"
    }
}

# Function to show container status
function Show-Status {
    Write-Status "Container Status:"
    Write-Host ""
    docker-compose ps
    Write-Host ""
    
    Write-Status "Resource Usage:"
    Write-Host ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show logs
function Show-Logs {
    param([string]$ContainerName)
    
    if ([string]::IsNullOrEmpty($ContainerName)) {
        Write-Status "Showing logs for all containers (press Ctrl+C to stop):"
        docker-compose logs -f
    }
    else {
        Write-Status "Showing logs for container: $ContainerName (press Ctrl+C to stop):"
        docker-compose logs -f $ContainerName
    }
}

# Function to build containers
function Build-Containers {
    Write-Status "Building all containers..."
    docker-compose build --no-cache
    Write-Success "All containers built successfully!"
}

# Function to clean up
function Clean-Containers {
    Write-Warning "This will stop and remove all containers and volumes. Are you sure? (y/N)"
    $response = Read-Host
    
    if ($response -match "^[yY](es)?$") {
        Write-Status "Cleaning up containers and volumes..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Success "Cleanup completed successfully!"
    }
    else {
        Write-Status "Cleanup cancelled."
    }
}

# Function to create backup
function Create-Backup {
    $backupDir = ".\backups"
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "whatsapp-backup-${timestamp}.tar.gz"
    
    Write-Status "Creating backup..."
    
    # Create backup directory if it doesn't exist
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    # Create backup using tar (if available) or PowerShell compression
    try {
        # Try using tar first
        tar -czf "${backupDir}\${backupFile}" data/ configs/ docker-compose.yml Dockerfile
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backup created successfully: ${backupDir}\${backupFile}"
            
            # Show backup size
            $size = (Get-Item "${backupDir}\${backupFile}").Length
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Status "Backup size: $sizeMB MB"
        }
        else {
            throw "tar command failed"
        }
    }
    catch {
        Write-Warning "tar command not available, using PowerShell compression..."
        
        # Fallback to PowerShell compression
        $backupFile = "whatsapp-backup-${timestamp}.zip"
        Compress-Archive -Path "data", "configs", "docker-compose.yml", "Dockerfile" -DestinationPath "${backupDir}\${backupFile}"
        
        if (Test-Path "${backupDir}\${backupFile}") {
            Write-Success "Backup created successfully: ${backupDir}\${backupFile}"
            
            # Show backup size
            $size = (Get-Item "${backupDir}\${backupFile}").Length
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Status "Backup size: $sizeMB MB"
        }
        else {
            Write-Error "Failed to create backup"
            exit 1
        }
    }
}

# Main script logic
function Main {
    # Check prerequisites
    if (!(Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    if (!(Test-DockerCompose)) {
        Write-Error "Docker Compose is not installed. Please install it and try again."
        exit 1
    }
    
    # Parse command
    switch ($Command.ToLower()) {
        "start" {
            Start-Containers $Container
        }
        "stop" {
            Stop-Containers $Container
        }
        "restart" {
            Restart-Containers $Container
        }
        "status" {
            Show-Status
        }
        "logs" {
            Show-Logs $Container
        }
        "build" {
            Build-Containers
        }
        "clean" {
            Clean-Containers
        }
        "backup" {
            Create-Backup
        }
        "help" {
            Show-Usage
        }
        default {
            Write-Error "Unknown command: $Command"
            Write-Host ""
            Show-Usage
            exit 1
        }
    }
}

# Run main function
Main
