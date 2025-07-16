import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

const RebalanceBot = () => {
  const [config, setConfig] = useState({
    rebalancePercentage: 5,
    mainCoin: "BTC",
    secondaryCoin: "USDT",
    isActive: false,
    currentPrice: 45000,
    targetPrice: 45000,
    mainCoinBalance: 0.5,
    secondaryCoinBalance: 22500,
    totalValue: 45000,
  });

  const [logs, setLogs] = useState([]);
  const [priceHistory, setPriceHistory] = useState([45000]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitLoss: 0,
    lastRebalance: null,
  });

  // จำลองการเคลื่อนไหวของราคา
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.isActive) {
        const volatility = 0.02; // 2% volatility
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = config.currentPrice * (1 + randomChange);

        setConfig((prev) => ({
          ...prev,
          currentPrice: newPrice,
        }));

        setPriceHistory((prev) => [...prev.slice(-50), newPrice]);

        // ตรวจสอบเงื่อนไข rebalance
        checkRebalanceConditions(newPrice);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    config.isActive,
    config.currentPrice,
    config.targetPrice,
    config.rebalancePercentage,
  ]);

  const checkRebalanceConditions = (currentPrice) => {
    const priceChange =
      ((currentPrice - config.targetPrice) / config.targetPrice) * 100;
    const absChange = Math.abs(priceChange);

    if (absChange >= config.rebalancePercentage) {
      executeRebalance(currentPrice, priceChange);
    }
  };

  const executeRebalance = (currentPrice, priceChange) => {
    const timestamp = new Date().toLocaleTimeString();
    let action = "";
    let newMainBalance = config.mainCoinBalance;
    let newSecondaryBalance = config.secondaryCoinBalance;

    if (priceChange < 0) {
      // ราคาตก - ซื้อเหรียญหลักด้วย stable coin
      const buyAmount = config.secondaryCoinBalance * 0.5; // ใช้ 50% ของ secondary coin
      const coinsToBuy = buyAmount / currentPrice;

      newMainBalance += coinsToBuy;
      newSecondaryBalance -= buyAmount;

      action = `📉 ราคาตก ${Math.abs(priceChange).toFixed(
        2
      )}% - ซื้อ ${coinsToBuy.toFixed(6)} ${config.mainCoin}`;
    } else {
      // ราคาขึ้น - ขายเหรียญหลักเป็น stable coin
      const sellAmount = config.mainCoinBalance * 0.5; // ขาย 50% ของ main coin
      const cashReceived = sellAmount * currentPrice;

      newMainBalance -= sellAmount;
      newSecondaryBalance += cashReceived;

      action = `📈 ราคาขึ้น ${priceChange.toFixed(
        2
      )}% - ขาย ${sellAmount.toFixed(6)} ${config.mainCoin}`;
    }

    // อัปเดต state
    setConfig((prev) => ({
      ...prev,
      mainCoinBalance: newMainBalance,
      secondaryCoinBalance: newSecondaryBalance,
      targetPrice: currentPrice,
      totalValue: newMainBalance * currentPrice + newSecondaryBalance,
    }));

    // เพิ่ม log
    const logEntry = {
      timestamp,
      action,
      price: currentPrice,
      mainBalance: newMainBalance,
      secondaryBalance: newSecondaryBalance,
    };

    setLogs((prev) => [logEntry, ...prev.slice(0, 9)]);

    // อัปเดต stats
    setStats((prev) => ({
      ...prev,
      totalTrades: prev.totalTrades + 1,
      lastRebalance: timestamp,
      profitLoss: newMainBalance * currentPrice + newSecondaryBalance - 45000,
    }));
  };

  const toggleBot = () => {
    setConfig((prev) => ({
      ...prev,
      isActive: !prev.isActive,
    }));
  };

  const resetBot = () => {
    setConfig((prev) => ({
      ...prev,
      isActive: false,
      currentPrice: 45000,
      targetPrice: 45000,
      mainCoinBalance: 0.5,
      secondaryCoinBalance: 22500,
      totalValue: 45000,
    }));
    setLogs([]);
    setStats({
      totalTrades: 0,
      profitLoss: 0,
      lastRebalance: null,
    });
    setPriceHistory([45000]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🤖 Crypto Rebalance Bot
          </h1>
          <p className="text-blue-200">
            ระบบ Auto Rebalance สำหรับคริปโต - รองรับ Binance Spot
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              การตั้งค่า
            </h2>
            <div className="flex gap-2">
              <button
                onClick={toggleBot}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  config.isActive
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {config.isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {config.isActive ? "หยุด" : "เริ่ม"}
              </button>
              <button
                onClick={resetBot}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                รีเซ็ต
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เปอร์เซ็นต์ Rebalance
              </label>
              <input
                type="number"
                value={config.rebalancePercentage}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rebalancePercentage: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เหรียญหลัก
              </label>
              <select
                value={config.mainCoin}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    mainCoin: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BNB">Binance Coin (BNB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เหรียญรอง/Stable
              </label>
              <select
                value={config.secondaryCoin}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    secondaryCoin: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USDT">Tether (USDT)</option>
                <option value="BUSD">Binance USD (BUSD)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">สถานะ</p>
                <p
                  className={`text-lg font-semibold ${
                    config.isActive ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {config.isActive ? "🟢 ทำงาน" : "🔴 หยุด"}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">ราคาปัจจุบัน</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(config.currentPrice)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">จำนวน Trade</p>
                <p className="text-lg font-semibold text-white">
                  {stats.totalTrades}
                </p>
              </div>
              <RotateCcw className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">กำไร/ขาดทุน</p>
                <p
                  className={`text-lg font-semibold ${
                    stats.profitLoss >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(stats.profitLoss)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Portfolio Balance */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">ยอดคงเหลือ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-200">{config.mainCoin}</p>
              <p className="text-2xl font-bold text-white">
                {config.mainCoinBalance.toFixed(6)}
              </p>
              <p className="text-sm text-gray-300">
                ≈ {formatCurrency(config.mainCoinBalance * config.currentPrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-200">{config.secondaryCoin}</p>
              <p className="text-2xl font-bold text-white">
                {config.secondaryCoinBalance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-300">
                ≈ {formatCurrency(config.secondaryCoinBalance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-200">มูลค่ารวม</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(config.totalValue)}
              </p>
              <p className="text-sm text-gray-300">Portfolio Value</p>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">
            บันทึกกิจกรรม
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                ยังไม่มีกิจกรรม - เริ่มบอทเพื่อดูการทำงาน
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{log.action}</span>
                    <span className="text-sm text-gray-300">
                      {log.timestamp}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    ราคา: {formatCurrency(log.price)} |{config.mainCoin}:{" "}
                    {log.mainBalance.toFixed(6)} |{config.secondaryCoin}:{" "}
                    {log.secondaryBalance.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebalanceBot;
