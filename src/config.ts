export interface WhatsAppConfig {
  // WhatsApp client settings
  client: {
    headless: boolean;
    puppeteerArgs: string[];
    sessionTimeout: number;
  };
  
  // Message settings
  messaging: {
    defaultMinDelay: number;
    defaultMaxDelay: number;
    quickBulkMinDelay: number;
    quickBulkMaxDelay: number;
    maxRetries: number;
    optionalDelays: {
      everyNMessages: {
        n: number;
        min: number;
        max: number;
      };
    }[];
  };
  
  // File paths
  paths: {
    contactsFolder: string;
    templatesFolder: string;
    sessionsFolder: string;
  };
  
  // Auto-save settings
  autoSave: {
    enabled: boolean;
    interval: number; // in seconds
    createBackups: boolean;
  };
  
  // Logging settings
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    showProgress: boolean;
    showTimestamps: boolean;
  };
}

export const defaultConfig: WhatsAppConfig = {
  client: {
    headless: false,
    puppeteerArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    sessionTimeout: 300000 // 5 minutes
  },
  
  messaging: {
    defaultMinDelay: 3,
    defaultMaxDelay: 8,
    quickBulkMinDelay: 2,
    quickBulkMaxDelay: 6,
    maxRetries: 3,
    optionalDelays: [
      {
        everyNMessages: {
          n: 10,
          min: 30,
          max: 60
        }
      }
    ]
  },
  
  paths: {
    contactsFolder: '../data/contacts',
    templatesFolder: '../data/message-templates',
    sessionsFolder: '../data/sessions'
  },
  
  autoSave: {
    enabled: true,
    interval: 30, // 30 seconds
    createBackups: true
  },
  
  logging: {
    level: 'info',
    showProgress: true,
    showTimestamps: true
  }
};

export class ConfigManager {
  private config: WhatsAppConfig;
  private configPath: string;
  
  constructor() {
    this.config = { ...defaultConfig };
    this.configPath = require('path').join(__dirname, '../config.json');
  }
  
  async loadConfig(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const savedConfig = JSON.parse(configData);
      
      // Merge saved config with defaults
      this.config = this.mergeConfigs(defaultConfig, savedConfig);
      console.log('✅ Configuration loaded from config.json');
    } catch (error) {
      console.log('📝 No config file found, using default configuration');
      await this.saveConfig();
    }
  }
  
  async saveConfig(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      
      // Save config
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Configuration saved to config.json');
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
    }
  }
  
  async updateConfig(updates: Partial<WhatsAppConfig>): Promise<void> {
    this.config = this.mergeConfigs(this.config, updates);
    await this.saveConfig();
  }
  
  private mergeConfigs(defaults: WhatsAppConfig, updates: Partial<WhatsAppConfig>): WhatsAppConfig {
    const merged = { ...defaults };
    
    for (const key in updates) {
      const typedKey = key as keyof WhatsAppConfig;
      const updateValue = updates[typedKey];
      
      if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
        // Handle nested objects with proper typing
        switch (typedKey) {
          case 'client':
            (merged as any)[typedKey] = { ...merged.client, ...updateValue };
            break;
          case 'messaging':
            (merged as any)[typedKey] = { ...merged.messaging, ...updateValue };
            break;
          case 'paths':
            (merged as any)[typedKey] = { ...merged.paths, ...updateValue };
            break;
          case 'autoSave':
            (merged as any)[typedKey] = { ...merged.autoSave, ...updateValue };
            break;
          case 'logging':
            (merged as any)[typedKey] = { ...merged.logging, ...updateValue };
            break;
          default:
            (merged as any)[typedKey] = updateValue;
        }
      } else {
        (merged as any)[typedKey] = updateValue;
      }
    }
    
    return merged;
  }
  
  getConfig(): WhatsAppConfig {
    return { ...this.config };
  }
  
  get<K extends keyof WhatsAppConfig>(key: K): WhatsAppConfig[K] {
    return this.config[key];
  }
  
  set<K extends keyof WhatsAppConfig>(key: K, value: WhatsAppConfig[K]): void {
    this.config[key] = value;
  }
}
