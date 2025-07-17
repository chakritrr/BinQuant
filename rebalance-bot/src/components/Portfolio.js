import React from "react";
import { useRebalanceBot } from "../hooks/useRebalanceBot";
import { formatCurrency, formatNumber } from "../utils/formatters";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Portfolio = () => {
  const { state } = useRebalanceBot();
  const { config, priceHistory } = state;

  const portfolioData = [
    {
      name: config.mainCoin,
      value: config.mainCoinBalance * config.currentPrice,
      percentage:
        ((config.mainCoinBalance * config.currentPrice) / config.totalValue) *
        100,
    },
    {
      name: config.secondaryCoin,
      value: config.secondaryCoinBalance,
      percentage: (config.secondaryCoinBalance / config.totalValue) * 100,
    },
  ];

  const chartData = priceHistory.map((price, index) => ({
    time: index,
    price: price,
  }));

  const COLORS = ["#3B82F6", "#10B981"];

  return (
    <div className="glass-card p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Portfolio Dashboard
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Balance */}
        <div>
          <h4 className="text-lg font-medium text-white mb-4">ยอดคงเหลือ</h4>
          <div className="space-y-4">
            {portfolioData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-white font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-sm text-gray-300">
                    {formatNumber(item.percentage)}%
                  </p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
              <span className="text-white font-medium">มูลค่ารวม</span>
              <span className="text-xl font-bold text-green-400">
                {formatCurrency(config.totalValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div>
          <h4 className="text-lg font-medium text-white mb-4">กราฟราคา</h4>
          <div className="h-64 bg-white/5 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "ราคา"]}
                  labelStyle={{ color: "#000" }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
