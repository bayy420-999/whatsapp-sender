# WhatsApp Sender

A powerful and interactive WhatsApp message sender built with whatsapp-web.js and TypeScript. This application supports both local development and Docker multi-container deployment, allowing you to run multiple WhatsApp sessions simultaneously with independent configurations.

## ✨ Features

- 📱 **Interactive CLI Interface** - Easy-to-use command-line interface
- 👥 **Contact Management** - Add, view, and manage your contacts
- 📝 **Message Templates** - Create and reuse message templates with media support
- 📤 **Single Message Sending** - Send text and media messages to individual contacts
- 📢 **Bulk Messaging** - Send messages to multiple contacts with configurable delays
- 📊 **Progress Tracking** - Track and resume bulk messaging sessions
- 🎯 **Session Management** - View session history and resume interrupted sessions
- 🖼️ **Media Support** - Send images/videos with captions
- 🔐 **Secure Authentication** - Uses WhatsApp Web's QR code authentication
- ⚙️ **Configuration Management** - Customizable settings with persistent storage
- 💬 **Auto-reply** - Automatic responses to incoming messages
- 🆕 **Latest Technology** - Built with whatsapp-web.js v1.32.0 and TypeScript 5.6+
- 🐳 **Docker Support** - Multi-container deployment with independent sessions
- 🌐 **Device Spoofing** - Each container appears as different devices/browsers

## 🚀 New in Version 2.0.0

- **🐳 Docker Multi-Container Architecture** - Run multiple WhatsApp sessions in separate containers
- **📱 Device Configuration** - Each container can have unique device profiles (name, browser, user agent)
- **🔄 Scalable Sessions** - Easy to add new containers (wa-0, wa-1, wa-2, wa-3, etc.)
- **📁 Docker Configs** - Individual configuration files for each container
- **⚡ PowerShell Management** - Windows-compatible container management script
- **📚 Comprehensive Documentation** - Complete Docker setup and management guide
- **🔧 Interactive Mode Updates** - Docker-aware configuration management
- **📊 Session Isolation** - Each container maintains independent WhatsApp sessions

## 🚀 New in Version 1.5.0

- **Individual Session Files** - Each bulk messaging session stored as separate JSON files
- **Improved Ctrl+C Handling** - Sessions properly marked as "interrupted" when stopped with Ctrl+C
- **Session Cleanup** - Automatic cleanup of old sessions with configurable retention
- **Session Export** - Export all sessions to a single file for backup/analysis
- **Individual Session Deletion** - Remove specific session files as needed
- **Enhanced Signal Handling** - Proper graceful shutdown with SIGINT and SIGTERM support
- **Priority-Based Optional Delays** - Larger N values have higher priority (no cumulative delays)
- **Better Performance** - Faster loading and management of session data
- **Data Integrity** - No more "running" sessions after unexpected shutdowns

## 🚀 New in Version 1.4.0

- **Progress Tracking System** - Track every bulk messaging session with detailed results
- **Session Resume** - Continue interrupted sessions from where you left off
- **Media Message Support** - Send images and videos with captions
- **Organized Data Structure** - Contacts and templates stored in organized subdirectories
- **Session History** - View detailed history of all messaging sessions
- **Real-time Progress** - Monitor success/failure rates during bulk operations

## 📋 Prerequisites

### Local Development
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- A WhatsApp account
- A mobile device to scan QR codes

### Docker Deployment
- Docker Desktop 20.10+ or Docker Engine 20.10+
- Docker Compose 2.0+
- A WhatsApp account for each container
- Mobile device(s) to scan QR codes

## 🛠️ Installation

### Option 1: Local Development

1. **Clone or navigate to the project directory:**
   ```bash
   cd whatsapp-sender
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Update dependencies (optional):**
   ```bash
   npm update
   npm run build
   ```

### Option 2: Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd whatsapp-sender
   ```

2. **Build and start all containers:**
   ```bash
   docker-compose up -d --build
   ```

3. **View container logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Start individual containers:**
   ```bash
   docker-compose up -d whatsapp-wa-0
   docker-compose up -d whatsapp-wa-1
   docker-compose up -d whatsapp-wa-2
   docker-compose up -d whatsapp-wa-3
   ```

## 📁 Project Structure

### Local Development
```
whatsapp-sender/
├── data/
│   ├── contacts/                    # Contact files directory
│   │   └── contacts.json           # Primary contacts file
│   ├── message-templates/          # Template files directory
│   │   └── message-templates.json  # Primary templates file
│   └── results/                    # Session results directory
│       ├── session-1234567890-abc123.json  # Individual session files
│       ├── session-1234567891-def456.json  # Each session has its own file
│       └── README.md               # Session management documentation
├── sessions/                        # WhatsApp session data
├── dist/                           # Compiled JavaScript
└── src/                            # TypeScript source code
```

### Docker Deployment
```
whatsapp-sender/
├── configs/
│   ├── wa-1.json                   # WhatsApp Session 1 configuration
│   ├── wa-2.json                   # WhatsApp Session 2 configuration
│   ├── wa-3.json                   # WhatsApp Session 3 configuration
│   └── wa-4.json                   # WhatsApp Session 4 configuration
├── data/                           # Shared data directory (mounted to all containers)
│   ├── contacts/                   # Shared contact files
│   ├── message-templates/          # Shared message templates
│   ├── sessions/                   # Individual session data per client
│   └── results/                    # Shared result files
├── docker-compose.yml              # Multi-container orchestration
├── Dockerfile                      # Container image definition
├── docker-manager.ps1              # PowerShell management script
└── DOCKER_README.md                # Docker setup documentation
```

## 🐳 Docker Multi-Container Setup

### Architecture Overview
- **Single Client per Container**: Each container runs exactly one WhatsApp client
- **Shared Data**: All containers share the same data directories for contacts, templates, and results
- **Independent Sessions**: Each container maintains its own WhatsApp session
- **Scalable**: Easy to add new containers for additional WhatsApp accounts

### Container Naming Convention
| Container | Config File | Description |
|-----------|-------------|-------------|
| `whatsapp-wa-0` | `configs/wa-1.json` | WhatsApp Session 0 |
| `whatsapp-wa-1` | `configs/wa-2.json` | WhatsApp Session 1 |
| `whatsapp-wa-2` | `configs/wa-3.json` | WhatsApp Session 2 |
| `whatsapp-wa-3` | `configs/wa-4.json` | WhatsApp Session 3 |

### Device Configuration
Each container can have unique device profiles to appear as different devices/browsers:

```json
{
  "client": {
    "device": {
      "name": "iPhone 15",
      "browser": "Safari Mobile",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
    }
  }
}
```

### Container Management

#### PowerShell Script (Windows)
```powershell
# Start all containers
.\docker-manager.ps1 start

# Start specific container
.\docker-manager.ps1 start wa-0

# View logs
.\docker-manager.ps1 logs wa-1

# Check status
.\docker-manager.ps1 status
```

#### Docker Compose Commands
```bash
# Start all containers
docker-compose up -d

# Start specific container
docker-compose up -d whatsapp-wa-0

# View logs
docker-compose logs whatsapp-wa-1

# Restart container
docker-compose restart whatsapp-wa-2

# Stop all containers
docker-compose down
```

## 🎮 Usage

### Local Development

1. **Run the application:**
   ```bash
   npm start
   ```

2. **First-time setup:**
   - A QR code will appear in your terminal
   - Open WhatsApp on your mobile device
   - Go to Settings > Linked Devices > Link a Device
   - Scan the QR code displayed in your terminal

3. **Authentication:**
   - Once scanned, the application will authenticate
   - You'll see "WhatsApp client is ready!" message
   - The interactive menu will appear

### Docker Deployment

1. **Start containers:**
   ```bash
   docker-compose up -d
   ```

2. **Access interactive mode:**
   ```bash
   docker exec -it whatsapp-sender-wa-0 npm start
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f whatsapp-wa-0
   ```

### Interactive Menu Options

#### 1. Send Message
- Select a contact from your contacts list
- Choose between using a message template or typing a custom message
- **NEW**: Automatically detects media templates and sends media with captions
- Send the message instantly

#### 2. Add Contact
- Enter contact name and phone number
- Phone numbers are automatically formatted with country code
- Contacts are saved to `data/contacts/contacts.json`

#### 3. View Contacts
- Display all saved contacts with names and phone numbers

#### 4. Add Message Template
- Create reusable message templates
- **NEW**: Support for media files (images/videos)
- Templates are saved to `data/message-templates/message-templates.json`

#### 5. View Message Templates
- Display all saved message templates
- **NEW**: Shows attached media files for each template

#### 6. Send Bulk Messages
- **Simplified:** Automatically sends to ALL loaded contacts
- **Random Templates:** Each contact gets a random message template
- **Customizable Delay:** Set delay range between messages (to avoid spam detection)
- **Progress Tracking:** Every message is tracked and saved to individual session files
- **Session Management:** Creates a unique session ID for tracking

#### 7. Resume Interrupted Session ⭐ NEW
- **Session Recovery:** Continue bulk messaging from where you left off
- **Progress Preservation:** All completed messages are preserved
- **Smart Resume:** Only sends to remaining contacts
- **Session Selection:** Choose from multiple interrupted sessions
- **Intelligent Contact Tracking:** Handles duplicate phone numbers and contact matching issues
- **Robust Resume Logic:** Reliable session resumption with proper progress calculation

#### 8. View Session History ⭐ NEW
- **Complete History:** View all messaging sessions
- **Detailed Statistics:** Success rates, failure reasons, timing
- **Session Status:** Running, completed, or interrupted
- **Contact-level Tracking:** See which contacts received which templates

#### 9. Manage Configuration
- **View Settings:** See current configuration values
- **Update Delays:** Modify delay ranges for messaging
- **Client Settings:** Toggle headless mode and device configuration
- **Session Cleanup:** Configure automatic cleanup of old sessions
- **Export Sessions:** Export all sessions to a single file
- **Reset to Defaults:** Restore factory settings
- **Docker Mode:** Configuration changes are temporary (edit config files to persist)

#### 10. Docker Help (Docker Mode Only)
- **Container Management:** Docker commands and examples
- **Configuration Guide:** How to persist configuration changes
- **Troubleshooting:** Common Docker issues and solutions

#### 11. Exit
- Safely close the application

## 📊 Progress Tracking System

### Session Management
Every bulk messaging operation creates a unique session with:
- **Session ID**: Unique identifier for tracking
- **Start/End Time**: Complete timing information
- **Progress Counter**: Real-time success/failure tracking
- **Delay Settings**: Preserved for session resumption
- **Detailed Results**: Contact-level success/failure tracking

### Results Storage
Each session is automatically saved to its own file in `data/results/` directory:
```
data/results/
├── session-1234567890-abc123.json
├── session-1234567891-def456.json
└── session-1234567892-ghi789.json
```

Each session file contains:
```json
{
  "id": "session-1234567890-abc123",
  "startTime": "2025-08-13T10:00:00.000Z",
  "totalContacts": 100,
  "completedContacts": 75,
  "failedContacts": 5,
  "pendingContacts": 20,
  "status": "interrupted",
  "endTime": "2025-08-13T10:05:00.000Z",
  "delaySettings": {
    "minDelay": 3,
    "maxDelay": 8
  },
  "results": [
    {
      "contact": { "name": "John", "phone": "+1234567890" },
      "template": { "name": "Welcome", "content": "Hello!" },
      "status": "success",
      "timestamp": "2025-08-13T10:01:00.000Z"
    }
  ]
}
```

### Session Resume
If a bulk messaging session is interrupted:
1. **Automatic Detection**: App detects interrupted sessions on startup
2. **Progress Preservation**: All completed messages are preserved
3. **Smart Resume**: Only sends to remaining contacts
4. **Session Continuation**: Continues with same delay settings

### Enhanced Session Management
- **Individual Session Files**: Each session stored separately for better performance
- **Session Cleanup**: Automatically remove old sessions (configurable retention period)
- **Session Export**: Export all sessions to a single file for backup/analysis
- **Individual Deletion**: Remove specific session files as needed
- **Improved Ctrl+C Handling**: Sessions properly marked as "interrupted" when stopped
- **Graceful Shutdown**: Proper signal handling for SIGINT (Ctrl+C) and SIGTERM
- **Session Resume**: Intelligent resumption of interrupted sessions with proper contact tracking
- **Robust Error Handling**: Comprehensive error handling and recovery mechanisms

## 🖼️ Media Message Support

### Creating Media Templates
When adding message templates, you can now include media files:
- **Image Support**: PNG, JPG, GIF files
- **Video Support**: MP4, AVI, MOV files
- **Caption Integration**: Template content becomes media caption
- **File Paths**: Absolute or relative paths supported

### Media Template Example
```json
{
  "name": "Welcome with Logo",
  "content": "Welcome to our service! 🎉",
  "media": ["C:/path/to/logo.png"]
}
```

### Sending Media Messages
- **Automatic Detection**: App detects media templates automatically
- **Media Validation**: Checks if media files exist before sending
- **Caption Support**: Template content becomes WhatsApp caption
- **Error Handling**: Graceful fallback for missing media files

## ⚙️ Configuration

### Docker Configuration Files
Each container has its own configuration file in the `configs/` directory:

```json
{
  "client": {
    "id": "wa-0",
    "name": "WhatsApp Session 0",
    "headless": true,
    "puppeteerArgs": ["--no-sandbox", "--disable-setuid-sandbox"],
    "sessionTimeout": 300000,
    "clientId": "whatsapp-sender-wa-0",
    "device": {
      "name": "Desktop",
      "browser": "Chrome",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.00.0 Safari/537.36"
    }
  },
  "messaging": {
    "defaultMinDelay": 3,
    "defaultMaxDelay": 8,
    "maxRetries": 3,
    "optionalDelays": [
      {
        "everyNMessages": {
          "n": 5,
          "min": 20,
          "max": 30
        }
      }
    ]
  },
  "paths": {
    "contactsFolder": "../data/contacts",
    "templatesFolder": "../data/message-templates",
    "sessionsFolder": "../data/sessions"
  },
  "autoSave": {
    "enabled": true,
    "interval": 30,
    "createBackups": true
  },
  "logging": {
    "level": "info",
    "showProgress": true,
    "showTimestamps": true
  }
}
```

### Interactive Optional Delays Management
The system now provides a comprehensive interface for managing multiple optional delays:

- **Add New Delay Rules**: Create custom delay rules for specific message intervals
- **Edit Existing Rules**: Modify delay parameters for existing rules
- **Delete Rules**: Remove specific delay rules as needed
- **Clear All Delays**: Reset all optional delays at once
- **Priority-Based System**: Larger N values have higher priority (no cumulative delays)

#### Example Configuration
```json
"optionalDelays": [
  {
    "everyNMessages": {
      "n": 5,
      "min": 20,
      "max": 30
    }
  },
  {
    "everyNMessages": {
      "n": 10,
      "min": 30,
      "max": 60
    }
  }
]
```

#### How It Works
- **Message 5**: Uses 20-30s delay (every 5 messages rule) - **replaces base delay**
- **Message 10**: Uses 30-60s delay (every 10 messages rule) - **replaces base delay**
- **Message 15**: Uses 20-30s delay (every 5 messages rule) - **replaces base delay**
- **Message 20**: Uses 30-60s delay (every 10 messages rule) - **replaces base delay**

**Key Feature**: Optional delays **replace** the base delay instead of adding to it. This means:
- Messages 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19: Use base delay (3-8s)
- Messages 5, 10, 15, 20: Use optional delay (20-30s or 30-60s) **instead of** base delay

This provides more predictable timing and prevents delays from accumulating.

### Key Settings
- **Delays**: Configure minimum and maximum delays between messages
- **Optional Delays**: Add extra delays every N messages (anti-spam)
- **Priority-Based Delays**: Larger N values have higher priority (no cumulative delays)
- **Client Options**: Puppeteer settings for WhatsApp Web
- **Device Profiles**: Customize device name, browser, and user agent
- **File Paths**: Customize where data is stored

## 🔧 Development

### Local Development Mode
```bash
npm run dev
```

### Building the Project
```bash
npm run build
```

### Cleaning Build Files
```bash
npm run clean
```

### Docker Development
```bash
# Build containers
docker-compose build

# Run in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## ⚡ Performance Optimizations

### Code Efficiency Improvements
- **Streamlined Delay Logic**: Optimized optional delay calculations with dedicated `calculateDelay` method
- **Reduced Redundancy**: Eliminated duplicate code and unnecessary operations
- **Cleaner Methods**: Simplified method implementations with better error handling
- **Memory Management**: Improved session object management and cleanup

### Signal Handling Optimization
- **Robust Ctrl+C Support**: Sessions properly marked as "interrupted" on termination
- **Graceful Shutdown**: Clean process termination with proper cleanup
- **Session Persistence**: Interrupted sessions are reliably saved and can be resumed
- **Error Recovery**: Comprehensive error handling during shutdown scenarios

### Session Management Efficiency
- **Individual File Storage**: Each session stored in separate files for better performance
- **Smart Resume Logic**: Intelligent contact tracking for session resumption
- **Optimized File I/O**: Efficient file operations with proper error handling
- **Memory Cleanup**: Proper cleanup of session objects and resources

### Docker Performance
- **Container Isolation**: Each WhatsApp session runs independently
- **Resource Management**: Efficient memory and CPU usage per container
- **Shared Volumes**: Optimized data sharing between containers
- **Network Optimization**: Dedicated network for container communication

## 🚨 Troubleshooting

### Common Issues

1. **QR Code Not Appearing:**
   - Ensure you have a stable internet connection
   - Check if WhatsApp Web is accessible in your browser
   - For Docker: Check container logs with `docker-compose logs whatsapp-wa-0`

2. **Authentication Failed:**
   - Make sure you're using the correct WhatsApp account
   - Try logging out and logging back in on your mobile device
   - For Docker: Restart container with `docker-compose restart whatsapp-wa-0`

3. **Messages Not Sending:**
   - Verify the phone number format
   - Check if the contact exists on WhatsApp
   - Ensure you're not blocked by the recipient

4. **Media Messages Failing:**
   - Verify media file paths are correct
   - Check if media files exist and are accessible
   - Ensure media files are supported formats

5. **Session Resume Issues:**
   - Check if session files exist in `data/results/` directory
   - Verify session data integrity
   - Restart application if session data is corrupted

6. **Connection Issues:**
   - Restart the application
   - Check your internet connection
   - Verify WhatsApp Web is working in your browser

### Docker-Specific Issues

1. **Container Won't Start:**
   ```bash
   # Check Docker status
   docker info
   
   # Check container logs
   docker-compose logs whatsapp-wa-0
   
   # Rebuild containers
   docker-compose build --no-cache
   ```

2. **Configuration Changes Not Persisting:**
   - Edit the appropriate config file in `configs/` directory
   - Restart the container: `docker-compose restart whatsapp-wa-0`
   - Changes in interactive mode are temporary

3. **Shared Data Issues:**
   - Ensure `data/` directory exists and has proper permissions
   - Check volume mounts in `docker-compose.yml`
   - Verify file paths in configuration files

4. **Multiple Container Conflicts:**
   - Ensure each container has unique client IDs
   - Check that session folders are properly isolated
   - Monitor resource usage with `docker stats`

### Error Handling

The application includes comprehensive error handling:
- Network connection errors
- Authentication failures
- Message sending failures
- Media file validation errors
- Session data corruption
- File I/O errors
- Docker container errors
- Configuration validation errors

## 🔒 Security Considerations

- **Local Storage:** All data is stored locally on your machine
- **Session Data:** WhatsApp session data is encrypted and stored locally
- **No Cloud Storage:** No data is sent to external servers
- **Privacy:** Messages are sent directly through WhatsApp's official API
- **Media Security:** Media files are read locally and not uploaded
- **Container Isolation:** Each Docker container runs in its own namespace
- **Network Security:** Containers communicate through isolated Docker network

## ⚠️ Limitations

- Requires WhatsApp Web to be accessible
- Dependent on WhatsApp's terms of service
- May be affected by WhatsApp's anti-spam measures
- Requires manual QR code scanning for authentication
- Media files must be accessible from the application directory
- Docker containers require sufficient system resources
- Configuration changes require container restart to persist

## 🤝 Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation
- Adding Docker configurations
- Enhancing device profiles

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

### Local Development
1. Check the troubleshooting section above
2. Review the error messages in the console
3. Check the session results in `data/results/` directory
4. Ensure all prerequisites are met
5. Verify your WhatsApp account status

### Docker Deployment
1. Check container logs: `docker-compose logs [container-name]`
2. Verify configuration files are valid JSON
3. Ensure Docker and Docker Compose are up to date
4. Check system resources and limits
5. Review the `DOCKER_README.md` for detailed setup instructions

## 📝 Changelog

### Version 2.0.0 ⭐ NEW
- **🐳 Docker Multi-Container Architecture** - Run multiple WhatsApp sessions in separate containers
- **📱 Device Configuration** - Each container can have unique device profiles (name, browser, user agent)
- **🔄 Scalable Sessions** - Easy to add new containers (wa-0, wa-1, wa-2, wa-3, etc.)
- **📁 Docker Configs** - Individual configuration files for each container
- **⚡ PowerShell Management** - Windows-compatible container management script
- **📚 Comprehensive Documentation** - Complete Docker setup and management guide
- **🔧 Interactive Mode Updates** - Docker-aware configuration management
- **📊 Session Isolation** - Each container maintains independent WhatsApp sessions
- **🌐 Device Spoofing** - Each container appears as different devices to WhatsApp

### Version 1.5.0
- **Individual Session Files** - Each session stored as separate JSON files for better performance
- **Improved Ctrl+C Handling** - Sessions properly marked as "interrupted" when stopped with Ctrl+C
- **Session Cleanup** - Automatic cleanup of old sessions with configurable retention period
- **Session Export** - Export all sessions to a single file for backup and analysis
- **Individual Session Deletion** - Remove specific session files as needed
- **Enhanced Signal Handling** - Proper graceful shutdown with SIGINT and SIGTERM support
- **Priority-Based Optional Delays** - Larger N values have higher priority (no cumulative delays)
- **Better Performance** - Faster loading and management of session data
- **Data Integrity** - No more "running" sessions after unexpected shutdowns
- **Code Optimization** - Streamlined methods, reduced redundancy, and improved efficiency
- **Robust Session Resume** - Intelligent contact tracking and session resumption
- **Memory Management** - Better resource cleanup and session object management

### Version 1.4.0
- **Progress Tracking System** - Complete session management with detailed results
- **Session Resume** - Continue interrupted bulk messaging sessions
- **Media Message Support** - Send images/videos with captions
- **Organized Data Structure** - Contacts and templates in subdirectories
- **Session History** - View detailed history of all messaging sessions
- **Real-time Progress** - Monitor success/failure rates during operations
- **Results Storage** - Persistent session data in individual files

### Version 1.3.0
- **Configuration System** - Centralized settings management with Docker configs
- **Randomized Delays** - Delay ranges instead of fixed delays for natural behavior
- **Configurable Settings** - Customize delays, client options, and file paths
- **Auto-Save Configuration** - Changes automatically saved to persistent config file
- **Default Values** - Sensible defaults that can be customized via CLI

### Version 1.2.0
- **Simplified Bulk Messaging** - No more manual contact selection
- **Random Template Assignment** - Each contact gets a random message template
- **Automatic File Loading** - Loads contacts and templates from folder structures
- **Smart File Management** - Saves to main files or creates timestamped backups

### Version 1.1.0
- Updated whatsapp-web.js to v1.32.0 (latest)
- Updated Node.js requirement to 18.0.0+
- Updated TypeScript and other dependencies
- Removed Windows-specific scripts for cross-platform compatibility

### Version 1.0.0
- Initial release
- Basic messaging functionality
- Contact management
- Message templates
- Bulk messaging support
- Interactive CLI interface

---

**Note:** This application is for personal and legitimate business use only. Please respect WhatsApp's terms of service and use responsibly. The progress tracking system helps ensure reliable message delivery and session management.

## 🎯 Current Status

The WhatsApp Sender application is now **fully optimized and production-ready** with:
- ✅ **Docker Multi-Container Support**: Scalable architecture for multiple WhatsApp sessions
- ✅ **Device Spoofing**: Each container appears as different devices/browsers
- ✅ **Robust Signal Handling**: Proper Ctrl+C support and graceful shutdown
- ✅ **Reliable Session Management**: Individual session files with proper status tracking
- ✅ **Intelligent Resume Function**: Smart session resumption with contact tracking
- ✅ **Optimized Performance**: Streamlined code with reduced redundancy
- ✅ **Comprehensive Error Handling**: Robust error recovery and data integrity
- ✅ **Clean Codebase**: Maintainable and efficient implementation
- ✅ **Professional Documentation**: Complete setup and management guides

All major features are working correctly and the application handles edge cases gracefully. The Docker architecture provides enterprise-grade scalability and deployment flexibility.
