import React from "react";
import { useRebalanceBot } from "../hooks/useRebalanceBot";
import ConfigPanel from "./ConfigPanel";
import Portfolio from "./Portfolio";
import ActivityLog from "./ActivityLog";
import { Activity, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

const Dashboard = () => {
  const { state } = useRebalanceBot();
  const { config, stats } = state;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          🤖 Crypto Rebalance Bot
        </h1>
        <p className="text-blue-200">
          ระบบ Auto Rebalance สำหรับคริปโต - รองรับ Binance Spot
        </p>
      </div>

      {/* Config Panel */}
      <ConfigPanel />

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
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

        <div className="glass-card p-4">
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

        <div className="glass-card p-4">
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

        <div className="glass-card p-4">
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

      {/* Portfolio */}
      <Portfolio />

      {/* Activity Log */}
      <ActivityLog />
    </div>
  );
};

export default Dashboard;
