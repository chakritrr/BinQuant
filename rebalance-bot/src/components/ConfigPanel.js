import React from "react";
import { useRebalanceBot } from "../hooks/useRebalanceBot";
import { Settings, Play, Pause, RotateCcw } from "lucide-react";

const ConfigPanel = () => {
  const { state, updateConfig, resetBot } = useRebalanceBot();
  const { config } = state;

  const toggleBot = () => {
    updateConfig({ isActive: !config.isActive });
  };

  const handleConfigChange = (key, value) => {
    updateConfig({ [key]: value });
  };

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
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
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            รีเซ็ต
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            เปอร์เซ็นต์ Rebalance
          </label>
          <input
            type="number"
            value={config.rebalancePercentage}
            onChange={(e) =>
              handleConfigChange(
                "rebalancePercentage",
                parseFloat(e.target.value)
              )
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0.1"
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
            onChange={(e) => handleConfigChange("mainCoin", e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="BNB">Binance Coin (BNB)</option>
            <option value="ADA">Cardano (ADA)</option>
            <option value="DOT">Polkadot (DOT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            เหรียญรอง/Stable
          </label>
          <select
            value={config.secondaryCoin}
            onChange={(e) =>
              handleConfigChange("secondaryCoin", e.target.value)
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USDT">Tether (USDT)</option>
            <option value="BUSD">Binance USD (BUSD)</option>
            <option value="USDC">USD Coin (USDC)</option>
            <option value="DAI">Dai (DAI)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            จำนวนเงินขั้นต่ำ ($)
          </label>
          <input
            type="number"
            value={config.minTradeAmount}
            onChange={(e) =>
              handleConfigChange("minTradeAmount", parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="1000"
            step="1"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
