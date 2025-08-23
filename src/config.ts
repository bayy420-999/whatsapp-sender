export interface WhatsAppClient {
  id: string;
  name: string;
  headless: boolean;
  puppeteerArgs: string[];
  userDataDir: string;
  sessionTimeout: number;
  clientId: string;
  device: {
    name: string;
    browser: string;
    userAgent: string;
  };
}

export interface WhatsAppConfig {
  // WhatsApp client settings - single client per container
  client: WhatsAppClient;
  
  // Message settings
  messaging: {
    defaultMinDelay: number;
    defaultMaxDelay: number;
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
    id: 'wa-0',
    name: 'WhatsApp Session 0',
    headless: false,
    puppeteerArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=VizDisplayCompositor'
    ],
    userDataDir: '/app/browser-profiles/wa-0',
    sessionTimeout: 300000, // 5 minutes
    clientId: 'whatsapp-sender-wa-0',
    device: {
      name: 'Desktop',
      browser: 'Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  },
  
  messaging: {
    defaultMinDelay: 3,
    defaultMaxDelay: 8,
    maxRetries: 3,
    // Priority-based optional delays: larger 'n' values have higher priority
    // For message 10: uses 30-60s delay (every 10) instead of 20-30s (every 5)
    optionalDelays: [
      {
        everyNMessages: {
          n: 5,
          min: 20,
          max: 30
        }
      },
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
  
  constructor() {
    this.config = { ...defaultConfig };
  }
  
  async loadConfig(): Promise<void> {
    try {
      // In Docker mode, we don't load from external files
      // The config is provided via Docker configs
      console.log('✅ Configuration loaded from Docker config');
    } catch (error) {
      console.log('📝 Using default configuration');
    }
  }
  
  async saveConfig(): Promise<void> {
    // In Docker mode, we don't save to external files
    // Configuration changes are temporary and require container restart
    console.log('⚠️  Configuration changes require container restart to persist');
  }
  
  async updateConfig(updates: Partial<WhatsAppConfig>): Promise<void> {
    this.config = this.mergeConfigs(this.config, updates);
    console.log('✅ Configuration updated (temporary - restart required to persist)');
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

  // Client management methods
  getClient(): WhatsAppClient {
    return this.config.client;
  }

  updateClient(updates: Partial<WhatsAppClient>): void {
    this.config.client = { ...this.config.client, ...updates };
  }
}
