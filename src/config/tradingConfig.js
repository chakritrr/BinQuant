/**
 * Trading Configuration
 * การตั้งค่าการเทรด
 */

export const TRADING_CONFIG = {
  // Binance API Configuration
  BINANCE: {
    BASE_URL: "https://testnet.binancefuture.com",
    SYMBOL: "BTCUSDT",
    LEVERAGE: 20,
    API_KEY: process.env.BINANCE_API_KEY || "your_api_key_here",
    API_SECRET: process.env.BINANCE_API_SECRET || "your_api_secret_here"
  },

  // Money Management Configuration
  MONEY_MANAGEMENT: {
    // STREAK Settings
    STREAK_SIZES: [1.0, 1.5, 2.5, 4.0, 6.5], // ขนาด order แต่ละ streak
    MAX_STREAK: 5, // จำนวนครั้งสูงสุด
    BASE_AMOUNT: 1.0, // จำนวนเงินเริ่มต้น
    
    // Risk Management
    MAX_TOTAL_LOSS: 50.0, // จำนวนเงินสูญเสียสูงสุด
    MAX_DAILY_LOSS: 20.0, // จำนวนเงินสูญเสียต่อวันสูงสุด
    MAX_CONSECUTIVE_LOSSES: 7, // จำนวนการแพ้ติดต่อกันสูงสุด
    
    // Multipliers
    WIN_MULTIPLIER: 1.2, // ตัวคูณเมื่อชนะ
    LOSS_MULTIPLIER: 1.5, // ตัวคูณเมื่อแพ้
    RECOVERY_MULTIPLIER: 0.8, // ตัวคูณในโหมดกู้คืน
    
    // Features
    RECOVERY_MODE: true, // เปิดโหมดกู้คืน
    DYNAMIC_SIZING: true, // ปรับขนาดตามผลการเทรด
    VOLATILITY_ADJUSTMENT: true, // ปรับตามความผันผวน
  },

  // Trading Strategy Configuration
  STRATEGY: {
    TP_PERCENT: 0.1, // +10% Take Profit
    SL_PERCENT: 0.05, // -5% Stop Loss
    TARGET_PRICE: 600000, // ราคาเป้าหมาย
    MIN_QUANTITY: 0.001, // จำนวนขั้นต่ำ
    MAX_QUANTITY: 1.0, // จำนวนสูงสุด
  },

  // Database Configuration
  DATABASE: {
    URI: process.env.MONGODB_URI || "mongodb://localhost:27017",
    DB_NAME: process.env.MONGODB_DB_NAME || "binanceBot",
    COLLECTIONS: {
      BOT_STATE: "botState",
      TRADES: "trades",
      STATS: "stats"
    }
  },

  // WebSocket Configuration
  WEBSOCKET: {
    RECONNECT_INTERVAL: 5000, // 5 seconds
    MAX_RECONNECT_ATTEMPTS: 10,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: "info", // debug, info, warn, error
    ENABLE_CONSOLE: true,
    ENABLE_FILE: false,
    LOG_FILE: "trading.log"
  },

  // Notification Configuration
  NOTIFICATIONS: {
    ENABLE_EMAIL: false,
    ENABLE_TELEGRAM: false,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    EMAIL_SMTP: {
      HOST: process.env.EMAIL_SMTP_HOST,
      PORT: process.env.EMAIL_SMTP_PORT,
      USER: process.env.EMAIL_SMTP_USER,
      PASS: process.env.EMAIL_SMTP_PASS
    }
  }
};

// Environment-specific configurations
export const getConfig = (environment = 'development') => {
  const baseConfig = { ...TRADING_CONFIG };
  
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        BINANCE: {
          ...baseConfig.BINANCE,
          BASE_URL: "https://fapi.binance.com" // Production URL
        },
        LOGGING: {
          ...baseConfig.LOGGING,
          LEVEL: "warn"
        }
      };
    
    case 'test':
      return {
        ...baseConfig,
        MONEY_MANAGEMENT: {
          ...baseConfig.MONEY_MANAGEMENT,
          BASE_AMOUNT: 0.1, // ใช้จำนวนน้อยในการทดสอบ
          MAX_TOTAL_LOSS: 5.0
        }
      };
    
    default:
      return baseConfig;
  }
};

export default TRADING_CONFIG; 