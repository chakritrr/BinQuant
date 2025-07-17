import React, { createContext, useContext, useReducer, useEffect } from "react";
import { calculateRebalance } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";

const BotContext = createContext();

const initialState = {
  config: {
    rebalancePercentage: 5,
    mainCoin: "BTC",
    secondaryCoin: "USDT",
    isActive: false,
    currentPrice: 45000,
    targetPrice: 45000,
    mainCoinBalance: 0.5,
    secondaryCoinBalance: 22500,
    totalValue: 45000,
    minTradeAmount: 10,
    maxTradePercentage: 50,
  },
  logs: [],
  priceHistory: [45000],
  stats: {
    totalTrades: 0,
    profitLoss: 0,
    lastRebalance: null,
    successRate: 0,
  },
};

function botReducer(state, action) {
  switch (action.type) {
    case "SET_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case "UPDATE_PRICE":
      return {
        ...state,
        config: { ...state.config, currentPrice: action.payload },
        priceHistory: [...state.priceHistory.slice(-50), action.payload],
      };

    case "EXECUTE_REBALANCE":
      const {
        newMainBalance,
        newSecondaryBalance,
        action: tradeAction,
      } = action.payload;
      const newTotalValue =
        newMainBalance * state.config.currentPrice + newSecondaryBalance;

      return {
        ...state,
        config: {
          ...state.config,
          mainCoinBalance: newMainBalance,
          secondaryCoinBalance: newSecondaryBalance,
          totalValue: newTotalValue,
          targetPrice: state.config.currentPrice,
        },
        logs: [
          {
            timestamp: new Date().toLocaleTimeString(),
            action: tradeAction,
            price: state.config.currentPrice,
            mainBalance: newMainBalance,
            secondaryBalance: newSecondaryBalance,
          },
          ...state.logs.slice(0, 49),
        ],
        stats: {
          ...state.stats,
          totalTrades: state.stats.totalTrades + 1,
          lastRebalance: new Date().toLocaleTimeString(),
          profitLoss: newTotalValue - 45000,
        },
      };

    case "RESET_BOT":
      return initialState;

    default:
      return state;
  }
}

export function BotProvider({ children }) {
  const [state, dispatch] = useReducer(botReducer, initialState);

  // Price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.config.isActive) {
        const volatility = 0.02;
        const randomChange = (Math.random() - 0.5) * volatility;
        const newPrice = state.config.currentPrice * (1 + randomChange);

        dispatch({ type: "UPDATE_PRICE", payload: newPrice });

        // Check rebalance conditions
        const priceChange =
          ((newPrice - state.config.targetPrice) / state.config.targetPrice) *
          100;
        const absChange = Math.abs(priceChange);

        if (absChange >= state.config.rebalancePercentage) {
          executeRebalance(newPrice, priceChange);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    state.config.isActive,
    state.config.currentPrice,
    state.config.targetPrice,
    state.config.rebalancePercentage,
  ]);

  const executeRebalance = (currentPrice, priceChange) => {
    const result = calculateRebalance(state.config, currentPrice, priceChange);

    dispatch({
      type: "EXECUTE_REBALANCE",
      payload: result,
    });
  };

  const updateConfig = (newConfig) => {
    dispatch({ type: "SET_CONFIG", payload: newConfig });
  };

  const resetBot = () => {
    dispatch({ type: "RESET_BOT" });
  };

  const value = {
    state,
    updateConfig,
    resetBot,
    executeRebalance,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

export const useRebalanceBot = () => {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error("useRebalanceBot must be used within a BotProvider");
  }
  return context;
};
