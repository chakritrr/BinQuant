# BinQuant - Advanced Trading System

ระบบเทรดคริปโตขั้นสูงที่ใช้ระบบบริหารเงินแบบ STREAK และการจัดการความเสี่ยงอัตโนมัติ

## 🚀 Features

### 💰 Advanced Money Management (STREAK System)
- **STREAK Strategy**: ระบบเพิ่มขนาด order ตามลำดับเมื่อแพ้
- **Recovery Mode**: โหมดกู้คืนเมื่อแพ้ติดต่อกัน
- **Dynamic Sizing**: ปรับขนาด order ตามผลการเทรด
- **Volatility Adjustment**: ปรับตามความผันผวนของตลาด
- **Risk Management**: ระบบจัดการความเสี่ยงอัตโนมัติ

### 📊 Real-time Dashboard
- แสดงสถานะการเทรดแบบ Real-time
- สถิติ STREAK และ Risk Management
- ประวัติการเทรดล่าสุด
- การแจ้งเตือนเมื่อถึงขีดจำกัดความเสี่ยง

### 🔧 Configuration
- ปรับแต่ง STREAK sizes ได้
- ตั้งค่าขีดจำกัดความเสี่ยง
- เปิด/ปิดฟีเจอร์ต่างๆ

## 📁 Project Structure

```
BinQuant/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── Dashboard.js          # หน้า Dashboard หลัก
│   │   ├── wallet/
│   │   ├── trading/
│   │   ├── rebalance/
│   │   ├── orders/
│   │   └── settings/
│   ├── utils/
│   │   └── moneyManagement.js        # ระบบบริหารเงิน STREAK
│   ├── services/
│   │   └── tradingService.js         # บริการจัดการการเทรด
│   ├── config/
│   │   └── tradingConfig.js          # การตั้งค่าต่างๆ
│   ├── styles/
│   └── models/
├── public/
│   ├── assets/
│   ├── images/
│   └── icons/
├── binance-bot/
│   └── auto_trade_tp_sl.js          # Bot เก่า (สำหรับอ้างอิง)
├── docs/
├── index.html                        # หน้า Dashboard หลัก
├── wallet.html
├── trading.html
├── rebalance.html
├── orders.html
├── setting.html
└── README.md
```

## 🎯 STREAK System

### หลักการทำงาน
1. **เริ่มต้น**: ใช้ขนาด order เล็ก ($1.00)
2. **เมื่อแพ้**: เพิ่มขนาด order ตามลำดับใน array
3. **เมื่อชนะ**: รีเซ็ตกลับไปที่ขนาดเริ่มต้น
4. **Recovery Mode**: ลดขนาดเมื่อแพ้ติดต่อกัน 3 ครั้ง

### การตั้งค่า STREAK
```javascript
STREAK_SIZES: [1.0, 1.5, 2.5, 4.0, 6.5] // ขนาด order แต่ละ streak
MAX_STREAK: 5                              // จำนวนครั้งสูงสุด
BASE_AMOUNT: 1.0                           // จำนวนเงินเริ่มต้น
```

### ตัวอย่างการทำงาน
- **Streak 1**: $1.00 (เริ่มต้น)
- **Streak 2**: $1.50 (แพ้ครั้งแรก)
- **Streak 3**: $2.50 (แพ้ครั้งที่สอง)
- **Streak 4**: $4.00 (แพ้ครั้งที่สาม)
- **Streak 5**: $6.50 (แพ้ครั้งที่สี่)

## 🛡️ Risk Management

### ขีดจำกัดความเสี่ยง
- **Max Total Loss**: $50.00
- **Max Daily Loss**: $20.00
- **Max Consecutive Losses**: 7 ครั้ง

### การแจ้งเตือน
- แจ้งเตือนเมื่อใกล้ถึงขีดจำกัด
- หยุดการเทรดอัตโนมัติเมื่อเกินขีดจำกัด
- รีเซ็ต daily loss ทุกวัน

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone <repository-url>
cd BinQuant
```

### 2. Install Dependencies
```bash
cd binance-bot
npm install
```

### 3. Setup Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ `binance-bot`:
```env
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=binanceBot
```

### 4. Run the Application
เปิดไฟล์ `index.html` ในเบราว์เซอร์ หรือใช้ local server:
```bash
python -m http.server 8000
# หรือ
npx serve .
```

## 📊 Dashboard Features

### Trading Controls
- **Start Trading**: เริ่มระบบเทรด
- **Stop Trading**: หยุดระบบเทรด
- **Reset**: รีเซ็ตสถิติทั้งหมด

### STREAK Configuration
- แสดง STREAK ปัจจุบัน
- แสดง Recovery Mode status
- แสดง Volatility Index

### Risk Management
- แสดง Total Loss และ Daily Loss
- แสดง Consecutive Losses
- Progress bars สำหรับ Risk limits

### Performance Stats
- Total Profit/Loss
- Win Rate
- Total Trades
- Last Trade Result

## 🔧 Configuration

### ปรับแต่ง STREAK
แก้ไขใน `src/config/tradingConfig.js`:
```javascript
MONEY_MANAGEMENT: {
  STREAK_SIZES: [1.0, 1.5, 2.5, 4.0, 6.5],
  MAX_STREAK: 5,
  BASE_AMOUNT: 1.0,
  // ...
}
```

### ปรับแต่ง Risk Limits
```javascript
MAX_TOTAL_LOSS: 50.0,
MAX_DAILY_LOSS: 20.0,
MAX_CONSECUTIVE_LOSSES: 7,
```

## 📈 Advanced Features

### Dynamic Sizing
- ปรับขนาด order ตามผลการเทรด
- เพิ่มขนาดเมื่อชนะติดต่อกัน
- ลดขนาดเมื่อแพ้ติดต่อกัน

### Volatility Adjustment
- ปรับตาม win rate ล่าสุด
- ลดขนาดเมื่อ win rate ต่ำ
- เพิ่มขนาดเมื่อ win rate สูง

### Recovery Mode
- เปิดใช้งานเมื่อแพ้ติดต่อกัน 3 ครั้ง
- ลดขนาด order ลง 20%
- ปิดใช้งานเมื่อชนะ

## ⚠️ Risk Warning

**⚠️ คำเตือน**: การเทรดคริปโตมีความเสี่ยงสูง ระบบนี้เป็นเพียงเครื่องมือช่วยในการบริหารเงิน ไม่รับประกันผลกำไร

### ข้อแนะนำ
1. เริ่มต้นด้วยจำนวนเงินน้อย
2. ทดสอบระบบก่อนใช้งานจริง
3. ตั้งค่าขีดจำกัดความเสี่ยงที่เหมาะสม
4. ตรวจสอบระบบเป็นประจำ

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

หากมีคำถามหรือต้องการความช่วยเหลือ:
- สร้าง Issue ใน GitHub
- ติดต่อผ่าน Email
- อ่าน Documentation เพิ่มเติม

---

**Made with ❤️ for the crypto trading community**