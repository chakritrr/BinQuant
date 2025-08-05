# STREAK Money Management System

## ภาพรวม

ระบบ STREAK เป็นระบบบริหารเงินขั้นสูงที่ออกแบบมาเพื่อจัดการความเสี่ยงในการเทรดคริปโต โดยใช้หลักการเพิ่มขนาด order ตามลำดับเมื่อแพ้ และรีเซ็ตเมื่อชนะ

## หลักการทำงาน

### 1. การเริ่มต้น
- เริ่มต้นด้วยขนาด order เล็ก ($1.00)
- ใช้ index 0 ใน array `STREAK_SIZES`

### 2. เมื่อแพ้ (LOSS)
- เพิ่ม index ใน array
- ใช้ขนาด order ใหม่ตาม index
- บันทึก loss amount
- ตรวจสอบการเข้าสู่ Recovery Mode

### 3. เมื่อชนะ (WIN)
- รีเซ็ต index กลับไปที่ 0
- ใช้ขนาด order เริ่มต้น
- ปิด Recovery Mode (ถ้าเปิดอยู่)
- บันทึก win amount

### 4. Recovery Mode
- เปิดใช้งานเมื่อแพ้ติดต่อกัน 3 ครั้ง
- ลดขนาด order ลง 20%
- ปิดใช้งานเมื่อชนะ

## การตั้งค่า

### STREAK Configuration
```javascript
STREAK_SIZES: [1.0, 1.5, 2.5, 4.0, 6.5] // ขนาด order แต่ละ streak
MAX_STREAK: 5                              // จำนวนครั้งสูงสุด
BASE_AMOUNT: 1.0                           // จำนวนเงินเริ่มต้น
```

### Risk Management
```javascript
MAX_TOTAL_LOSS: 50.0,        // จำนวนเงินสูญเสียสูงสุด
MAX_DAILY_LOSS: 20.0,        // จำนวนเงินสูญเสียต่อวันสูงสุด
MAX_CONSECUTIVE_LOSSES: 7,   // จำนวนการแพ้ติดต่อกันสูงสุด
```

### Advanced Features
```javascript
RECOVERY_MODE: true,         // เปิดโหมดกู้คืน
DYNAMIC_SIZING: true,        // ปรับขนาดตามผลการเทรด
VOLATILITY_ADJUSTMENT: true, // ปรับตามความผันผวน
```

## ตัวอย่างการทำงาน

### Scenario 1: แพ้ติดต่อกัน
```
Trade 1: LOSS → Streak 1 ($1.00) → Lost $1.00
Trade 2: LOSS → Streak 2 ($1.50) → Lost $1.50
Trade 3: LOSS → Streak 3 ($2.50) → Lost $2.50
Trade 4: LOSS → Streak 4 ($4.00) → Lost $4.00
Trade 5: LOSS → Streak 5 ($6.50) → Lost $6.50
Total Loss: $15.50
```

### Scenario 2: ชนะหลังจากแพ้
```
Trade 1: LOSS → Streak 1 ($1.00) → Lost $1.00
Trade 2: LOSS → Streak 2 ($1.50) → Lost $1.50
Trade 3: WIN  → Streak 0 ($1.00) → Won $2.00
Total P&L: -$0.50
```

### Scenario 3: Recovery Mode
```
Trade 1: LOSS → Streak 1 ($1.00) → Lost $1.00
Trade 2: LOSS → Streak 2 ($1.50) → Lost $1.50
Trade 3: LOSS → Streak 3 ($2.50) → Lost $2.50
Trade 4: LOSS → Recovery Mode → ($2.00) → Lost $2.00
Trade 5: WIN  → Streak 0 ($1.00) → Won $3.00
Total P&L: -$4.00
```

## ฟีเจอร์ขั้นสูง

### Dynamic Sizing
- ปรับขนาด order ตามผลการเทรด
- เพิ่มขนาดเมื่อชนะติดต่อกัน
- ลดขนาดเมื่อแพ้ติดต่อกัน

### Volatility Adjustment
- คำนวณ win rate จาก 10 การเทรดล่าสุด
- ลดขนาดเมื่อ win rate < 30%
- เพิ่มขนาดเมื่อ win rate > 70%
- ใช้ค่าเริ่มต้นเมื่อ win rate 30-70%

### Daily Reset
- รีเซ็ต daily loss ทุกวัน
- ตรวจสอบวันที่เปลี่ยน
- บันทึกวันที่รีเซ็ตล่าสุด

## การจัดการความเสี่ยง

### 1. Total Loss Limit
- หยุดการเทรดเมื่อ total loss เกินขีดจำกัด
- แสดงเหตุผลที่หยุด
- ต้องรีเซ็ตระบบเพื่อเริ่มใหม่

### 2. Daily Loss Limit
- หยุดการเทรดเมื่อ daily loss เกินขีดจำกัด
- รีเซ็ตอัตโนมัติทุกวัน
- แจ้งเตือนเมื่อใกล้ถึงขีดจำกัด

### 3. Consecutive Losses Limit
- หยุดการเทรดเมื่อแพ้ติดต่อกันเกินขีดจำกัด
- ป้องกันการสูญเสียต่อเนื่อง
- ต้องรีเซ็ตระบบเพื่อเริ่มใหม่

## การใช้งาน

### เริ่มต้นระบบ
```javascript
import { MoneyManagement } from './src/utils/moneyManagement.js';

const moneyManagement = new MoneyManagement({
  streakSizes: [1.0, 1.5, 2.5, 4.0, 6.5],
  maxStreak: 5,
  maxTotalLoss: 50.0
});
```

### อัปเดตผลการเทรด
```javascript
const nextOrderValue = moneyManagement.updateStreak('WIN', 2.50, {
  orderId: 'ORDER_123',
  entryPrice: 45000,
  exitPrice: 46000
});
```

### ได้สถิติ
```javascript
const stats = moneyManagement.getStats();
console.log('Current streak:', stats.currentStreak);
console.log('Total loss:', stats.totalLossAmount);
console.log('Win rate:', stats.winRate);
```

## การปรับแต่ง

### ปรับ STREAK Sizes
```javascript
// ใช้ขนาดที่เล็กลง
STREAK_SIZES: [0.5, 1.0, 1.5, 2.0, 2.5]

// ใช้ขนาดที่ใหญ่ขึ้น
STREAK_SIZES: [2.0, 3.0, 5.0, 8.0, 12.0]
```

### ปรับ Risk Limits
```javascript
// อนุรักษ์นิยม
MAX_TOTAL_LOSS: 25.0,
MAX_DAILY_LOSS: 10.0,
MAX_CONSECUTIVE_LOSSES: 5

// แข็งขัน
MAX_TOTAL_LOSS: 100.0,
MAX_DAILY_LOSS: 50.0,
MAX_CONSECUTIVE_LOSSES: 10
```

## ข้อควรระวัง

### 1. การจัดการเงิน
- เริ่มต้นด้วยจำนวนเงินน้อย
- ทดสอบระบบก่อนใช้งานจริง
- ตั้งค่าขีดจำกัดที่เหมาะสม

### 2. ความเสี่ยง
- ระบบไม่รับประกันผลกำไร
- อาจสูญเสียเงินได้
- ใช้วิจารณญาณในการตัดสินใจ

### 3. การบำรุงรักษา
- ตรวจสอบระบบเป็นประจำ
- อัปเดตการตั้งค่าตามความเหมาะสม
- บันทึกและวิเคราะห์ผลการเทรด

## การพัฒนาในอนาคต

### 1. Machine Learning
- ปรับ STREAK sizes ตาม AI
- วิเคราะห์รูปแบบตลาด
- ปรับปรุง win rate

### 2. Multi-Asset Support
- รองรับหลายคริปโต
- กระจายความเสี่ยง
- Portfolio management

### 3. Advanced Analytics
- Backtesting engine
- Performance metrics
- Risk analysis tools

---

**หมายเหตุ**: ระบบนี้เป็นเครื่องมือช่วยในการบริหารเงิน ไม่รับประกันผลกำไร การเทรดคริปโตมีความเสี่ยงสูง ควรใช้วิจารณญาณในการตัดสินใจ 