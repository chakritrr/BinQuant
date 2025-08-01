// const WebSocket = require("ws");
// const axios = require("axios");
// const crypto = require("crypto");

import WebSocket from "ws";
import axios from "axios";
import crypto from "crypto";

// const { MongoClient } = require('mongodb'); // <-- สำหรับเชื่อม MongoDB (คอมเมนต์ไว้ก่อน)

// == CONFIG ==

const BASE_URL = "https://testnet.binancefuture.com";
const SYMBOL = "BTCUSDT";
const QUANTITY = 0.1;
const TARGET_PRICE = 600000;
const TP_PERCENT = 0.1; // +5%
const SL_PERCENT = 0.05; // -5%

// == MongoDB config (คอมเมนต์ไว้ก่อน) ==
// const uri = 'mongodb://localhost:27017';
// const client = new MongoClient(uri);
// let db;

// async function initDb() {
//   await client.connect();
//   db = client.db('binanceBot');
//   console.log('✅ Connected to MongoDB');
// }

// async function logTrade(data) {
//   await db.collection('trades').insertOne({ ...data, createdAt: new Date() });
// }

// == SIGN ==
function sign(query) {
  return crypto.createHmac("sha256", API_SECRET).update(query).digest("hex");
}

// == ORDER / POSITION ==
async function sendOrder(params) {
  params.timestamp = Date.now();
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
  }
}

async function checkOrderStatus(orderId) {
  const params = {
    symbol: SYMBOL,
    orderId,
    timestamp: Date.now(),
  };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.get(`${BASE_URL}/fapi/v1/order?${fullQuery}`, {
      headers: { "X-MBX-APIKEY": API_KEY },
    });
    return res.data; // status อยู่ใน res.data.status
  } catch (err) {
    console.error("❌ checkOrderStatus error:", err.response?.data || err);
  }
}

async function watchTpSl(tpOrderId, slOrderId) {
  let done = false;
  while (!done) {
    const tpStatus = await checkOrderStatus(tpOrderId);
    const slStatus = await checkOrderStatus(slOrderId);
    console.log(`TP status: ${tpStatus.status}, SL status: ${slStatus.status}`);

    if (tpStatus.status === "FILLED" || slStatus.status === "FILLED") {
      console.log("✅ TP or SL filled!");
      done = true;
    } else if (
      tpStatus.status === "CANCELED" ||
      slStatus.status === "CANCELED"
    ) {
      console.log("⚠️ TP or SL canceled manually!");
      const pos = await checkPosition();
      if (parseFloat(pos.positionAmt) !== 0) {
        console.log("📌 Still have position → placing new TP/SL...");
        // ส่ง TP/SL ใหม่ (ใช้ sendOrder)
      }
    }

    await new Promise((r) => setTimeout(r, 10000)); // check ทุก 10 วิ
  }
}

// Exemple using function
// const openOrders = await getOpenOrders();
// const tpOrder = openOrders.find((o) => o.type === "LIMIT" && o.side === "SELL");
// const slOrder = openOrders.find(
//   (o) => o.type === "STOP_MARKET" && o.side === "SELL"
// );

async function getOpenOrders() {
  const params = { symbol: SYMBOL, timestamp: Date.now() };
  const query = new URLSearchParams(params).toString();
  const signature = sign(query);
  const fullQuery = `${query}&signature=${signature}`;

  try {
    const res = await axios.get(`${BASE_URL}/fapi/v1/openOrders?${fullQuery}`, {
      headers: { "X-MBX-APIKEY": API_KEY },
    });
    return res.data; // array of open orders
  } catch (err) {
    console.error("❌ getOpenOrders error:", err.response?.data || err);
  }
}

async function checkPosition() {
  const params = { timestamp: Date.now() };
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
    return res.data.find((p) => p.symbol === SYMBOL);
  } catch (err) {
    console.error("❌ checkPosition error:", err.response?.data || err);
  }
}

// == MAIN BOT ==
function startBot() {
  let hasPosition = false;
  let ws;
  let reconnectDelay = 5000; // เริ่ม reconnect 5 วิ
  let pingInterval;
  let pongTimeout;

  function connect() {
    ws = new WebSocket("wss://stream.binancefuture.com/ws/btcusdt@bookTicker");

    ws.on("open", () => {
      console.log("✅ WS connected");
      reconnectDelay = 5000; // reset delay หลังต่อสำเร็จ

      // Health check: ตั้ง ping/pong
      clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
          // ตั้ง timeout รอ pong ถ้าไม่มาใน 5 วิ → terminate
          pongTimeout = setTimeout(() => {
            console.log("⚠️ No pong, terminating...");
            ws.terminate();
          }, 5000);
        }
      }, 10000); // ping ทุก 10 วิ
    });

    ws.on("pong", () => {
      // ได้ pong → clear timeout
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

        const buy = await sendOrder({
          symbol: SYMBOL,
          side: "BUY",
          type: "MARKET",
          quantity: QUANTITY,
        });
        console.log("✅ Buy order:", buy);

        const fillPrice = ask; // หรือ avgFillPrice ถ้าใช้จริง
        const TP_PRICE = (fillPrice * (1 + TP_PERCENT)).toFixed(2);
        const SL_PRICE = (fillPrice * (1 - SL_PERCENT)).toFixed(2);

        console.log(`🎯 TP: ${TP_PRICE}, SL: ${SL_PRICE}`);

        const tp = await sendOrder({
          symbol: SYMBOL,
          side: "SELL",
          type: "TAKE_PROFIT_MARKET",
          stopPrice: TP_PRICE,
          closePosition: true,
        });
        console.log("✅ TP order:", tp);

        const sl = await sendOrder({
          symbol: SYMBOL,
          side: "SELL",
          type: "STOP_MARKET",
          stopPrice: SL_PRICE,
          closePosition: true,
        });
        console.log("✅ SL order:", sl);

        // == รอจน position ปิด ==
        console.log("⏳ Waiting TP/SL...");
        let closed = false;
        while (!closed) {
          const pos = await checkPosition();
          if (parseFloat(pos.positionAmt) === 0) {
            console.log("✅ Position closed!");
            closed = true;
            hasPosition = false;
          } else {
            const openOrds = await getOpenOrders();
            let tpOrder = openOrds.find((o) => o.type === "TAKE_PROFIT_MARKET"); // && o.side === "SELL"
            let slOrder = openOrds.find((o) => o.type === "STOP_MARKET"); // && o.side === "SELL"
            // console.log("openOrds:", openOrds);
            // console.log("tpOrder:", tpOrder);
            // console.log("slOrder:", slOrder);

            if (!tpOrder) {
              tpOrder = await sendOrder({
                symbol: SYMBOL,
                side: "SELL",
                type: "TAKE_PROFIT_MARKET",
                stopPrice: TP_PRICE,
                closePosition: true,
              });
              console.log("✅ New TP:", tpOrder);

              // log ลง DB
              // await logTrade({ action: 'create TP', tpOrder });
            }

            if (!slOrder) {
              slOrder = await sendOrder({
                symbol: SYMBOL,
                side: "SELL",
                type: "STOP_MARKET",
                stopPrice: SL_PRICE,
                closePosition: true,
              });
              console.log("✅ New SL:", slOrder);

              // log ลง DB
              // await logTrade({ action: 'create SL', slOrder });
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
        reconnectDelay = Math.min(reconnectDelay * 2, 60000); // max 60s
        connect();
      }, reconnectDelay);
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
      ws.terminate(); // จะเข้า 'close'
    });
  }

  function cleanup() {
    clearInterval(pingInterval);
    clearTimeout(pongTimeout);
  }

  connect();
}

// == START ==
startBot();
