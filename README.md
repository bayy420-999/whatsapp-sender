# WhatsApp Sender

A powerful and interactive WhatsApp message sender built with whatsapp-web.js and TypeScript. This application allows you to send individual messages, manage contacts, create message templates, send bulk messages with progress tracking, and support media messages through WhatsApp Web.

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

## 🚀 New in Version 1.4.0

- **Progress Tracking System** - Track every bulk messaging session with detailed results
- **Session Resume** - Continue interrupted sessions from where you left off
- **Media Message Support** - Send images and videos with captions
- **Organized Data Structure** - Contacts and templates stored in organized subdirectories
- **Session History** - View detailed history of all messaging sessions
- **Real-time Progress** - Monitor success/failure rates during bulk operations

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- A WhatsApp account
- A mobile device to scan QR codes

## 🛠️ Installation

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

## 📁 Data Structure

The application now uses an organized directory structure:

```
whatsapp-sender/
├── data/
│   ├── contacts/                    # Contact files directory
│   │   └── contacts.json           # Primary contacts file
│   ├── message-templates/          # Template files directory
│   │   └── message-templates.json  # Primary templates file
│   └── results.json                # Session progress tracking
├── sessions/                        # WhatsApp session data
├── dist/                           # Compiled JavaScript
└── config.json                     # Application configuration
```

## 🎮 Usage

### Starting the Application

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
- **Progress Tracking:** Every message is tracked and saved to `results.json`
- **Session Management:** Creates a unique session ID for tracking

#### 7. Quick Bulk Send
- **One-Click:** Send to all contacts with just one confirmation
- **Randomized Delay:** Configurable delay range between messages
- **Random Templates:** Each contact gets a different random template
- **Progress Tracking:** Full session tracking and resumability

#### 8. Resume Interrupted Session ⭐ NEW
- **Session Recovery:** Continue bulk messaging from where you left off
- **Progress Preservation:** All completed messages are preserved
- **Smart Resume:** Only sends to remaining contacts
- **Session Selection:** Choose from multiple interrupted sessions

#### 9. View Session History ⭐ NEW
- **Complete History:** View all messaging sessions
- **Detailed Statistics:** Success rates, failure reasons, timing
- **Session Status:** Running, completed, or interrupted
- **Contact-level Tracking:** See which contacts received which templates

#### 10. Manage Configuration
- **View Settings:** See current configuration values
- **Update Delays:** Modify delay ranges for messaging
- **Client Settings:** Toggle headless mode and other options
- **Reset to Defaults:** Restore factory settings
- **Auto-Save:** Changes are automatically saved to config.json

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
All session data is automatically saved to `data/results.json`:
```json
{
  "id": "session-1234567890-abc123",
  "startTime": "2025-08-13T10:00:00.000Z",
  "totalContacts": 100,
  "completedContacts": 75,
  "failedContacts": 5,
  "pendingContacts": 20,
  "status": "running",
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

### Configuration File (`config.json`)
The application automatically creates and manages a configuration file:

```json
{
  "client": {
    "headless": false,
    "puppeteerArgs": ["--no-sandbox", "--disable-setuid-sandbox"]
  },
  "messaging": {
    "defaultMinDelay": 3,
    "defaultMaxDelay": 8,
    "quickBulkMinDelay": 2,
    "quickBulkMaxDelay": 6,
    "optionalDelays": [
      {
        "everyNMessages": {
          "n": 5,
          "min": 30,
          "max": 60
        }
      }
    ]
  },
  "paths": {
    "contacts": "data/contacts/",
    "templates": "data/message-templates/",
    "results": "data/results.json"
  }
}
```

### Key Settings
- **Delays**: Configure minimum and maximum delays between messages
- **Optional Delays**: Add extra delays every N messages (anti-spam)
- **Client Options**: Puppeteer settings for WhatsApp Web
- **File Paths**: Customize where data is stored

## 🔧 Development

### Running in Development Mode
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

## 🚨 Troubleshooting

### Common Issues

1. **QR Code Not Appearing:**
   - Ensure you have a stable internet connection
   - Check if WhatsApp Web is accessible in your browser

2. **Authentication Failed:**
   - Make sure you're using the correct WhatsApp account
   - Try logging out and logging back in on your mobile device

3. **Messages Not Sending:**
   - Verify the phone number format
   - Check if the contact exists on WhatsApp
   - Ensure you're not blocked by the recipient

4. **Media Messages Failing:**
   - Verify media file paths are correct
   - Check if media files exist and are accessible
   - Ensure media files are supported formats

5. **Session Resume Issues:**
   - Check if `results.json` exists and is readable
   - Verify session data integrity
   - Restart application if session data is corrupted

6. **Connection Issues:**
   - Restart the application
   - Check your internet connection
   - Verify WhatsApp Web is working in your browser

### Error Handling

The application includes comprehensive error handling:
- Network connection errors
- Authentication failures
- Message sending failures
- Media file validation errors
- Session data corruption
- File I/O errors

## 🔒 Security Considerations

- **Local Storage:** All data is stored locally on your machine
- **Session Data:** WhatsApp session data is encrypted and stored locally
- **No Cloud Storage:** No data is sent to external servers
- **Privacy:** Messages are sent directly through WhatsApp's official API
- **Media Security:** Media files are read locally and not uploaded

## ⚠️ Limitations

- Requires WhatsApp Web to be accessible
- Dependent on WhatsApp's terms of service
- May be affected by WhatsApp's anti-spam measures
- Requires manual QR code scanning for authentication
- Media files must be accessible from the application directory

## 🤝 Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the error messages in the console
3. Check the session results in `data/results.json`
4. Ensure all prerequisites are met
5. Verify your WhatsApp account status

## 📝 Changelog

### Version 1.4.0 ⭐ NEW
- **Progress Tracking System** - Complete session management with detailed results
- **Session Resume** - Continue interrupted bulk messaging sessions
- **Media Message Support** - Send images/videos with captions
- **Organized Data Structure** - Contacts and templates in subdirectories
- **Session History** - View detailed history of all messaging sessions
- **Real-time Progress** - Monitor success/failure rates during operations
- **Results Storage** - Persistent session data in `results.json`

### Version 1.3.0
- **Configuration System** - Centralized settings management with config.json
- **Randomized Delays** - Delay ranges instead of fixed delays for natural behavior
- **Configurable Settings** - Customize delays, client options, and file paths
- **Auto-Save Configuration** - Changes automatically saved to persistent config file
- **Default Values** - Sensible defaults that can be customized via CLI

### Version 1.2.0
- **Simplified Bulk Messaging** - No more manual contact selection
- **Random Template Assignment** - Each contact gets a random message template
- **Quick Bulk Send Mode** - One-click bulk messaging with randomized delays
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
