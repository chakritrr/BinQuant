/**
 * Dashboard Component
 * หน้า Dashboard ที่รวมระบบ STREAK
 */

import tradingService from '../../services/tradingService.js';

export class Dashboard {
  constructor(containerId = 'dashboard') {
    this.container = document.getElementById(containerId);
    this.tradingService = tradingService;
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.startAutoUpdate();
  }

  render() {
    const stats = this.tradingService.getTradingStats();
    
    this.container.innerHTML = `
      <div class="p-6">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Trading Dashboard</h1>
          <p class="text-gray-600">ระบบบริหารเงินแบบ STREAK และการจัดการความเสี่ยง</p>
        </div>

        <!-- Trading Controls -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-800">Trading Controls</h2>
            <div class="flex space-x-4">
              <button id="startTrading" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <i class="fas fa-play mr-2"></i>Start Trading
              </button>
              <button id="stopTrading" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                <i class="fas fa-stop mr-2"></i>Stop Trading
              </button>
              <button id="resetSystem" class="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                <i class="fas fa-refresh mr-2"></i>Reset
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold ${stats.isRunning ? 'text-green-600' : 'text-red-600'}">
                ${stats.isRunning ? '🟢 Running' : '🔴 Stopped'}
              </div>
              <div class="text-sm text-gray-600 mt-1">Trading Status</div>
            </div>
            
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold ${stats.hasPosition ? 'text-blue-600' : 'text-gray-600'}">
                ${stats.hasPosition ? '📊 Active' : '📊 No Position'}
              </div>
              <div class="text-sm text-gray-600 mt-1">Position Status</div>
            </div>
            
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">
                $${stats.currentOrderValue}
              </div>
              <div class="text-sm text-gray-600 mt-1">Next Order Value</div>
            </div>
          </div>
        </div>

        <!-- STREAK Management -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- STREAK Configuration -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">STREAK Configuration</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Current Streak:</span>
                <span class="font-semibold text-blue-600">${stats.currentStreak + 1}/${stats.config.maxStreak}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Streak Sizes:</span>
                <span class="font-semibold text-gray-800">$${stats.config.streakSizes.join(' → $')}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Recovery Mode:</span>
                <span class="font-semibold ${stats.isRecoveryMode ? 'text-orange-600' : 'text-green-600'}">
                  ${stats.isRecoveryMode ? '🔄 Active' : '✅ Normal'}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Volatility Index:</span>
                <span class="font-semibold text-purple-600">${stats.volatilityIndex}</span>
              </div>
            </div>
            
            <!-- STREAK Progress -->
            <div class="mt-6">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>STREAK Progress</span>
                <span>${stats.currentStreak + 1}/${stats.config.maxStreak}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                     style="width: ${((stats.currentStreak + 1) / stats.config.maxStreak) * 100}%"></div>
              </div>
            </div>
          </div>

          <!-- Risk Management -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Risk Management</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Total Loss:</span>
                <span class="font-semibold text-red-600">$${stats.totalLossAmount}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Daily Loss:</span>
                <span class="font-semibold text-orange-600">$${stats.dailyLoss}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Consecutive Losses:</span>
                <span class="font-semibold text-red-600">${stats.consecutiveLosses}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Max Total Loss:</span>
                <span class="font-semibold text-gray-800">$${stats.config.maxTotalLoss}</span>
              </div>
            </div>
            
            <!-- Risk Progress -->
            <div class="mt-6 space-y-3">
              <div>
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Total Loss Progress</span>
                  <span>${((stats.totalLossAmount / stats.config.maxTotalLoss) * 100).toFixed(1)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-red-500 h-2 rounded-full transition-all duration-300" 
                       style="width: ${Math.min((stats.totalLossAmount / stats.config.maxTotalLoss) * 100, 100)}%"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Daily Loss Progress</span>
                  <span>${((stats.dailyLoss / stats.config.maxDailyLoss) * 100).toFixed(1)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                       style="width: ${Math.min((stats.dailyLoss / stats.config.maxDailyLoss) * 100, 100)}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Total Profit/Loss</p>
                <p class="text-2xl font-bold ${parseFloat(stats.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}">
                  $${stats.profitLoss}
                </p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-chart-line text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Win Rate</p>
                <p class="text-2xl font-bold text-blue-600">${stats.winRate}%</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-trophy text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Total Trades</p>
                <p class="text-2xl font-bold text-gray-800">${stats.totalTrades}</p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-exchange-alt text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Last Result</p>
                <p class="text-2xl font-bold ${stats.lastTradeResult === 'WIN' ? 'text-green-600' : stats.lastTradeResult === 'LOSS' ? 'text-red-600' : 'text-gray-600'}">
                  ${stats.lastTradeResult || 'N/A'}
                </p>
              </div>
              <div class="bg-gray-100 p-3 rounded-full">
                <i class="fas fa-clock text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Trade History -->
        <div class="bg-white rounded-xl shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">Recent Trade History</h3>
          </div>
          <div class="p-6">
            <div id="tradeHistory" class="space-y-3">
              <!-- Trade history will be populated here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Start Trading
    document.getElementById('startTrading')?.addEventListener('click', async () => {
      const success = await this.tradingService.startTrading();
      if (success) {
        this.updateDisplay();
      }
    });

    // Stop Trading
    document.getElementById('stopTrading')?.addEventListener('click', async () => {
      const success = await this.tradingService.stopTrading();
      if (success) {
        this.updateDisplay();
      }
    });

    // Reset System
    document.getElementById('resetSystem')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the system? This will clear all statistics.')) {
        this.tradingService.reset();
        this.updateDisplay();
      }
    });
  }

  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.updateDisplay();
    }, 2000); // อัปเดตทุก 2 วินาที
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateDisplay() {
    const stats = this.tradingService.getTradingStats();
    
    // อัปเดตสถานะการเทรด
    const statusElement = document.querySelector('#startTrading')?.parentElement?.previousElementSibling;
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="text-2xl font-bold ${stats.isRunning ? 'text-green-600' : 'text-red-600'}">
          ${stats.isRunning ? '🟢 Running' : '🔴 Stopped'}
        </div>
        <div class="text-sm text-gray-600 mt-1">Trading Status</div>
      `;
    }

    // อัปเดต position status
    const positionElement = document.querySelector('#startTrading')?.parentElement?.nextElementSibling;
    if (positionElement) {
      positionElement.innerHTML = `
        <div class="text-2xl font-bold ${stats.hasPosition ? 'text-blue-600' : 'text-gray-600'}">
          ${stats.hasPosition ? '📊 Active' : '📊 No Position'}
        </div>
        <div class="text-sm text-gray-600 mt-1">Position Status</div>
      `;
    }

    // อัปเดต next order value
    const orderValueElement = document.querySelector('#startTrading')?.parentElement?.nextElementSibling?.nextElementSibling;
    if (orderValueElement) {
      orderValueElement.innerHTML = `
        <div class="text-2xl font-bold text-purple-600">
          $${stats.currentOrderValue}
        </div>
        <div class="text-sm text-gray-600 mt-1">Next Order Value</div>
      `;
    }

    // อัปเดต trade history
    this.updateTradeHistory();
  }

  updateTradeHistory() {
    const tradeHistoryContainer = document.getElementById('tradeHistory');
    if (!tradeHistoryContainer) return;

    const stats = this.tradingService.getTradingStats();
    const recentTrades = this.tradingService.moneyManagement.state.tradeHistory.slice(-5).reverse();

    if (recentTrades.length === 0) {
      tradeHistoryContainer.innerHTML = '<p class="text-gray-500 text-center">No trades yet</p>';
      return;
    }

    tradeHistoryContainer.innerHTML = recentTrades.map(trade => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full ${trade.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'}"></div>
          <div>
            <div class="font-medium ${trade.result === 'WIN' ? 'text-green-600' : 'text-red-600'}">
              ${trade.result}
            </div>
            <div class="text-sm text-gray-500">
              ${new Date(trade.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
            $${trade.profitLoss.toFixed(2)}
          </div>
          <div class="text-sm text-gray-500">
            Streak: ${trade.streak + 1}
          </div>
        </div>
      </div>
    `).join('');
  }

  destroy() {
    this.stopAutoUpdate();
  }
}

export default Dashboard; 