export const calculateRebalance = (config, currentPrice, priceChange) => {
  let newMainBalance = config.mainCoinBalance;
  let newSecondaryBalance = config.secondaryCoinBalance;
  let action = "";

  if (priceChange < 0) {
    // ราคาตก - ซื้อเหรียญหลัก
    const buyAmount = Math.min(
      config.secondaryCoinBalance * (config.maxTradePercentage / 100),
      config.secondaryCoinBalance - config.minTradeAmount
    );

    if (buyAmount > config.minTradeAmount) {
      const coinsToBuy = buyAmount / currentPrice;
      newMainBalance += coinsToBuy;
      newSecondaryBalance -= buyAmount;
      action = `📉 ราคาตก ${Math.abs(priceChange).toFixed(
        2
      )}% - ซื้อ ${coinsToBuy.toFixed(6)} ${config.mainCoin}`;
    }
  } else {
    // ราคาขึ้น - ขายเหรียญหลัก
    const sellAmount = Math.min(
      config.mainCoinBalance * (config.maxTradePercentage / 100),
      config.mainCoinBalance * 0.9 // เก็บ 10% ไว้
    );

    if (sellAmount * currentPrice > config.minTradeAmount) {
      const cashReceived = sellAmount * currentPrice;
      newMainBalance -= sellAmount;
      newSecondaryBalance += cashReceived;
      action = `📈 ราคาขึ้น ${priceChange.toFixed(
        2
      )}% - ขาย ${sellAmount.toFixed(6)} ${config.mainCoin}`;
    }
  }

  return {
    newMainBalance,
    newSecondaryBalance,
    action,
  };
};

export const calculatePortfolioValue = (
  mainBalance,
  mainPrice,
  secondaryBalance
) => {
  return mainBalance * mainPrice + secondaryBalance;
};

export const calculateProfitLoss = (currentValue, initialValue) => {
  return currentValue - initialValue;
};

export const calculatePercentageChange = (current, previous) => {
  return ((current - previous) / previous) * 100;
};
