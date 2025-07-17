export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number, decimals = 2) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

export const formatPercentage = (percentage) => {
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
};

export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("th-TH");
};
