import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigManager, defaultConfig } from './config';

interface Contact {
  name: string;
  phone: string;
}

interface MessageTemplate {
  name: string;
  content: string;
  media?: string[]; // Array of file paths for media files
}

interface BulkMessageResult {
  contact: Contact;
  template: MessageTemplate;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
  messageId?: string;
}

interface BulkMessageSession {
  id: string;
  startTime: string;
  endTime?: string;
  totalContacts: number;
  completedContacts: number;
  failedContacts: number;
  pendingContacts: number;
  results: BulkMessageResult[];
  status: 'running' | 'completed' | 'interrupted';
  delaySettings: {
    minDelay: number;
    maxDelay: number;
    optionalDelays: any[];
  };
}

class WhatsAppSender {
  private client: Client;
  private contacts: Contact[] = [];
  private messageTemplates: MessageTemplate[] = [];
  private isReady = false;
  private configManager: ConfigManager;
  private currentSession: BulkMessageSession | null = null;
  private sessionResultsDir = path.join(__dirname, '../data/results');

  constructor() {
    this.configManager = new ConfigManager();
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'whatsapp-sender',
        dataPath: path.join(__dirname, '../data/sessions')
      }),
      puppeteer: {
        headless: defaultConfig.client.headless,
        args: defaultConfig.client.puppeteerArgs
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('qr', (qr: string) => {
      console.log('\n📱 QR Code received! Please scan with WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('\nScan the QR code above with your WhatsApp mobile app');
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp authenticated successfully');
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Authentication failed:', msg);
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('🔌 WhatsApp disconnected:', reason);
      this.isReady = false;
    });


  }



  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing WhatsApp Sender...');
      
      // Load configuration first
      await this.configManager.loadConfig();
      
      await this.client.initialize();
      
      // Wait for client to be ready
      while (!this.isReady) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await this.loadContacts();
      await this.loadMessageTemplates();
      
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  private async loadContacts(): Promise<void> {
    try {
      // First try to load from data/contacts/ folder (priority)
      try {
        const contactsFolderPath = path.join(__dirname, '../data/contacts');
        const files = await fs.readdir(contactsFolderPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          // Load the first JSON file found
          const firstFile = jsonFiles[0];
          const filePath = path.join(contactsFolderPath, firstFile);
          const fileData = await fs.readFile(filePath, 'utf-8');
          this.contacts = JSON.parse(fileData);
          console.log(`📋 Loaded ${this.contacts.length} contacts from data/contacts/${firstFile}`);
          return;
        }
      } catch (folderError) {
        // Folder doesn't exist, continue to fallback
      }

      // Fallback: try to load from the main data/contacts.json
      try {
        const contactsPath = path.join(__dirname, '../data/contacts.json');
        const contactsData = await fs.readFile(contactsPath, 'utf-8');
        this.contacts = JSON.parse(contactsData);
        console.log(`📋 Loaded ${this.contacts.length} contacts from data/contacts.json (fallback)`);
      } catch (error) {
        console.log('📋 No contact files found in data/contacts/ or data/contacts.json');
        this.contacts = [];
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      this.contacts = [];
    }
  }

  private async loadMessageTemplates(): Promise<void> {
    try {
      // First try to load from data/message-templates/ folder (priority)
      try {
        const templatesFolderPath = path.join(__dirname, '../data/message-templates');
        const files = await fs.readdir(templatesFolderPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          // Load the first JSON file found
          const firstFile = jsonFiles[0];
          const filePath = path.join(templatesFolderPath, firstFile);
          const fileData = await fs.readFile(filePath, 'utf-8');
          this.messageTemplates = JSON.parse(fileData);
          console.log(`📝 Loaded ${this.messageTemplates.length} message templates from data/message-templates/${firstFile}`);
          return;
        }
      } catch (folderError) {
        // Folder doesn't exist, continue to fallback
      }

      // Fallback: try to load from the main data/message-templates.json
      try {
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        const templatesData = await fs.readFile(templatesPath, 'utf-8');
        this.messageTemplates = JSON.parse(templatesData);
        console.log(`📝 Loaded ${this.messageTemplates.length} message templates from data/message-templates.json (fallback)`);
      } catch (error) {
        console.log('📝 No message template files found in data/message-templates/ or data/message-templates.json');
        this.messageTemplates = [];
      }
    } catch (error) {
      console.error('❌ Error loading message templates:', error);
      this.messageTemplates = [];
    }
  }

  public async startInteractiveMode(): Promise<void> {
    if (!this.isReady) {
      console.log('❌ WhatsApp client is not ready yet');
      return;
    }

    console.log('\n🎯 WhatsApp Sender Interactive Mode');
    console.log('=====================================');

    while (true) {
            // Show current session status if any
      if (this.hasCurrentSession()) {
        const session = this.currentSession!;
        console.log(`\n📊 Current Session: ${session.id}`);
        console.log(`   Progress: ${session.completedContacts}/${session.totalContacts} (${((session.completedContacts / session.totalContacts) * 100).toFixed(1)}%)`);
        console.log(`   Status: ${session.status.toUpperCase()}`);
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            'Send Message',
            'Add Contact',
            'View Contacts',
            'Load Contacts File',
            'Add Message Template',
            'View Message Templates',
            'Load Message Templates File',
            'Send Bulk Messages',
            'Resume Interrupted Session',
            'View Session History',
            'Manage Configuration',
            'Exit'
          ]
        }
      ]);

      switch (action) {
        case 'Send Message':
          await this.sendSingleMessage();
          break;
        case 'Add Contact':
          await this.addContact();
          break;
        case 'View Contacts':
          await this.viewContacts();
          break;
        case 'Load Contacts File':
          await this.loadContactsFile();
          break;
        case 'Add Message Template':
          await this.addMessageTemplate();
          break;
        case 'View Message Templates':
          await this.viewMessageTemplates();
          break;
        case 'Load Message Templates File':
          await this.loadMessageTemplatesFile();
          break;
        case 'Send Bulk Messages':
          await this.sendBulkMessages();
          break;

        case 'Resume Interrupted Session':
          await this.resumeInterruptedSession();
          break;
        case 'View Session History':
          await this.viewSessionHistory();
          break;
        case 'Manage Configuration':
          await this.manageConfiguration();
          break;
        case 'Exit':
          console.log('👋 Goodbye!');
          return;
      }
    }
  }

  private async sendMediaMessage(phone: string, template: MessageTemplate): Promise<void> {
    try {
      if (!template.media || template.media.length === 0) {
        throw new Error('No media files in template');
      }

      // For now, send the first media file with caption
      // In the future, this could be extended to send multiple media files
      const mediaPath = template.media[0];
      
      // Check if file exists
      const fs = await import('fs/promises');
      try {
        await fs.access(mediaPath);
      } catch {
        throw new Error(`Media file not found: ${mediaPath}`);
      }

      // Send media message with caption using MessageMedia
      const { MessageMedia } = await import('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(mediaPath);
      await this.client.sendMessage(phone, media, { caption: template.content });
    } catch (error) {
      console.error(`❌ Failed to send media message: ${error}`);
      throw error;
    }
  }

  // Progress tracking methods
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createNewSession(totalContacts: number, delaySettings: any): Promise<BulkMessageSession> {
    const session: BulkMessageSession = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      totalContacts,
      completedContacts: 0,
      failedContacts: 0,
      pendingContacts: totalContacts,
      results: [],
      status: 'running',
      delaySettings
    };

    this.currentSession = session;
    await this.saveSessionResults();
    return session;
  }

  private async updateSessionProgress(contact: Contact, template: MessageTemplate, status: 'success' | 'failed', error?: string, messageId?: string): Promise<void> {
    if (!this.currentSession) return;

    const result: BulkMessageResult = {
      contact,
      template,
      status,
      timestamp: new Date().toISOString(),
      error,
      messageId
    };

    this.currentSession.results.push(result);

    if (status === 'success') {
      this.currentSession.completedContacts++;
      this.currentSession.pendingContacts--;
    } else if (status === 'failed') {
      this.currentSession.failedContacts++;
      this.currentSession.pendingContacts--;
    }

    await this.saveSessionResults();
  }

  public async completeSession(status: 'completed' | 'interrupted'): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.status = status;
    this.currentSession.endTime = new Date().toISOString();
    await this.saveSessionResults();

    // Display session summary
    console.log(`\n📊 Session ${status.toUpperCase()}:`);
    console.log(`   Total: ${this.currentSession.totalContacts}`);
    console.log(`   ✅ Success: ${this.currentSession.completedContacts}`);
    console.log(`   ❌ Failed: ${this.currentSession.failedContacts}`);
    console.log(`   ⏳ Pending: ${this.currentSession.pendingContacts}`);
    
    if (this.currentSession.failedContacts > 0) {
      console.log(`\n❌ Failed messages:`);
      this.currentSession.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`   ${r.contact.name} (${r.contact.phone}): ${r.error}`));
    }

    this.currentSession = null;
  }

  public hasCurrentSession(): boolean {
    return this.currentSession !== null && this.currentSession.status === 'running';
  }

  public interruptCurrentSession(): void {
    if (this.currentSession && this.currentSession.status === 'running') {
      console.log('🛑 Interrupting current session...');
      
      this.currentSession.status = 'interrupted';
      this.currentSession.endTime = new Date().toISOString();
      
      try {
        const fs = require('fs');
        const sessionFilePath = require('path').join(this.sessionResultsDir, `${this.currentSession.id}.json`);
        const sessionData = JSON.stringify(this.currentSession, null, 2);
        fs.writeFileSync(sessionFilePath, sessionData);
        console.log('💾 Session status saved as interrupted');
      } catch (error) {
        console.error('❌ Failed to save session:', error);
      }
    }
  }

  private async saveSessionResults(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await fs.mkdir(this.sessionResultsDir, { recursive: true });
      const sessionFilePath = path.join(this.sessionResultsDir, `${this.currentSession.id}.json`);
      const sessionData = JSON.stringify(this.currentSession, null, 2);
      await fs.writeFile(sessionFilePath, sessionData);
    } catch (error) {
      console.error('❌ Failed to save session results:', error);
    }
  }

  private async deleteSessionFile(sessionId: string): Promise<void> {
    try {
      const sessionFilePath = path.join(this.sessionResultsDir, `${sessionId}.json`);
      await fs.unlink(sessionFilePath);
    } catch (error) {
      console.warn(`⚠️ Failed to delete session file ${sessionId}:`, error);
    }
  }

  private async cleanupOldSessions(maxAgeDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionResultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.sessionResultsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            console.log(`🗑️ Cleaned up old session file: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to process file ${file} during cleanup:`, error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old sessions:', error);
    }
  }

  private async deleteSession(): Promise<void> {
    const allSessions = await this.loadSessionResults();
    
    if (allSessions.length === 0) {
      console.log('📋 No sessions to delete.');
      return;
    }

    const { sessionChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sessionChoice',
        message: 'Select a session to delete:',
        choices: [
          ...allSessions.map(session => ({
            name: `${session.id} - ${session.status} (${session.completedContacts}/${session.totalContacts})`,
            value: session.id
          })),
          { name: 'Cancel', value: null }
        ]
      }
    ]);

    if (!sessionChoice) {
      console.log('❌ Deletion cancelled.');
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete session ${sessionChoice}? This action cannot be undone.`,
        default: false
      }
    ]);

    if (confirm) {
      try {
        await this.deleteSessionFile(sessionChoice);
        console.log(`✅ Session ${sessionChoice} deleted successfully.`);
      } catch (error) {
        console.error('❌ Failed to delete session:', error);
      }
      } else {
      console.log('❌ Deletion cancelled.');
    }
  }

  private async exportAllSessions(): Promise<void> {
    const allSessions = await this.loadSessionResults();
    
    if (allSessions.length === 0) {
      console.log('📋 No sessions to export.');
      return;
    }

    try {
      const exportPath = path.join(__dirname, '../data/sessions-export.json');
      await fs.writeFile(exportPath, JSON.stringify(allSessions, null, 2));
      console.log(`✅ All sessions exported to: ${exportPath}`);
      console.log(`📊 Total sessions exported: ${allSessions.length}`);
    } catch (error) {
      console.error('❌ Failed to export sessions:', error);
    }
  }

  private async loadSessionResults(): Promise<BulkMessageSession[]> {
    try {
      await fs.mkdir(this.sessionResultsDir, { recursive: true });
      const files = await fs.readdir(this.sessionResultsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const allSessions: BulkMessageSession[] = [];
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.sessionResultsDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const session = JSON.parse(data);
          allSessions.push(session);
        } catch (error) {
          console.warn(`⚠️ Failed to load session file ${file}:`, error);
        }
      }
      
      return allSessions.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.warn('⚠️ Failed to load session results:', error);
      return [];
    }
  }

  private async resumeInterruptedSession(): Promise<void> {
    const allSessions = await this.loadSessionResults();
    const interruptedSessions = allSessions.filter(s => s.status === 'interrupted');

    if (interruptedSessions.length === 0) {
      console.log('✅ No interrupted sessions found.');
      return;
    }

    console.log(`\n📋 Found ${interruptedSessions.length} interrupted session(s):`);
    interruptedSessions.forEach(s => {
      console.log(`   ${s.id}: ${s.completedContacts}/${s.totalContacts} completed`);
    });

    const { sessionChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sessionChoice',
        message: 'Select session to resume:',
        choices: [
          ...interruptedSessions.map(s => ({
            name: `${s.id} (${s.completedContacts}/${s.totalContacts} completed)`,
            value: s
          })),
          { name: 'Start new session', value: null }
        ]
      }
    ]);

    if (sessionChoice) {
      await this.resumeSession(sessionChoice);
    }
  }

  private async resumeSession(session: BulkMessageSession): Promise<void> {
    this.currentSession = session;
    this.currentSession.status = 'running';
    
    console.log(`\n🔄 Resuming session: ${session.id}`);
    console.log(`   Progress: ${session.completedContacts}/${session.totalContacts}`);
    
    const processedResults = session.results || [];
    const totalContacts = session.totalContacts || 0;
    const remainingCount = totalContacts - processedResults.length;
    
    if (remainingCount <= 0) {
      console.log('✅ All contacts in this session have been processed.');
      await this.completeSession('completed');
      return;
    }

    const startIndex = processedResults.length;
    const endIndex = Math.min(startIndex + remainingCount, this.contacts.length);
    const remainingContacts = this.contacts.slice(startIndex, endIndex);
    
    console.log(`📱 Resuming with ${remainingContacts.length} remaining contacts...`);
    await this.sendBulkMessagesInternal(remainingContacts, session.delaySettings);
  }

  private async viewSessionHistory(): Promise<void> {
    const allSessions = await this.loadSessionResults();
    
    if (allSessions.length === 0) {
      console.log('📋 No session history found.');
      return;
    }

    console.log(`\n📋 Session History (${allSessions.length} sessions):`);
    console.log('================================================');
    
    allSessions.forEach((session, index) => {
      const startDate = new Date(session.startTime).toLocaleString();
      const endDate = session.endTime ? new Date(session.endTime).toLocaleString() : 'Running...';
      const duration = session.endTime 
        ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
        : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);
      
      console.log(`\n${index + 1}. Session: ${session.id}`);
      console.log(`   Status: ${session.status.toUpperCase()}`);
      console.log(`   Started: ${startDate}`);
      console.log(`   ${session.endTime ? 'Ended' : 'Duration'}: ${endDate}`);
      console.log(`   Progress: ${session.completedContacts}/${session.totalContacts} (${((session.completedContacts / session.totalContacts) * 100).toFixed(1)}%)`);
      console.log(`   Success: ${session.completedContacts}, Failed: ${session.failedContacts}, Pending: ${session.pendingContacts}`);
      
      if (session.failedContacts > 0) {
        console.log(`   ❌ Failed contacts:`);
        session.results
          .filter(r => r.status === 'failed')
          .forEach(r => console.log(`      ${r.contact.name} (${r.contact.phone}): ${r.error}`));
      }
    });

    // Add option to delete sessions
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Delete a session',
          'Back to main menu'
        ]
      }
    ]);

    if (action === 'Delete a session') {
      await this.deleteSession();
    }
  }

  private async sendSingleMessage(): Promise<void> {
    if (this.contacts.length === 0) {
      console.log('❌ No contacts available. Please add contacts first.');
      return;
    }

    const { contactChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'contactChoice',
        message: 'Select a contact:',
        choices: this.contacts.map(contact => ({
          name: `${contact.name} (${contact.phone})`,
          value: contact
        }))
      }
    ]);

    // Format phone number early so it's available for media messages
    const formattedPhone = this.formatPhoneNumber(contactChoice.phone);

    const { messageType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'messageType',
        message: 'Choose message type:',
        choices: [
          'Use template',
          'Type custom message'
        ]
      }
    ]);

    let messageContent: string;

    if (messageType === 'Use template') {
      if (this.messageTemplates.length === 0) {
        console.log('❌ No message templates available. Please add templates first.');
        return;
      }

      const { templateChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'templateChoice',
          message: 'Select a message template:',
                  choices: this.messageTemplates.map(template => ({
          name: `${template.name}${template.media && template.media.length > 0 ? ' (📎 Media)' : ''}`,
          value: template
        }))
        }
      ]);

      // Check if template has media
      if (templateChoice.media && templateChoice.media.length > 0) {
        // Send media message with caption
        await this.sendMediaMessage(formattedPhone, templateChoice);
        console.log(`✅ Media message sent successfully to ${contactChoice.name}!`);
        return;
      } else {
        // Send text message
        messageContent = templateChoice.content;
      }
    } else {
      const { customMessage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customMessage',
          message: 'Enter your message:',
          validate: (input: string) => input.trim().length > 0 ? true : 'Message cannot be empty'
        }
      ]);

      messageContent = customMessage;
    }

    try {
      console.log(`📱 Attempting to send message to: ${formattedPhone}`);
      
      // Check if client is ready
      if (!this.client.info) {
        throw new Error('WhatsApp client is not ready. Please wait for authentication.');
      }
      
      await this.client.sendMessage(formattedPhone, messageContent);
      console.log(`✅ Message sent successfully to ${contactChoice.name}!`);
    } catch (error: unknown) {
      console.error(`❌ Failed to send message to ${contactChoice.name}:`);
      console.error(`   Phone: ${contactChoice.phone}`);
      console.error(`   Formatted: ${this.formatPhoneNumber(contactChoice.phone)}`);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   Error: ${errorMessage}`);
      
      // Provide specific error guidance
      if (errorMessage.includes('not found')) {
        console.error(`   💡 This number may not exist on WhatsApp`);
      } else if (errorMessage.includes('not ready')) {
        console.error(`   💡 WhatsApp client is not ready. Please wait for authentication.`);
      } else if (errorMessage.includes('blocked')) {
        console.error(`   💡 You may be blocked by this contact`);
      } else if (errorMessage.includes('rate limit')) {
        console.error(`   💡 Rate limit exceeded. Wait before sending more messages.`);
      }
    }
  }

  private async addContact(): Promise<void> {
    const { name, phone } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter contact name:',
        validate: (input: string) => input.trim().length > 0 ? true : 'Name cannot be empty'
      },
      {
        type: 'input',
        name: 'phone',
        message: 'Enter phone number (with country code, e.g., +6281234567890):',
        validate: (input: string) => {
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return phoneRegex.test(input.replace(/\s/g, '')) ? true : 'Please enter a valid phone number';
        }
      }
    ]);

    const newContact: Contact = {
      name: name.trim(),
      phone: phone.replace(/\s/g, '')
    };

    this.contacts.push(newContact);
    await this.saveContacts();
    console.log(`✅ Contact "${newContact.name}" added successfully!`);
  }

  private async addMessageTemplate(): Promise<void> {
    const { name, content, mediaPaths } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter template name:',
        validate: (input: string) => input.trim().length > 0 ? true : 'Template name cannot be empty'
      },
      {
        type: 'input',
        name: 'content',
        message: 'Enter template content (will be used as caption if media is attached):',
        validate: (input: string) => input.trim().length > 0 ? true : 'Template content cannot be empty'
      },
      {
        type: 'input',
        name: 'mediaPaths',
        message: 'Media file paths (comma-separated, leave empty for text-only):',
        filter: (input: string) => input.trim() ? input.split(',').map(path => path.trim()).filter(path => path) : []
      }
    ]);

    const newTemplate: MessageTemplate = {
      name: name.trim(),
      content: content.trim(),
      media: mediaPaths.length > 0 ? mediaPaths : undefined
    };

    this.messageTemplates.push(newTemplate);
    await this.saveMessageTemplates();
    console.log(`✅ Template "${newTemplate.name}" added successfully!`);
    if (mediaPaths.length > 0) {
      console.log(`📎 Media files: ${mediaPaths.length} attached`);
    }
  }

  private async viewContacts(): Promise<void> {
    if (this.contacts.length === 0) {
      console.log('📋 No contacts available.');
      return;
    }

    console.log('\n📋 Contacts:');
    console.log('============');
    this.contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name} - ${contact.phone}`);
    });
  }

  private async loadContactsFile(): Promise<void> {
    try {
      const contactsFolderPath = path.join(__dirname, '../data/contacts');
      const files = await fs.readdir(contactsFolderPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('📋 No contact files found in contacts folder');
        return;
      }

      console.log('\n📁 Available Contact Files:');
      console.log('============================');
      jsonFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });

      const { selectedFile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFile',
          message: 'Select a contacts file to load:',
          choices: jsonFiles.map(file => ({
            name: file,
            value: file
          }))
        }
      ]);

      const filePath = path.join(contactsFolderPath, selectedFile);
      const fileData = await fs.readFile(filePath, 'utf-8');
      this.contacts = JSON.parse(fileData);
      
      console.log(`✅ Loaded ${this.contacts.length} contacts from ${selectedFile}`);
      
    } catch (error) {
      console.error('❌ Error loading contacts file:', error);
    }
  }

  private async viewMessageTemplates(): Promise<void> {
    if (this.messageTemplates.length === 0) {
      console.log('📝 No message templates available.');
      return;
    }

    console.log('\n📝 Message Templates:');
    console.log('======================');
    this.messageTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}:`);
      console.log(`   ${template.content}`);
      if (template.media && template.media.length > 0) {
        console.log(`   📎 Media: ${template.media.join(', ')}`);
      }
      console.log('');
    });
  }

  private async loadMessageTemplatesFile(): Promise<void> {
    try {
      const templatesFolderPath = path.join(__dirname, '../data/message-templates');
      const files = await fs.readdir(templatesFolderPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('📝 No message template files found in message-templates folder');
        return;
      }

      console.log('\n📁 Available Message Template Files:');
      console.log('=====================================');
      jsonFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });

      const { selectedFile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFile',
          message: 'Select a message templates file to load:',
          choices: jsonFiles.map(file => ({
            name: file,
            value: file
          }))
        }
      ]);

      const filePath = path.join(templatesFolderPath, selectedFile);
      const fileData = await fs.readFile(filePath, 'utf-8');
      this.messageTemplates = JSON.parse(fileData);
      
      console.log(`✅ Loaded ${this.messageTemplates.length} message templates from ${selectedFile}`);
      
    } catch (error) {
      console.error('❌ Error loading message templates file:', error);
    }
  }

  private async sendBulkMessages(): Promise<void> {
    if (this.contacts.length === 0) {
      console.log('❌ No contacts available. Please add contacts first.');
      return;
    }

    if (this.messageTemplates.length === 0) {
      console.log('❌ No message templates available. Please add templates first.');
      return;
    }

    const { minDelay, maxDelay } = await inquirer.prompt([
      {
        type: 'number',
        name: 'minDelay',
        message: 'Minimum delay between messages (in seconds):',
        default: this.configManager.get('messaging').defaultMinDelay,
        validate: (input: number) => input >= 1 ? true : 'Minimum delay must be at least 1 second'
      },
      {
        type: 'number',
        name: 'maxDelay',
        message: 'Maximum delay between messages (in seconds):',
        default: this.configManager.get('messaging').defaultMaxDelay,
        validate: (input: number) => input >= 1 ? true : 'Maximum delay must be at least 1 second'
      }
    ]);

    // Validate that max delay is greater than min delay
    if (maxDelay <= minDelay) {
      console.log('❌ Maximum delay must be greater than minimum delay');
      return;
    }

    const delaySettings = { minDelay, maxDelay, optionalDelays: this.configManager.get('messaging').optionalDelays };
    
    // Create new session for progress tracking
    const session = await this.createNewSession(this.contacts.length, delaySettings);
    
    console.log(`\n📤 Starting bulk messaging to ALL ${this.contacts.length} contacts...`);
    console.log(`📝 Using ${this.messageTemplates.length} message templates randomly`);
    console.log(`⏱️  Delay range: ${minDelay}-${maxDelay} seconds (randomized)`);
    console.log(`📊 Session ID: ${session.id}`);
    console.log('');

    try {
      await this.sendBulkMessagesInternal(this.contacts, delaySettings);
      await this.completeSession('completed');
    } catch (error) {
      console.error('❌ Bulk messaging interrupted:', error);
      await this.completeSession('interrupted');
    }
  }

  private async sendBulkMessagesInternal(contacts: Contact[], delaySettings: any): Promise<void> {
    const { minDelay, maxDelay, optionalDelays } = delaySettings;
    
    try {
    for (let i = 0; i < contacts.length; i++) {
        if (this.currentSession?.status === 'interrupted') {
          console.log('🛑 Session interrupted. Stopping bulk messaging.');
          return;
        }
      
        const contact = contacts[i];
      const randomTemplate = this.messageTemplates[Math.floor(Math.random() * this.messageTemplates.length)];
      
      try {
        const formattedPhone = this.formatPhoneNumber(contact.phone);
        console.log(`📱 [${i + 1}/${contacts.length}] Sending "${randomTemplate.name}" to ${contact.name}...`);
        
        if (randomTemplate.media && randomTemplate.media.length > 0) {
          await this.sendMediaMessage(formattedPhone, randomTemplate);
        } else {
          await this.client.sendMessage(formattedPhone, randomTemplate.content);
        }
        
        console.log(`✅ Message sent successfully to ${contact.name}`);
        await this.updateSessionProgress(contact, randomTemplate, 'success');

        if (i < contacts.length - 1) {
            const delay = this.calculateDelay(i + 1, minDelay, maxDelay, optionalDelays);
            if (delay > 0) {
              console.log(`⏳ Waiting ${delay} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay * 1000));
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to send message to ${contact.name}: ${errorMessage}`);
        await this.updateSessionProgress(contact, randomTemplate, 'failed', errorMessage);
        }
      }
      
      if (this.currentSession) {
        console.log('🎉 All messages sent successfully!');
        await this.completeSession('completed');
      }
    } catch (error) {
      if (this.currentSession) {
        console.error('💥 Error during bulk messaging:', error);
        await this.completeSession('interrupted');
      }
    }
  }

  private calculateDelay(messageIndex: number, minDelay: number, maxDelay: number, optionalDelays: any[]): number {
    if (!optionalDelays?.length) {
      return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    }

    // Find highest priority optional delay rule
    const matchingRule = optionalDelays
      .filter(rule => rule.everyNMessages?.n && messageIndex % rule.everyNMessages.n === 0)
      .sort((a, b) => (b.everyNMessages?.n || 0) - (a.everyNMessages?.n || 0))[0];

    if (matchingRule?.everyNMessages) {
      const { min, max } = matchingRule.everyNMessages;
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      console.log(`🔄 Every ${matchingRule.everyNMessages.n} messages delay: ${delay}s`);
      return delay;
    }

    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }



  private formatPhoneNumber(phone: string): string {
    const cleanNumber = phone.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('0')) {
      return '62' + cleanNumber.substring(1) + '@c.us';
    }
    
    if (cleanNumber.startsWith('62')) {
      return cleanNumber + '@c.us';
    }
    
    return '62' + cleanNumber + '@c.us';
  }

  private async manageConfiguration(): Promise<void> {
    console.log('\n⚙️  Configuration Management');
    console.log('==========================');
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
                 choices: [
           'View Current Configuration',
           'Update Delay Settings',
           'Update Optional Delays',
           'Update Client Settings',
           'Cleanup Old Sessions',
           'Export All Sessions',
           'Reset to Defaults',
           'Back to Main Menu'
         ]
      }
    ]);

    switch (action) {
      case 'View Current Configuration':
        await this.viewConfiguration();
        break;
             case 'Update Delay Settings':
         await this.updateDelaySettings();
         break;
       case 'Update Optional Delays':
         await this.updateOptionalDelays();
         break;
       case 'Update Client Settings':
         await this.updateClientSettings();
         break;
      case 'Cleanup Old Sessions':
        await this.cleanupOldSessions();
        break;
      case 'Export All Sessions':
        await this.exportAllSessions();
         break;
      case 'Reset to Defaults':
        await this.resetConfiguration();
        break;
      case 'Back to Main Menu':
        return;
    }
  }

  private async viewConfiguration(): Promise<void> {
    const config = this.configManager.getConfig();
    
    console.log('\n📋 Current Configuration:');
    console.log('========================');
    console.log(`🤖 Client Headless: ${config.client.headless}`);
    console.log(`⏱️  Default Delay Range: ${config.messaging.defaultMinDelay}-${config.messaging.defaultMaxDelay}s`);

    
    // Display optional delays
    if (config.messaging.optionalDelays && config.messaging.optionalDelays.length > 0) {
      for (const delayRule of config.messaging.optionalDelays) {
        if (delayRule.everyNMessages) {
          console.log(`🔄 Optional Delay: Every ${delayRule.everyNMessages.n} messages: ${delayRule.everyNMessages.min}-${delayRule.everyNMessages.max}s`);
        }
      }
    } else {
      console.log(`🔄 Optional Delays: None configured`);
    }
    
    console.log(`📁 Contacts Folder: ${config.paths.contactsFolder}`);
    console.log(`📝 Templates Folder: ${config.paths.templatesFolder}`);
    console.log(`💾 Auto-save: ${config.autoSave.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 Logging Level: ${config.logging.level}`);
  }

  private async updateDelaySettings(): Promise<void> {
    const { defaultMinDelay, defaultMaxDelay } = await inquirer.prompt([
      {
        type: 'number',
        name: 'defaultMinDelay',
        message: 'Default minimum delay (seconds):',
        default: this.configManager.get('messaging').defaultMinDelay
      },
      {
        type: 'number',
        name: 'defaultMaxDelay',
        message: 'Default maximum delay (seconds):',
        default: this.configManager.get('messaging').defaultMaxDelay
      }
    ]);

    await this.configManager.updateConfig({
      messaging: {
        defaultMinDelay,
        defaultMaxDelay,
        maxRetries: this.configManager.get('messaging').maxRetries,
        optionalDelays: this.configManager.get('messaging').optionalDelays
      }
    });

    console.log('✅ Delay settings updated successfully!');
  }

  private async updateOptionalDelays(): Promise<void> {
    console.log('\n🔄 Optional Delays Management');
    console.log('============================');
    
    const currentDelays = this.configManager.get('messaging').optionalDelays;
    
    if (currentDelays && currentDelays.length > 0) {
      console.log('\n📋 Current Optional Delays:');
      currentDelays.forEach((delay, index) => {
        if (delay.everyNMessages) {
          console.log(`  ${index + 1}. Every ${delay.everyNMessages.n} messages: ${delay.everyNMessages.min}-${delay.everyNMessages.max} seconds`);
        }
      });
    } else {
      console.log('\n📋 No optional delays configured');
    }
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Add New Delay Rule',
          'Edit Existing Delay Rule',
          'Delete Delay Rule',
          'Clear All Delays',
          'Back to Configuration Menu'
        ]
      }
    ]);
    
    switch (action) {
      case 'Add New Delay Rule':
        await this.addNewDelayRule();
        break;
      case 'Edit Existing Delay Rule':
        await this.editExistingDelayRule();
        break;
      case 'Delete Delay Rule':
        await this.deleteDelayRule();
        break;
      case 'Clear All Delays':
        await this.clearAllDelays();
        break;
      case 'Back to Configuration Menu':
        return;
    }
  }

  private async addNewDelayRule(): Promise<void> {
    const { n, min, max } = await inquirer.prompt([
      {
        type: 'number',
        name: 'n',
        message: 'Apply delay every N messages:',
        default: 10,
        validate: (input: number) => input > 0 ? true : 'N must be greater than 0'
      },
      {
        type: 'number',
        name: 'min',
        message: 'Minimum delay duration (seconds):',
        default: 30,
        validate: (input: number) => input >= 1 ? true : 'Minimum delay must be at least 1 second'
      },
      {
        type: 'number',
        name: 'max',
        message: 'Maximum delay duration (seconds):',
        default: 60,
        validate: (input: number) => input >= 1 ? true : 'Maximum delay must be at least 1 second'
      }
    ]);

    // Validate that max delay is greater than min delay
    if (max <= min) {
      console.log('❌ Maximum delay must be greater than minimum delay');
      return;
    }

    const currentDelays = this.configManager.get('messaging').optionalDelays || [];
    const newDelay = { everyNMessages: { n, min, max } };
    
    // Add new delay rule
    currentDelays.push(newDelay);

    await this.configManager.updateConfig({
      messaging: {
        ...this.configManager.get('messaging'),
        optionalDelays: currentDelays
      }
    });

    console.log('✅ New delay rule added successfully!');
    console.log(`🔄 Delay every ${n} messages: ${min}-${max} seconds`);
    
    // Show updated list
    await this.updateOptionalDelays();
  }

  private async editExistingDelayRule(): Promise<void> {
    const currentDelays = this.configManager.get('messaging').optionalDelays || [];
    
    if (currentDelays.length === 0) {
      console.log('❌ No delay rules to edit');
      return;
    }
    
    const delayChoices = currentDelays.map((delay, index) => {
      if (delay.everyNMessages) {
        return {
          name: `Every ${delay.everyNMessages.n} messages: ${delay.everyNMessages.min}-${delay.everyNMessages.max} seconds`,
          value: index
        };
      }
      return null;
    }).filter(Boolean);
    
    const { selectedIndex } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedIndex',
        message: 'Select delay rule to edit:',
        choices: delayChoices
      }
    ]);
    
    const selectedDelay = currentDelays[selectedIndex];
    if (!selectedDelay.everyNMessages) return;
    
    const { n, min, max } = await inquirer.prompt([
      {
        type: 'number',
        name: 'n',
        message: 'Apply delay every N messages:',
        default: selectedDelay.everyNMessages.n,
        validate: (input: number) => input > 0 ? true : 'N must be greater than 0'
      },
      {
        type: 'number',
        name: 'min',
        message: 'Minimum delay duration (seconds):',
        default: selectedDelay.everyNMessages.min,
        validate: (input: number) => input >= 1 ? true : 'Minimum delay must be at least 1 second'
      },
      {
        type: 'number',
        name: 'max',
        message: 'Maximum delay duration (seconds):',
        default: selectedDelay.everyNMessages.max,
        validate: (input: number) => input >= 1 ? true : 'Maximum delay must be at least 1 second'
      }
    ]);

    // Validate that max delay is greater than min delay
    if (max <= min) {
      console.log('❌ Maximum delay must be greater than minimum delay');
      return;
    }

    // Update the selected delay rule
    currentDelays[selectedIndex] = { everyNMessages: { n, min, max } };
    
    await this.configManager.updateConfig({
      messaging: {
        ...this.configManager.get('messaging'),
        optionalDelays: currentDelays
      }
    });

    console.log('✅ Delay rule updated successfully!');
    console.log(`🔄 Delay every ${n} messages: ${min}-${max} seconds`);
    
    // Show updated list
    await this.updateOptionalDelays();
  }

  private async deleteDelayRule(): Promise<void> {
    const currentDelays = this.configManager.get('messaging').optionalDelays || [];
    
    if (currentDelays.length === 0) {
      console.log('❌ No delay rules to delete');
      return;
    }
    
    const delayChoices = currentDelays.map((delay, index) => {
      if (delay.everyNMessages) {
        return {
          name: `Every ${delay.everyNMessages.n} messages: ${delay.everyNMessages.min}-${delay.everyNMessages.max} seconds`,
          value: index
        };
      }
      return null;
    }).filter(Boolean);
    
    const { selectedIndex } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedIndex',
        message: 'Select delay rule to delete:',
        choices: delayChoices
      }
    ]);
    
    const deletedDelay = currentDelays[selectedIndex];
    if (!deletedDelay.everyNMessages) return;
    
    // Remove the selected delay rule
    currentDelays.splice(selectedIndex, 1);
    
    await this.configManager.updateConfig({
      messaging: {
        ...this.configManager.get('messaging'),
        optionalDelays: currentDelays
      }
    });

    console.log('✅ Delay rule deleted successfully!');
    console.log(`🗑️  Removed: Every ${deletedDelay.everyNMessages.n} messages: ${deletedDelay.everyNMessages.min}-${deletedDelay.everyNMessages.max} seconds`);
    
    // Show updated list
    await this.updateOptionalDelays();
  }

  private async clearAllDelays(): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all optional delays?',
        default: false
      }
    ]);
    
    if (confirm) {
      await this.configManager.updateConfig({
        messaging: {
          ...this.configManager.get('messaging'),
          optionalDelays: []
        }
      });
      
      console.log('✅ All optional delays cleared successfully!');
      
      // Show updated list
      await this.updateOptionalDelays();
    } else {
      console.log('❌ Operation cancelled');
    }
  }

  private async updateClientSettings(): Promise<void> {
    const { headless } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'headless',
        message: 'Run WhatsApp in headless mode? (no browser window)',
        default: this.configManager.get('client').headless
      }
    ]);

    await this.configManager.updateConfig({
      client: {
        headless,
        puppeteerArgs: this.configManager.get('client').puppeteerArgs,
        sessionTimeout: this.configManager.get('client').sessionTimeout
      }
    });

    console.log('✅ Client settings updated successfully!');
    console.log('⚠️  Note: Client settings changes require restart to take effect');
  }

  private async resetConfiguration(): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset all settings to defaults?',
        default: false
      }
    ]);

    if (confirm) {
      this.configManager = new ConfigManager();
      await this.configManager.saveConfig();
      console.log('✅ Configuration reset to defaults successfully!');
    } else {
      console.log('❌ Configuration reset cancelled');
    }
  }

  private async saveContacts(): Promise<void> {
    try {
      // First try to save to data/contacts/ folder (priority)
      try {
        const contactsFolderPath = path.join(__dirname, '../data/contacts');
        await fs.mkdir(contactsFolderPath, { recursive: true });
        const fileName = 'contacts.json';
        const filePath = path.join(contactsFolderPath, fileName);
        await fs.writeFile(filePath, JSON.stringify(this.contacts, null, 2));
        console.log(`✅ Contacts saved to data/contacts/${fileName}`);
      } catch (folderError) {
        // If folder save fails, try main contacts.json
        const contactsPath = path.join(__dirname, '../data/contacts.json');
        await fs.mkdir(path.dirname(contactsPath), { recursive: true });
        await fs.writeFile(contactsPath, JSON.stringify(this.contacts, null, 2));
        console.log('✅ Contacts saved to data/contacts.json (fallback)');
      }
    } catch (error) {
      console.error('❌ Failed to save contacts:', error);
    }
  }

  private async saveMessageTemplates(): Promise<void> {
    try {
      // First try to save to data/message-templates/ folder (priority)
      try {
        const templatesFolderPath = path.join(__dirname, '../data/message-templates');
        await fs.mkdir(templatesFolderPath, { recursive: true });
        const fileName = 'message-templates.json';
        const filePath = path.join(templatesFolderPath, fileName);
        await fs.writeFile(filePath, JSON.stringify(this.messageTemplates, null, 2));
        console.log(`✅ Message templates saved to data/message-templates/${fileName}`);
      } catch (folderError) {
        // If folder save fails, try main message-templates.json
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        await fs.mkdir(path.dirname(templatesPath), { recursive: true });
        await fs.writeFile(templatesPath, JSON.stringify(this.messageTemplates, null, 2));
        console.log('✅ Message templates saved to data/message-templates.json (fallback)');
      }
    } catch (error) {
      console.error('❌ Failed to save message templates:', error);
    }
  }

  public async destroy(): Promise<void> {
    try {
      await this.client.destroy();
      console.log('✅ WhatsApp client destroyed successfully');
    } catch (error) {
      console.error('❌ Error destroying WhatsApp client:', error);
    }
  }


}

async function main(): Promise<void> {
  const sender = new WhatsAppSender();
  
  // Set up signal handlers for graceful shutdown
  const setupSignalHandlers = () => {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Mark current session as interrupted if it exists
        if (sender.hasCurrentSession()) {
          console.log('📊 Marking current session as interrupted...');
          sender.interruptCurrentSession();
        }
        
        await sender.destroy();
        console.log('✅ Graceful shutdown completed');
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
      } finally {
        process.exit(0);
      }
    };

    // Set up signal handlers
    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT').catch(error => {
        console.error('❌ Error in SIGINT handler:', error);
        process.exit(1);
      });
    });
    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM').catch(error => {
        console.error('❌ Error in SIGTERM handler:', error);
        process.exit(1);
      });
    });
  };

  // Setup signal handlers
  setupSignalHandlers();
  
  try {
    await sender.initialize();
    await sender.startInteractiveMode();
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    // Always cleanup
    try {
    await sender.destroy();
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
