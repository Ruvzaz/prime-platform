# เทคนิคการแก้ปัญหาตำแหน่งใบประกาศนียบัตร (E-Cert) บนมือถือ (Cross-Platform Mobile Precision)

เอกสารสรุปเทคนิคการออกแบบและพัฒนา **ระบบสร้างและออกใบประกาศนียบัตรอิเล็กทรอนิกส์ (E-Cert)** ให้แสดงผลและออกไฟล์ได้ตำแหน่งเที่ยงตรง 100% บนโทรศัพท์มือถือทุกรุ่น ทั้ง iOS (Safari) และ Android (Chrome)

---

## ❌ ปัญหาที่มักพบเมื่อออกใบประกาศบนมือถือ (The Issues)

1. **Responsive Viewport & Scaling Glitch:** การใช้ HTML/CSS (เช่น Flexbox, Absolute Positioning) แล้วแปลงเป็นภาพหรือ PDF ผ่านไลบรารีอย่าง `html2canvas` หรือ `jspdf` มักเจอปัญหาตำแหน่งข้อความเขยื้อนเมื่อเปิดบนมือถือ เนื่องจาก Viewport, Screen DPI และการ Zoom หน้าจอที่แตกต่างกัน
2. **iOS Safari Font Metric Bug:** เมื่อใช้ `ctx.textAlign = "center"` ใน HTML5 Canvas บน iOS Safari หรือเบราว์เซอร์มือถือบางรุ่น ตัวหนังสือมักจะไม่ถูกจัดกึ่งกลางจริง หรือเกิดการเบี้ยวเนื่องจากการคำนวณ Font Metrics ที่แตกต่างกัน
3. **Async Image Loading:** หากวาดตัวหนังสือหรือ QR Code ก่อนที่ภาพแม่แบบ (Template Background) จะโหลดเสร็จ ข้อความจะถูกภาพแม่แบบวาดทับ หรือหายไป

---

## 🛠️ เทคนิคและแนวทางแก้ไข (Core Solutions)

ไฟล์หลักในการทำงาน: [`components/ECertCanvas.js`](file:///c:/Users/ASUS/Desktop/Code/BDE-L2E/bde-l2e-digital-thai-thai/components/ECertCanvas.js)

### 1. ล็อกความละเอียดพิกเซลภายใน Canvas (Fixed Internal Resolution)
แทนที่จะปล่อยให้ขนาด Canvas เปลี่ยนตามหน้าจอมือถือ เรากำหนดขนาดความละเอียดภายในไว้ที่ **2000 x 1414 พิกเซล** คงที่เสมอ แล้วใช้ CSS Responsive (`w-full h-auto`) จัดการการย่อขยายบนหน้าจอ

```javascript
const width = 2000;
const height = 1414;

canvas.width = width;
canvas.height = height;
```
> **ผลลัพธ์:** พิกัด `(x, y)` และขนาดฟอนต์ทุกจุดจะถูกวาดที่พิกเซลเป้าหมายเดียวกันเสมอ ไม่ว่าจะเปิดบน iPhone Screen เล็ก หรือ Desktop Screen ใหญ่

---

### 2. คำนวณจุดกึ่งกลางเองด้วย `ctx.measureText()` + `textAlign = "left"`
เลี่ยงการใช้ `ctx.textAlign = "center"` เพื่อตัดปัญหา Font Alignment Bug ในเบราว์เซอร์มือถือ โดยใช้การคำนวณความกว้างข้อความจริงแบบพิกเซล:

```javascript
// วาดชื่อ-นามสกุล ผู้รับใบประกาศ
const nameY = 640;
ctx.font = "bold 65px 'Prompt', sans-serif";
ctx.textAlign = "left";
ctx.textBaseline = "middle";
ctx.fillStyle = "#151e15";

// 1) วัดความกว้างของข้อความจริง ณ ขณะนั้น (หน่วย px)
const nameWidth = ctx.measureText(displayName).width;

// 2) คำนวณจุดเริ่มวาด (X) โดยเอาจุดกึ่งกลาง Canvas (1000px) ลบด้วยครึ่งหนึ่งของความกว้างข้อความ
const nameX = Math.round(1000 - (nameWidth / 2));

// 3) วาดข้อความจากซ้ายไปขวา ณ พิกัดที่คำนวณได้
ctx.fillText(displayName, nameX, nameY);
```

---

### 3. Preload ภาพแม่แบบผ่าน Async `Promise` ก่อนเริ่มวาด
ใช้ `Promise` โหลดภาพแม่แบบจาก API `/api/ecert/template` เข้าสู่ `HTMLImageElement` ให้เสร็จสิ้น (`onload`) ก่อนที่จะเริ่มคำนวณพิกัดวาดข้อความและ QR Code

```javascript
let hasTemplateImg = false;
const templateImg = new Image();
templateImg.src = "/api/ecert/template";

await new Promise((resolve) => {
  templateImg.onload = () => {
    hasTemplateImg = true;
    resolve();
  };
  templateImg.onerror = () => {
    hasTemplateImg = false;
    resolve();
  };
});

if (hasTemplateImg && templateImg.width > 0) {
  ctx.drawImage(templateImg, 0, 0, width, height);
  // ดำเนินการวาดข้อความต่อไป...
}
```

---

### 4. วาด QR Code ผ่าน Off-Screen Canvas
สร้าง QR Code ลงใน Canvas ชั่วคราว (Off-Screen) ก่อน แล้วค่อยคัดลอกพิกเซลไปวางบน Canvas หลัก ณ ตำแหน่งคงที่ `(width - 330, height - 340)`

```javascript
const qrCanvas = document.createElement("canvas");
await QRCode.toCanvas(qrCanvas, qrTargetUrl, {
  width: 170,
  margin: 1,
  color: { dark: "#006e2a", light: "#ffffff" },
});

const qrX = width - 330;
const qrY = height - 340;

// วาดกรอบและภาพ QR Code บน Canvas หลัก
ctx.fillRect(qrX - 10, qrY - 10, 190, 190);
ctx.drawImage(qrCanvas, qrX, qrY, 170, 170);
```

---

### 5. ดึงเฉพาะส่วนข้อมูลที่ต้องหยอด (Extract Day Number & Dynamic Formatting)
สำหรับการหยอดข้อมูลลงในช่องว่างของแม่แบบที่มีข้อความตายตัวอยู่แล้ว (เช่น `"ให้ ณ วันที่ [  ] สิงหาคม พ.ศ. 2569"`) จะใช้ฟังก์ชันดึงเฉพาะตัวเลขวันที่ไปจัดวางตำแหน่ง:

```javascript
function extractDayNumber(dateStr) {
  if (!dateStr) return "31";
  const match = dateStr.match(/\d+/);
  return match ? match[0] : "31";
}

const dayNumber = extractDayNumber(issueDate);
const dayY = 1006;
ctx.font = "bold 32px 'Prompt', sans-serif";
ctx.textAlign = "left";
const dayWidth = ctx.measureText(dayNumber).width;
const dayX = Math.round(945 - (dayWidth / 2)); // พิกัดกึ่งกลางช่องว่างบนใบประกาศ
ctx.fillText(dayNumber, dayX, dayY);
```

---

### 6. ดาวน์โหลดไฟล์ภาพฝั่ง Client-Side โดยตรง (Direct PNG Download)
ดาวน์โหลดไฟล์จาก Canvas เป็น PNG คุณภาพสูงผ่าน `canvas.toDataURL("image/png")` ช่วยให้สิ่งที่ผู้ใช้เห็นบนจอมือถือ คือไฟล์เดียวกับที่จะถูกเซฟลงในเครื่อง ไม่ผ่านกระบวนการแปลงของเซิร์ฟเวอร์ที่อาจทำให้ฟอนต์ผิดเพี้ยน

```javascript
const handleDownloadPNG = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = image;
  link.download = `E-Cert_${certCode}_${displayName.replace(/\s+/g, "_")}.png`;
  link.click();
};
```

---

## 📌 สรุปจุดเด่นของโซลูชันนี้

| ประเด็น | โซลูชัน HTML/CSS ทั่วไป | โซลูชัน HTML5 Canvas (ที่ใช้อยู่) |
| :--- | :--- | :--- |
| **ตำแหน่งข้อความบนมือถือ** | เบี้ยว/เขยื้อนตามขนาดหน้าจอ | **ตำแหน่งเป้าหมายคงที่ 100% ทุกอุปกรณ์** |
| **ความคมชัดของไฟล์ที่ได้** | ขึ้นกับ Resolution ของจอมือถือ | **ภาพชัดระดับ 2000x1414 (High Resolution)** |
| **การรองรับ iOS Safari** | ฟอนต์เลื่อนจากการคำนวณ Viewport | **ไม่เลื่อน เพราะคำนวณพิกเซลแบบ Absolute** |
| **ความเร็วในการดาวน์โหลด** | ต้องรอแปลง DOM/PDF | **ดาวน์โหลดได้ทันที (Client-Side Export)** |
