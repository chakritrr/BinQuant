/**
 * Trading Service
 * บริการจัดการการเทรด
 */

import { TRADING_CONFIG } from '../config/tradingConfig.js';
import { MoneyManagement } from '../utils/moneyManagement.js';

export class TradingService {
  constructor() {
    this.config = TRADING_CONFIG;
    this.moneyManagement = new MoneyManagement(this.config.MONEY_MANAGEMENT);
    this.isRunning = false;
    this.currentState = {
      hasPosition: false,
      entryPrice: null,
      entryTime: null,
      currentOrderValue: this.moneyManagement.getNextOrderValue(),
      lastTradeResult: null
    };
  }

  /**
   * เริ่มต้นการเทรด
   */
  async startTrading() {
    if (this.isRunning) {
      console.log('⚠️ Trading is already running');
      return false;
    }

    try {
      console.log('🚀 Starting trading service...');
      
      // โหลด state ที่บันทึกไว้
      this.moneyManagement.loadState();
      
      // ตรวจสอบสถานะปัจจุบัน
      await this.checkCurrentPosition();
      
      this.isRunning = true;
      console.log('✅ Trading service started successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start trading service:', error);
      return false;
    }
  }

  /**
   * หยุดการเทรด
   */
  async stopTrading() {
    if (!this.isRunning) {
      console.log('⚠️ Trading is not running');
      return false;
    }

    try {
      console.log('🛑 Stopping trading service...');
      
      // ปิด position ทั้งหมด
      await this.closeAllPositions();
      
      this.isRunning = false;
      console.log('✅ Trading service stopped successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to stop trading service:', error);
      return false;
    }
  }

  /**
   * ตรวจสอบ position ปัจจุบัน
   */
  async checkCurrentPosition() {
    try {
      // จำลองการตรวจสอบ position
      const hasPosition = Math.random() > 0.5; // จำลอง 50/50
      
      this.currentState.hasPosition = hasPosition;
      
      if (hasPosition) {
        this.currentState.entryPrice = 45000 + Math.random() * 5000;
        this.currentState.entryTime = new Date();
        console.log(`📊 Current position: Entry at $${this.currentState.entryPrice}`);
      } else {
        console.log('📊 No current position');
      }
      
      return hasPosition;
    } catch (error) {
      console.error('❌ Failed to check position:', error);
      return false;
    }
  }

  /**
   * สร้าง order ใหม่
   */
  async createOrder(orderType = 'BUY', quantity = null) {
    try {
      if (!this.isRunning) {
        throw new Error('Trading service is not running');
      }

      // ใช้ขนาด order จาก money management
      const orderValue = quantity || this.moneyManagement.getNextOrderValue();
      
      // จำลองการสร้าง order
      const order = {
        id: `ORDER_${Date.now()}`,
        type: orderType,
        symbol: this.config.BINANCE.SYMBOL,
        quantity: orderValue,
        price: 45000 + Math.random() * 5000,
        timestamp: new Date(),
        status: 'PENDING'
      };

      console.log(`📝 Created ${orderType} order: $${orderValue} at $${order.price}`);
      
      // จำลองการ fill order
      setTimeout(() => {
        this.simulateOrderFill(order);
      }, 2000);

      return order;
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw error;
    }
  }

  /**
   * จำลองการ fill order
   */
  simulateOrderFill(order) {
    try {
      order.status = 'FILLED';
      order.fillPrice = order.price + (Math.random() - 0.5) * 100;
      
      console.log(`✅ Order filled: ${order.type} ${order.quantity} at $${order.fillPrice}`);
      
      // อัปเดต state
      this.currentState.hasPosition = order.type === 'BUY';
      this.currentState.entryPrice = order.fillPrice;
      this.currentState.entryTime = new Date();
      
      // จำลองการปิด position
      setTimeout(() => {
        this.simulatePositionClose(order);
      }, 5000 + Math.random() * 10000);
      
    } catch (error) {
      console.error('❌ Failed to simulate order fill:', error);
    }
  }

  /**
   * จำลองการปิด position
   */
  simulatePositionClose(order) {
    try {
      const currentPrice = order.fillPrice + (Math.random() - 0.5) * 2000;
      const profitLoss = (currentPrice - order.fillPrice) * order.quantity;
      const tradeResult = profitLoss > 0 ? 'WIN' : 'LOSS';
      
      console.log(`📊 Position closed: ${tradeResult} $${Math.abs(profitLoss).toFixed(2)}`);
      
      // อัปเดต money management
      const nextOrderValue = this.moneyManagement.updateStreak(tradeResult, profitLoss, {
        orderId: order.id,
        entryPrice: order.fillPrice,
        exitPrice: currentPrice,
        quantity: order.quantity
      });
      
      // อัปเดต state
      this.currentState.hasPosition = false;
      this.currentState.entryPrice = null;
      this.currentState.entryTime = null;
      this.currentState.currentOrderValue = nextOrderValue;
      this.currentState.lastTradeResult = tradeResult;
      
      // ตรวจสอบการหยุดการเทรด
      if (this.moneyManagement.checkStopTrading()) {
        console.log('🚫 Trading stopped due to risk limits');
        this.stopTrading();
        return;
      }
      
      // สร้าง order ใหม่ถ้ายังไม่หยุด
      if (this.isRunning) {
        setTimeout(() => {
          this.createOrder('BUY');
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Failed to simulate position close:', error);
    }
  }

  /**
   * ปิด position ทั้งหมด
   */
  async closeAllPositions() {
    try {
      if (this.currentState.hasPosition) {
        console.log('🔄 Closing all positions...');
        this.currentState.hasPosition = false;
        this.currentState.entryPrice = null;
        this.currentState.entryTime = null;
        console.log('✅ All positions closed');
      }
    } catch (error) {
      console.error('❌ Failed to close positions:', error);
    }
  }

  /**
   * ได้สถิติการเทรด
   */
  getTradingStats() {
    const moneyStats = this.moneyManagement.getStats();
    const displayData = this.moneyManagement.getDisplayData();
    
    return {
      ...displayData,
      isRunning: this.isRunning,
      hasPosition: this.currentState.hasPosition,
      entryPrice: this.currentState.entryPrice,
      entryTime: this.currentState.entryTime,
      currentOrderValue: this.currentState.currentOrderValue,
      lastTradeResult: this.currentState.lastTradeResult,
      config: {
        streakSizes: this.config.MONEY_MANAGEMENT.STREAK_SIZES,
        maxStreak: this.config.MONEY_MANAGEMENT.MAX_STREAK,
        maxTotalLoss: this.config.MONEY_MANAGEMENT.MAX_TOTAL_LOSS,
        maxDailyLoss: this.config.MONEY_MANAGEMENT.MAX_DAILY_LOSS
      }
    };
  }

  /**
   * รีเซ็ตระบบ
   */
  reset() {
    console.log('🔄 Resetting trading service...');
    this.moneyManagement.reset();
    this.currentState = {
      hasPosition: false,
      entryPrice: null,
      entryTime: null,
      currentOrderValue: this.moneyManagement.getNextOrderValue(),
      lastTradeResult: null
    };
    console.log('✅ Trading service reset successfully');
  }

  /**
   * อัปเดตการตั้งค่า
   */
  updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      this.moneyManagement = new MoneyManagement(this.config.MONEY_MANAGEMENT);
      console.log('✅ Configuration updated successfully');
    } catch (error) {
      console.error('❌ Failed to update configuration:', error);
    }
  }
}

// Export default instance
export default new TradingService(); 