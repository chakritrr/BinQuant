/**
 * Money Management System with Advanced STREAK Strategy
 * ระบบบริหารเงินแบบ STREAK ที่ปรับปรุงแล้ว
 */

export class MoneyManagement {
  constructor(config = {}) {
    this.config = {
      // STREAK Configuration
      streakSizes: config.streakSizes || [1.0, 1.5, 2.5, 4.0, 6.5], // ขนาด order แต่ละ streak
      maxStreak: config.maxStreak || 5, // จำนวนครั้งสูงสุด
      baseAmount: config.baseAmount || 1.0, // จำนวนเงินเริ่มต้น
      maxTotalLoss: config.maxTotalLoss || 50.0, // จำนวนเงินสูญเสียสูงสุด
      winMultiplier: config.winMultiplier || 1.2, // ตัวคูณเมื่อชนะ
      lossMultiplier: config.lossMultiplier || 1.5, // ตัวคูณเมื่อแพ้
      
      // Risk Management
      maxDailyLoss: config.maxDailyLoss || 20.0, // จำนวนเงินสูญเสียต่อวันสูงสุด
      maxConsecutiveLosses: config.maxConsecutiveLosses || 7, // จำนวนการแพ้ติดต่อกันสูงสุด
      
      // Recovery Settings
      recoveryMode: config.recoveryMode || true, // เปิดโหมดกู้คืน
      recoveryMultiplier: config.recoveryMultiplier || 0.8, // ตัวคูณในโหมดกู้คืน
      
      // Advanced Settings
      dynamicSizing: config.dynamicSizing || true, // ปรับขนาดตามผลการเทรด
      volatilityAdjustment: config.volatilityAdjustment || true, // ปรับตามความผันผวน
      
      ...config
    };

    this.state = {
      currentStreak: 0, // index ใน array streakSizes
      currentOrderValue: this.config.streakSizes[0],
      totalLossAmount: 0,
      totalWinAmount: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      dailyLoss: 0,
      lastTradeResult: null,
      isRecoveryMode: false,
      tradeHistory: [],
      volatilityIndex: 1.0,
      lastResetDate: new Date().toDateString()
    };
  }

  /**
   * อัปเดต STREAK ตามผลการเทรด
   * @param {string} tradeResult - 'WIN' หรือ 'LOSS'
   * @param {number} profitLoss - จำนวนเงินที่ได้/เสีย
   * @param {object} tradeData - ข้อมูลการเทรดเพิ่มเติม
   */
  updateStreak(tradeResult, profitLoss = 0, tradeData = {}) {
    const tradeRecord = {
      result: tradeResult,
      profitLoss,
      orderValue: this.state.currentOrderValue,
      streak: this.state.currentStreak,
      timestamp: new Date(),
      ...tradeData
    };

    this.state.tradeHistory.push(tradeRecord);
    this.state.lastTradeResult = tradeResult;

    if (tradeResult === 'WIN') {
      this.handleWin(profitLoss);
    } else if (tradeResult === 'LOSS') {
      this.handleLoss(profitLoss);
    }

    // อัปเดต daily loss
    this.updateDailyLoss(profitLoss);
    
    // ตรวจสอบและรีเซ็ต daily loss
    this.checkDailyReset();
    
    // อัปเดต volatility index
    this.updateVolatilityIndex();
    
    // บันทึก state
    this.saveState();
    
    return this.getNextOrderValue();
  }

  /**
   * จัดการเมื่อชนะ
   */
  handleWin(profitLoss) {
    console.log(`🎉 WIN! Profit: $${profitLoss}`);
    
    this.state.totalWinAmount += profitLoss;
    this.state.consecutiveWins++;
    this.state.consecutiveLosses = 0;
    
    // รีเซ็ต STREAK เมื่อชนะ
    if (this.state.currentStreak > 0) {
      console.log(`📈 Resetting streak from ${this.state.currentStreak} to 0`);
      this.state.currentStreak = 0;
      this.state.currentOrderValue = this.config.streakSizes[0];
    }
    
    // ปิดโหมดกู้คืนเมื่อชนะ
    if (this.state.isRecoveryMode) {
      console.log(`🔄 Exiting recovery mode`);
      this.state.isRecoveryMode = false;
    }
    
    // ปรับขนาด order ตามผลการชนะ
    if (this.config.dynamicSizing && this.state.consecutiveWins > 2) {
      const newValue = this.state.currentOrderValue * this.config.winMultiplier;
      this.state.currentOrderValue = Math.min(newValue, this.config.streakSizes[0] * 3);
    }
  }

  /**
   * จัดการเมื่อแพ้
   */
  handleLoss(profitLoss) {
    const lossAmount = Math.abs(profitLoss);
    console.log(`💸 LOSS! Lost: $${lossAmount}`);
    
    this.state.totalLossAmount += lossAmount;
    this.state.consecutiveLosses++;
    this.state.consecutiveWins = 0;
    
    // เพิ่ม STREAK เมื่อแพ้
    if (this.state.currentStreak < this.config.maxStreak - 1) {
      this.state.currentStreak++;
      this.state.currentOrderValue = this.config.streakSizes[this.state.currentStreak];
      console.log(`📈 Loss streak increased to ${this.state.currentStreak + 1}, next order: $${this.state.currentOrderValue}`);
    } else {
      console.log(`⚠️ Max streak reached (${this.config.maxStreak}), keeping same order size`);
    }
    
    // ตรวจสอบการเข้าสู่โหมดกู้คืน
    this.checkRecoveryMode();
    
    // ตรวจสอบการหยุดการเทรด
    this.checkStopTrading();
  }

  /**
   * ตรวจสอบโหมดกู้คืน
   */
  checkRecoveryMode() {
    if (this.config.recoveryMode && this.state.consecutiveLosses >= 3) {
      if (!this.state.isRecoveryMode) {
        console.log(`🔄 Entering recovery mode`);
        this.state.isRecoveryMode = true;
      }
      
      // ลดขนาด order ในโหมดกู้คืน
      this.state.currentOrderValue *= this.config.recoveryMultiplier;
    }
  }

  /**
   * ตรวจสอบการหยุดการเทรด
   */
  checkStopTrading() {
    const shouldStop = 
      this.state.totalLossAmount >= this.config.maxTotalLoss ||
      this.state.dailyLoss >= this.config.maxDailyLoss ||
      this.state.consecutiveLosses >= this.config.maxConsecutiveLosses;
    
    if (shouldStop) {
      console.log(`🚫 STOP TRADING: ${this.getStopReason()}`);
      return true;
    }
    return false;
  }

  /**
   * ได้เหตุผลที่หยุดการเทรด
   */
  getStopReason() {
    if (this.state.totalLossAmount >= this.config.maxTotalLoss) {
      return `Total loss limit reached: $${this.state.totalLossAmount}`;
    }
    if (this.state.dailyLoss >= this.config.maxDailyLoss) {
      return `Daily loss limit reached: $${this.state.dailyLoss}`;
    }
    if (this.state.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      return `Max consecutive losses reached: ${this.state.consecutiveLosses}`;
    }
    return 'Unknown reason';
  }

  /**
   * อัปเดต daily loss
   */
  updateDailyLoss(profitLoss) {
    if (profitLoss < 0) {
      this.state.dailyLoss += Math.abs(profitLoss);
    }
  }

  /**
   * ตรวจสอบและรีเซ็ต daily loss
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (today !== this.state.lastResetDate) {
      console.log(`📅 Daily reset: ${this.state.lastResetDate} -> ${today}`);
      this.state.dailyLoss = 0;
      this.state.lastResetDate = today;
    }
  }

  /**
   * อัปเดต volatility index
   */
  updateVolatilityIndex() {
    if (!this.config.volatilityAdjustment) return;
    
    const recentTrades = this.state.tradeHistory.slice(-10);
    if (recentTrades.length < 5) return;
    
    const losses = recentTrades.filter(t => t.result === 'LOSS').length;
    const winRate = (recentTrades.length - losses) / recentTrades.length;
    
    // ปรับ volatility index ตาม win rate
    if (winRate < 0.3) {
      this.state.volatilityIndex = 0.7; // ลดขนาดเมื่อ win rate ต่ำ
    } else if (winRate > 0.7) {
      this.state.volatilityIndex = 1.2; // เพิ่มขนาดเมื่อ win rate สูง
    } else {
      this.state.volatilityIndex = 1.0; // ค่าเริ่มต้น
    }
  }

  /**
   * ได้ขนาด order ถัดไป
   */
  getNextOrderValue() {
    let orderValue = this.state.currentOrderValue;
    
    // ปรับตาม volatility
    if (this.config.volatilityAdjustment) {
      orderValue *= this.state.volatilityIndex;
    }
    
    // ปรับในโหมดกู้คืน
    if (this.state.isRecoveryMode) {
      orderValue *= this.config.recoveryMultiplier;
    }
    
    return Math.max(orderValue, this.config.baseAmount * 0.1); // ขั้นต่ำ 10% ของ base amount
  }

  /**
   * รีเซ็ตระบบ
   */
  reset() {
    console.log('🔄 Resetting money management system');
    this.state = {
      currentStreak: 0,
      currentOrderValue: this.config.streakSizes[0],
      totalLossAmount: 0,
      totalWinAmount: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      dailyLoss: 0,
      lastTradeResult: null,
      isRecoveryMode: false,
      tradeHistory: [],
      volatilityIndex: 1.0,
      lastResetDate: new Date().toDateString()
    };
    this.saveState();
  }

  /**
   * ได้สถิติปัจจุบัน
   */
  getStats() {
    return {
      currentStreak: this.state.currentStreak,
      currentOrderValue: this.state.currentOrderValue,
      totalLossAmount: this.state.totalLossAmount,
      totalWinAmount: this.state.totalWinAmount,
      consecutiveLosses: this.state.consecutiveLosses,
      consecutiveWins: this.state.consecutiveWins,
      dailyLoss: this.state.dailyLoss,
      isRecoveryMode: this.state.isRecoveryMode,
      volatilityIndex: this.state.volatilityIndex,
      totalTrades: this.state.tradeHistory.length,
      winRate: this.calculateWinRate(),
      profitLoss: this.state.totalWinAmount - this.state.totalLossAmount
    };
  }

  /**
   * คำนวณ win rate
   */
  calculateWinRate() {
    if (this.state.tradeHistory.length === 0) return 0;
    const wins = this.state.tradeHistory.filter(t => t.result === 'WIN').length;
    return (wins / this.state.tradeHistory.length) * 100;
  }

  /**
   * บันทึก state
   */
  saveState() {
    // ในที่นี้จะบันทึกลง localStorage หรือ database
    try {
      localStorage.setItem('moneyManagementState', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * โหลด state
   */
  loadState() {
    try {
      const savedState = localStorage.getItem('moneyManagementState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // แปลงวันที่กลับมาเป็น Date object
        if (parsedState.lastResetDate) {
          parsedState.lastResetDate = new Date(parsedState.lastResetDate).toDateString();
        }
        this.state = { ...this.state, ...parsedState };
        console.log('✅ Loaded saved state');
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  /**
   * ได้ข้อมูลสำหรับแสดงผล
   */
  getDisplayData() {
    const stats = this.getStats();
    return {
      currentOrderValue: stats.currentOrderValue.toFixed(2),
      totalLossAmount: stats.totalLossAmount.toFixed(2),
      totalWinAmount: stats.totalWinAmount.toFixed(2),
      profitLoss: stats.profitLoss.toFixed(2),
      winRate: stats.winRate.toFixed(1),
      consecutiveLosses: stats.consecutiveLosses,
      consecutiveWins: stats.consecutiveWins,
      dailyLoss: stats.dailyLoss.toFixed(2),
      isRecoveryMode: stats.isRecoveryMode,
      currentStreak: stats.currentStreak,
      volatilityIndex: stats.volatilityIndex.toFixed(2),
      totalTrades: stats.totalTrades
    };
  }
}

// Export default instance
export default new MoneyManagement(); 