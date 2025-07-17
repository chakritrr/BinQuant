import React from "react";
import { useRebalanceBot } from "../hooks/useRebalanceBot";
import { formatCurrency } from "../utils/formatters";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

const ActivityLog = () => {
  const { state } = useRebalanceBot();
  const { logs, config } = state;

  const getActionIcon = (action) => {
    if (action.includes("📉"))
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    if (action.includes("📈"))
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    return <Clock className="w-4 h-4 text-blue-400" />;
  };

  const getActionColor = (action) => {
    if (action.includes("📉")) return "border-red-400/30 bg-red-400/5";
    if (action.includes("📈")) return "border-green-400/30 bg-green-400/5";
    return "border-blue-400/30 bg-blue-400/5";
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">บันทึกกิจกรรม</h3>
        <div className="text-sm text-gray-300">{logs.length} รายการ</div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">ยังไม่มีกิจกรรม</p>
            <p className="text-sm text-gray-500">เริ่มบอทเพื่อดูการทำงาน</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${getActionColor(
                log.action
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  <span className="text-white font-medium text-sm">
                    {log.action}
                  </span>
                </div>
                <span className="text-xs text-gray-300">{log.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-300">
                <div>
                  <span className="text-gray-400">ราคา: </span>
                  <span className="text-white">
                    {formatCurrency(log.price)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">{config.mainCoin}: </span>
                  <span className="text-white">
                    {log.mainBalance.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">
                    {config.secondaryCoin}:{" "}
                  </span>
                  <span className="text-white">
                    {log.secondaryBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
