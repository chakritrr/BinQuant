import WebSocket from "ws";
import axios from "axios";
import crypto from "crypto";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// == CONFIG ==
const BASE_URL = "https://testnet.binancefuture.com";
const SYMBOL = "BTCUSDT";
const BASE_QUANTITY = 0.1; // Base quantity for first trade
const TARGET_PRICE = 600000;
const TP_PERCENT = 0.1; // +10%
const SL_PERCENT = 0.05; // -5%
const LEVERAGE = 20;
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME;

// API Keys (ต้องตั้งใน environment variables)
const API_KEY = process.env.BINANCE_API_KEY || "your_api_key_here";
const API_SECRET = process.env.BINANCE_API_SECRET || "your_api_secret_here";

// == MongoDB config ==
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;

// == LOSS STREAK SETTINGS ==
const LOSS_STREAK_SIZES = [1.0, 1.5, 2.5]; // ขนาด order แต่ละ streak (ใน USD)
const MAX_LOSS_STREAK = LOSS_STREAK_SIZES.length; // จำนวนครั้งสูงสุด = 3
const LOSS_STREAK_ENABLED = true;

// In-memory state (เร็วที่สุด)
let currentState = {
  hasPosition: false,
  tpOrderId: null,
  slOrderId: null,
  entryPrice: null,
  entryTime: null,
  buyOrderId: null,
  currentLossStreak: 0, // 0, 1, 2 (index ของ array)
  currentOrderValue: LOSS_STREAK_SIZES[0], // $1.00, $1.50, $2.50
  totalLossAmount: 0, // จำนวนเงินที่เสียไปแล้ว
  lastTradeResult: null,
};

// == Helper Functions ==
function calculateQuantityFromUSD(usdValue, btcPrice) {
  // คำนวณ quantity จาก USD value และราคา BTC ปัจจุบัน
  const quantity = usdValue / btcPrice;
  return parseFloat(quantity.toFixed(6)); // ปัดให้เหลือ 6 ตำแหน่ง
}

function updateLossStreak(tradeResult) {
  currentState.lastTradeResult = tradeResult;

  if (tradeResult === "WIN") {
    console.log("🎉 WIN! Resetting loss streak to 0");
    currentState.currentLossStreak = 0;
    currentState.currentOrderValue = LOSS_STREAK_SIZES[0];
    currentState.totalLossAmount = 0;
  } else if (tradeResult === "LOSS") {
    const lossAmount = currentState.currentOrderValue;
    currentState.totalLossAmount += lossAmount;

    console.log(
      `💸 LOSS! Lost $${lossAmount} (Total lost: $${currentState.totalLossAmount})`
    );

    if (
      LOSS_STREAK_ENABLED &&
      currentState.currentLossStreak < MAX_LOSS_STREAK - 1
    ) {
      currentState.currentLossStreak++;
      currentState.currentOrderValue =
        LOSS_STREAK_SIZES[currentState.currentLossStreak];
      console.log(
        `📈 Loss streak increased to ${
          currentState.currentLossStreak + 1
        }, next order: $${currentState.currentOrderValue}`
      );
    } else {
      console.log(
        `⚠️ Max loss streak reached (${MAX_LOSS_STREAK}), keeping same order size`
      );
    }
  }

  // บันทึก state
  saveState(currentState);
}

// == MongoDB Functions ==
async function initDb() {
  try {
    await client.connect();
    db = client.db("binanceBot");
    console.log("✅ Connected to MongoDB");

    // สร้าง indexes
    await db.collection("botState").createIndex({ botId: 1 });
    await db.collection("trades").createIndex({ createdAt: -1 });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

async function saveState(state) {
  try {
    await db
      .collection("botState")
      .replaceOne(
        { botId: "main" },
        { ...state, updatedAt: new Date() },
        { upsert: true }
      );
    console.log("💾 State saved to MongoDB");
  } catch (err) {
    console.error("❌ Failed to backup state:", err);
  }
}

async function loadState() {
  try {
    const saved = await db.collection("botState").findOne({ botId: "main" });
    if (saved) {
      currentState = {
        hasPosition: saved.hasPosition || false,
        tpOrderId: saved.tpOrderId || null,
        slOrderId: saved.slOrderId || null,
        entryPrice: saved.entryPrice || null,
        entryTime: saved.entryTime || null,
        buyOrderId: saved.buyOrderId || null,
        currentLossStreak: saved.currentLossStreak || 0,
        currentOrderValue: saved.currentOrderValue || LOSS_STREAK_SIZES[0],
        totalLossAmount: saved.totalLossAmount || 0,
        lastTradeResult: saved.lastTradeResult || null,
      };
      console.log("✅ State restored from MongoDB:", currentState);
      console.log(
        `📊 Current loss streak: ${
          currentState.currentLossStreak + 1
        }, Order value: $${currentState.currentOrderValue}`
      );
    }
  } catch (err) {
    console.error("❌ Failed to load state:", err);
  }
}

async function logTradeResult(tradeData) {
  try {
    const trade = {
      symbol: SYMBOL,
      quantity: tradeData.quantity || BASE_QUANTITY,
      leverage: LEVERAGE,
      tpPercent: TP_PERCENT,
      slPercent: SL_PERCENT,
      orderValueUSD: currentState.currentOrderValue,
      lossStreak: currentState.currentLossStreak,
      totalLossAmount: currentState.totalLossAmount,
      ...tradeData,
      createdAt: new Date(),
    };

    await db.collection("trades").insertOne(trade);
    console.log("📝 Trade logged to database");

    // คำนวณสถิติ
    await updateStats(trade);
  } catch (err) {
    console.error("❌ Failed to log trade:", err);
  }
}

async function updateStats(trade) {
  try {
    const stats = (await db.collection("stats").findOne({ botId: "main" })) || {
      botId: "main",
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      totalProfit: 0,
      totalLossFromStreak: 0,
    };

    stats.totalTrades += 1;
    if (trade.result === "WIN") {
      stats.winTrades += 1;
      const profit =
        (trade.quantity || BASE_QUANTITY) *
        currentState.entryPrice *
        TP_PERCENT;
      stats.totalProfit += profit;
    } else if (trade.result === "LOSS") {
      stats.lossTrades += 1;
      const loss =
        (trade.quantity || BASE_QUANTITY) *
        currentState.entryPrice *
        SL_PERCENT;
      stats.totalProfit -= loss;
      stats.totalLossFromStreak = currentState.totalLossAmount;
    }

    stats.winRate =
      stats.totalTrades > 0
        ? ((stats.winTrades / stats.totalTrades) * 100).toFixed(2)
        : 0;
    stats.updatedAt = new Date();

    await db
      .collection("stats")
      .replaceOne({ botId: "main" }, stats, { upsert: true });

    console.log(
      `📊 Stats: ${stats.winTrades}W/${stats.lossTrades}L (${stats.winRate}% win rate) | Total Loss Streak: $${stats.totalLossFromStreak}`
    );
  } catch (err) {
    console.error("❌ Failed to update stats:", err);
  }
}

// == Binance API Functions ==
async function getServerTime() {
  try {
    const res = await axios.get(`${BASE_URL}/fapi/v1/time`);
    return res.data.serverTime;
  } catch (err) {
    console.error("❌ getServerTime error:", err);
    return Date.now();
  }
}

function sign(query) {
  return crypto.createHmac("sha256", API_SECRET).update(query).digest("hex");
}

async function sendOrder(params) {
  const serverTime = await getServerTime();
  params.timestamp = serverTime;
  params.recvWindow = 10000;

  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.post(
      `${BASE_URL}/fapi/v1/order?${fullQuery}`,
      null,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
      }
    );
    return res.data;
  } catch (err) {
    console.error("❌ sendOrder error:", err.response?.data || err);
    throw err;
  }
}

async function checkOrderStatus(orderId) {
  const serverTime = await getServerTime();
  const params = {
    symbol: SYMBOL,
    orderId,
    timestamp: serverTime,
    recvWindow: 10000,
  };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.get(`${BASE_URL}/fapi/v1/order?${fullQuery}`, {
      headers: { "X-MBX-APIKEY": API_KEY },
    });
    return res.data;
  } catch (err) {
    console.error("❌ checkOrderStatus error:", err.response?.data || err);
    return null;
  }
}

async function checkPosition() {
  const serverTime = await getServerTime();
  const params = {
    timestamp: serverTime,
    recvWindow: 10000,
  };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.get(
      `${BASE_URL}/fapi/v2/positionRisk?${fullQuery}`,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
      }
    );
    const position = res.data.find((p) => p.symbol === SYMBOL);
    return position || { positionAmt: "0" };
  } catch (err) {
    console.error("❌ checkPosition error:", err.response?.data || err);
    return { positionAmt: "0" };
  }
}

async function cancelAllOrders(symbol) {
  const serverTime = await getServerTime();
  const params = {
    symbol,
    timestamp: serverTime,
    recvWindow: 10000,
  };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.delete(
      `${BASE_URL}/fapi/v1/allOpenOrders?${fullQuery}`,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
      }
    );
    console.log(`🗑️ Canceled all open orders for ${symbol}`);
    return res.data;
  } catch (err) {
    console.error("❌ cancelAllOrders error:", err.response?.data || err);
  }
}

async function closeAllPositions(symbol) {
  const pos = await checkPosition();
  if (pos && parseFloat(pos.positionAmt) !== 0) {
    const side = parseFloat(pos.positionAmt) > 0 ? "SELL" : "BUY";
    const quantity = Math.abs(parseFloat(pos.positionAmt));

    try {
      const closeOrder = await sendOrder({
        symbol,
        side,
        type: "MARKET",
        quantity: quantity.toString(),
        reduceOnly: true,
      });
      console.log(`🔄 Closed existing position: ${closeOrder.orderId}`);
    } catch (err) {
      console.error("❌ closeAllPositions error:", err);
    }
  }
}

async function setLeverage(symbol, leverage) {
  const serverTime = await getServerTime();
  const params = {
    symbol,
    leverage,
    timestamp: serverTime,
    recvWindow: 10000,
  };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.post(
      `${BASE_URL}/fapi/v1/leverage?${fullQuery}`,
      null,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
      }
    );
    console.log(`✅ Leverage set to ${leverage}x for ${symbol}`);
    return res.data;
  } catch (err) {
    console.error("❌ setLeverage error:", err.response?.data || err);
  }
}

async function getActualFillPrice(orderId, fallbackPrice, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((r) => setTimeout(r, 1000));

      const orderDetail = await checkOrderStatus(orderId);

      if (orderDetail && orderDetail.status === "FILLED") {
        const fillPrice = parseFloat(
          orderDetail.avgPrice || orderDetail.price || fallbackPrice
        );
        console.log(`✅ Actual fill price: ${fillPrice} (attempt ${i + 1})`);
        return fillPrice;
      }

      console.log(
        `⏳ Waiting for order fill... (attempt ${i + 1}/${maxRetries})`
      );
    } catch (err) {
      console.error(`❌ Error checking order (attempt ${i + 1}):`, err);
    }
  }

  console.log(
    `⚠️ Order not filled after ${maxRetries} attempts, using fallback: ${fallbackPrice}`
  );
  return fallbackPrice;
}

// TP/SL Functions
async function createTakeProfitOrder(entryPrice, quantity, symbol = SYMBOL) {
  const TP_PRICE = (entryPrice * (1 + TP_PERCENT)).toFixed(2);

  try {
    const tpOrder = await sendOrder({
      symbol,
      side: "SELL",
      type: "TAKE_PROFIT_MARKET",
      stopPrice: TP_PRICE,
      quantity: quantity.toString(),
      reduceOnly: true,
    });
    console.log("✅ TP order created:", tpOrder);
    return { orderId: tpOrder.orderId, price: TP_PRICE, order: tpOrder };
  } catch (err) {
    console.error("❌ Error creating TP order:", err);
    return null;
  }
}

async function createStopLossOrder(entryPrice, quantity, symbol = SYMBOL) {
  const SL_PRICE = (entryPrice * (1 - SL_PERCENT)).toFixed(2);

  try {
    const slOrder = await sendOrder({
      symbol,
      side: "SELL",
      type: "STOP_MARKET",
      stopPrice: SL_PRICE,
      quantity: quantity.toString(),
      reduceOnly: true,
    });
    console.log("✅ SL order created:", slOrder);
    return { orderId: slOrder.orderId, price: SL_PRICE, order: slOrder };
  } catch (err) {
    console.error("❌ Error creating SL order:", err);
    return null;
  }
}

async function createTpSlOrders(entryPrice, quantity, options = {}) {
  const { createTp = true, createSl = true, symbol = SYMBOL } = options;
  const result = {};

  if (createTp) {
    const tp = await createTakeProfitOrder(entryPrice, quantity, symbol);
    if (tp) result.tpOrderId = tp.orderId;
  }

  if (createSl) {
    const sl = await createStopLossOrder(entryPrice, quantity, symbol);
    if (sl) result.slOrderId = sl.orderId;
  }

  return result;
}

// Recovery Function
async function monitorExistingPosition() {
  let tpOrderId = currentState.tpOrderId;
  let slOrderId = currentState.slOrderId;

  console.log(`🔄 Resuming position monitoring...`);
  console.log(`📊 TP Order ID: ${tpOrderId}`);
  console.log(`📊 SL Order ID: ${slOrderId}`);
  console.log(`💰 Entry Price: ${currentState.entryPrice}`);

  let closed = false;
  while (!closed) {
    const pos = await checkPosition();
    if (pos && parseFloat(pos.positionAmt) === 0) {
      // Log final status
      const finalTpStatus = await checkOrderStatus(tpOrderId);
      const finalSlStatus = await checkOrderStatus(slOrderId);

      console.log("📊 Position closed, checking final TP/SL status...");
      console.log(
        `🎯 Final TP Status: ${finalTpStatus?.status || "NOT_FOUND"}`
      );
      console.log(
        `🛑 Final SL Status: ${finalSlStatus?.status || "NOT_FOUND"}`
      );

      let result = "UNKNOWN";
      if (finalTpStatus?.status === "FILLED") {
        console.log("✅ Position closed by TAKE PROFIT! 🎉");
        result = "WIN";
      } else if (finalSlStatus?.status === "FILLED") {
        console.log("❌ Position closed by STOP LOSS 😞");
        result = "LOSS";
      } else {
        console.log("❓ Position closed by unknown reason (manual close?)");
      }

      // อัพเดท loss streak
      updateLossStreak(result);

      // Log trade result
      await logTradeResult({
        action: "position_closed",
        entryPrice: currentState.entryPrice,
        entryTime: currentState.entryTime,
        exitTime: new Date(),
        tpStatus: finalTpStatus?.status,
        slStatus: finalSlStatus?.status,
        tpPrice:
          finalTpStatus?.status === "FILLED" ? finalTpStatus.avgPrice : null,
        slPrice:
          finalSlStatus?.status === "FILLED" ? finalSlStatus.avgPrice : null,
        result: result,
        quantity: parseFloat(pos.positionAmt) || BASE_QUANTITY,
      });

      await cancelAllOrders(SYMBOL);

      // Reset state
      currentState.hasPosition = false;
      currentState.tpOrderId = null;
      currentState.slOrderId = null;
      currentState.entryPrice = null;
      currentState.entryTime = null;
      saveState(currentState);

      closed = true;
      console.log("✅ Recovery monitoring completed!");
    } else {
      // เช็คและสร้าง TP/SL ใหม่ถ้าจำเป็น
      const tpStatus = await checkOrderStatus(tpOrderId);
      const slStatus = await checkOrderStatus(slOrderId);

      console.log(
        `TP: ${tpStatus?.status || "UNKNOWN"}, SL: ${
          slStatus?.status || "UNKNOWN"
        }`
      );

      const currentQuantity = Math.abs(parseFloat(pos.positionAmt));

      if (!tpStatus || tpStatus.status === "CANCELED") {
        console.log("🔄 Recreating TP order...");
        const newTp = await createTakeProfitOrder(
          currentState.entryPrice,
          currentQuantity
        );
        if (newTp) {
          tpOrderId = newTp.orderId;
          currentState.tpOrderId = tpOrderId;
          saveState(currentState);
        }
      }

      if (!slStatus || slStatus.status === "CANCELED") {
        console.log("🔄 Recreating SL order...");
        const newSl = await createStopLossOrder(
          currentState.entryPrice,
          currentQuantity
        );
        if (newSl) {
          slOrderId = newSl.orderId;
          currentState.slOrderId = slOrderId;
          saveState(currentState);
        }
      }

      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// == MAIN BOT ==
async function startBot() {
  let hasPosition = currentState.hasPosition;
  let ws;
  let reconnectDelay = 5000;
  let pingInterval;
  let pongTimeout;

  // ตั้ง leverage ก่อนเริ่มบอท
  await setLeverage(SYMBOL, LEVERAGE);

  function connect() {
    ws = new WebSocket("wss://stream.binancefuture.com/ws/btcusdt@bookTicker");

    ws.on("open", () => {
      console.log("✅ WS connected");
      console.log(
        `📊 Current loss streak: ${
          currentState.currentLossStreak + 1
        }, Next order value: $${currentState.currentOrderValue}`
      );
      reconnectDelay = 5000;

      clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
          pongTimeout = setTimeout(() => {
            console.log("⚠️ No pong, terminating...");
            ws.terminate();
          }, 5000);
        }
      }, 10000);
    });

    ws.on("pong", () => {
      clearTimeout(pongTimeout);
    });

    ws.on("message", async (data) => {
      if (hasPosition) return;

      const parsed = JSON.parse(data);
      const ask = parseFloat(parsed.a);
      console.log("Ask price:", ask);

      if (ask <= TARGET_PRICE) {
        console.log(`🔥 Buying at ${ask}`);
        hasPosition = true;

        // คำนวณ quantity จาก USD value ปัจจุบัน
        const quantity = calculateQuantityFromUSD(
          currentState.currentOrderValue,
          ask
        );
        console.log(
          `💰 Order size: $${
            currentState.currentOrderValue
          } = ${quantity} BTC (Loss streak: ${
            currentState.currentLossStreak + 1
          })`
        );

        // 1. ยกเลิก orders ทั้งหมด
        await cancelAllOrders(SYMBOL);

        // 2. ปิด position ที่มีอยู่ (ถ้ามี)
        await closeAllPositions(SYMBOL);

        // 3. ส่ง buy order
        const buy = await sendOrder({
          symbol: SYMBOL,
          side: "BUY",
          type: "MARKET",
          quantity: quantity.toString(),
        });
        console.log("✅ Buy order:", buy);

        // 4. อัพเดท state
        currentState.hasPosition = true;
        currentState.buyOrderId = buy.orderId;
        currentState.entryTime = new Date();

        // 5. ดึงราคา fill จริง
        const actualFillPrice = await getActualFillPrice(buy.orderId, ask);
        console.log(
          `🎯 Using actual fill price: ${actualFillPrice} for TP/SL calculation`
        );
        currentState.entryPrice = actualFillPrice;

        // 6. สร้าง TP/SL
        const tpSlResult = await createTpSlOrders(actualFillPrice, quantity);
        currentState.tpOrderId = tpSlResult.tpOrderId;
        currentState.slOrderId = tpSlResult.slOrderId;

        // 7. Backup state และ log trade
        saveState(currentState);

        await logTradeResult({
          action: "position_opened",
          entryPrice: actualFillPrice,
          entryTime: currentState.entryTime,
          buyOrderId: buy.orderId,
          tpOrderId: tpSlResult.tpOrderId,
          slOrderId: tpSlResult.slOrderId,
          targetPrice: TARGET_PRICE,
          quantity: quantity,
        });

        let { tpOrderId, slOrderId } = tpSlResult;

        console.log("⏳ Monitoring TP/SL...");
        let closed = false;

        while (!closed) {
          const pos = await checkPosition();
          if (pos && parseFloat(pos.positionAmt) === 0) {
            console.log("📊 Position closed, checking final TP/SL status...");

            const finalTpStatus = await checkOrderStatus(tpOrderId);
            const finalSlStatus = await checkOrderStatus(slOrderId);

            console.log(
              `🎯 Final TP Status: ${finalTpStatus?.status || "NOT_FOUND"}`
            );
            console.log(
              `🛑 Final SL Status: ${finalSlStatus?.status || "NOT_FOUND"}`
            );

            let result = "UNKNOWN";
            if (finalTpStatus?.status === "FILLED") {
              console.log("✅ Position closed by TAKE PROFIT! 🎉");
              result = "WIN";
            } else if (finalSlStatus?.status === "FILLED") {
              console.log("❌ Position closed by STOP LOSS 😞");
              result = "LOSS";
            } else {
              console.log(
                "❓ Position closed by unknown reason (manual close?)"
              );
            }

            // อัพเดท loss streak
            updateLossStreak(result);

            // Log trade result
            await logTradeResult({
              action: "position_closed",
              entryPrice: currentState.entryPrice,
              entryTime: currentState.entryTime,
              exitTime: new Date(),
              tpStatus: finalTpStatus?.status,
              slStatus: finalSlStatus?.status,
              tpPrice:
                finalTpStatus?.status === "FILLED"
                  ? finalTpStatus.avgPrice
                  : null,
              slPrice:
                finalSlStatus?.status === "FILLED"
                  ? finalSlStatus.avgPrice
                  : null,
              result: result,
              quantity: quantity,
            });

            await cancelAllOrders(SYMBOL);

            // Reset state
            currentState.hasPosition = false;
            currentState.tpOrderId = null;
            currentState.slOrderId = null;
            currentState.entryPrice = null;
            currentState.entryTime = null;
            saveState(currentState);

            console.log("✅ Position closed and cleanup completed!");
            console.log(
              `📊 Next order will be: $${
                currentState.currentOrderValue
              } (Loss streak: ${currentState.currentLossStreak + 1})`
            );
            closed = true;
            hasPosition = false;
          } else {
            const tpStatus = await checkOrderStatus(tpOrderId);
            const slStatus = await checkOrderStatus(slOrderId);

            console.log(
              `TP: ${tpStatus?.status || "UNKNOWN"}, SL: ${
                slStatus?.status || "UNKNOWN"
              }`
            );

            if (!tpStatus || tpStatus.status === "CANCELED") {
              const newTp = await createTpSlOrders(actualFillPrice, quantity, {
                createSl: false,
              });
              if (newTp.tpOrderId) {
                tpOrderId = newTp.tpOrderId;
                currentState.tpOrderId = tpOrderId;
                saveState(currentState);
              }
              console.log("✅ New TP created");
            }

            if (!slStatus || slStatus.status === "CANCELED") {
              const newSl = await createTpSlOrders(actualFillPrice, quantity, {
                createTp: false,
              });
              if (newSl.slOrderId) {
                slOrderId = newSl.slOrderId;
                currentState.slOrderId = slOrderId;
                saveState(currentState);
              }
              console.log("✅ New SL created");
            }

            process.stdout.write(".");
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }
    });

    ws.on("close", () => {
      console.log(`⚠️ WS closed. Reconnecting in ${reconnectDelay / 1000}s...`);
      cleanup();
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 60000);
        connect();
      }, reconnectDelay);
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
      ws.terminate();
    });
  }

  function cleanup() {
    clearInterval(pingInterval);
    clearTimeout(pongTimeout);
  }

  connect();
}

// == MAIN ==
async function main() {
  console.log("🚀 Starting Binance Trading Bot with Loss Streak System...");
  console.log(`📊 Loss Streak Settings: ${LOSS_STREAK_SIZES.join(" -> ")} USD`);
  console.log(`📊 Max Loss Streak: ${MAX_LOSS_STREAK} trades`);
  console.log(`📊 Loss Streak Enabled: ${LOSS_STREAK_ENABLED}`);

  // เชื่อมต่อ MongoDB
  await initDb();

  // โหลด state จาก MongoDB
  await loadState();

  // ถ้ามี position ค้างอยู่จาก session ก่อน
  if (
    currentState.hasPosition &&
    currentState.tpOrderId &&
    currentState.slOrderId
  ) {
    console.log("🔄 Found existing position from previous session!");
    console.log(`📊 Entry Price: ${currentState.entryPrice}`);
    console.log(`⏰ Entry Time: ${currentState.entryTime}`);

    // เข้า recovery monitoring
    monitorExistingPosition()
      .then(() => {
        console.log("✅ Recovery completed, ready for new trades");
      })
      .catch((err) => {
        console.error("❌ Recovery failed:", err);
        // Reset state if recovery fails
        currentState.hasPosition = false;
        saveState(currentState);
      });
  }

  // เริ่ม WebSocket trading
  startBot();
}

// เริ่มบอท
// main().catch(console.error);
