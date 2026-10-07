# 摩擦力互動模擬器 (Friction Physics Simulator)

專為高中基礎物理設計的**摩擦力互動模擬實驗室**。以「減法思維」降低學生認知負荷，透過**三位一體同屏同步儀表板**，在單一視窗內即時對照「滑塊運動動作」、「F-f 受力變化」與「a-t 加速度時間圖」。

![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)

---

## 🌟 核心特色 (Key Features)

### 1. 三位一體同屏儀表板 (Triple-Sync Panoramic Dashboard)
- **免滾動一覽無遺 (Zero Scroll)**：頂部滑軌、左下 F-f 圖、右下 a-t 圖與右側控制台完全收納於單一視窗。
- **即時視覺聯動**：外力增加時，學生可同時看見：
  1. 上方滑塊開始滑動。
  2. 左下 F-f 圖紅點爬坡至最大靜摩擦力 $f_{s,\max}$ 後驟降至動摩擦力 $f_k$。
  3. 右下 a-t 圖加速度於同一瞬間自 $0$ 垂直躍升。

### 2. 高中教學認知負荷減法設計 (Reduced Cognitive Load)
- **拉力純向右從 0 開始 ($0 \le F$)**：還原課堂彈簧秤只能拉不能推的真實情境，去除向左負向力的符號混淆。
- **固定起點與護欄邊界**：滑塊預設於 $-6\text{ m}$ 起點，撞擊右側護欄或時間上限時**自動停止計時並暫停**，避免操作手忙腳亂。
- **破除迷思之狀態膠囊**：滑塊上方即時標記「靜止平衡 ($f_s = F$)」、「達最大靜摩擦臨界」、「滑動加速中 ($F_{net} > 0$)」，直接破除「靜摩擦力永遠等於最大靜摩擦力」的學生常見迷思。
- **⚡ 一鍵自動平穩加力測試 (Auto-Ramp)**：從 $0\text{ N}$ 勻速穩定施力，學生只需專注觀察雙圖與滑塊運動的跳變關係。

### 3. 物理參數概念 Tooltips
- 每個滑桿與選擇器旁均配備 `info` 提示圖示，懸停或點擊即可查看物理實體意義與核心公式晶片（如 $f_{s,\max} = \mu_s F_N$、$F_N = mg$、$a = \frac{F_{net}}{m}$）。

### 4. 國際化與音效
- **雙語切換**：繁體中文 (Traditional Chinese) 與英文 (English) 一鍵切換。
- **程序化音效 (Web Audio API)**：靜摩擦力突破瞬間的卡扣聲與滑動刮擦音效（可靜音）。
- **實驗數據匯出**：一鍵下載 CSV 格式的 $(t, F, f)$ 實驗數據。

---

## 🛠 技術棧 (Tech Stack)

- **框架**：React 19 (Hooks, Functional Components)
- **語言**：TypeScript
- **樣式**：Tailwind CSS v4 (`@import "tailwindcss";`)
- **圖形繪製**：HTML5 Canvas (雙緩衝、高 DPI 視網膜縮放)
- **打包工具**：Vite 6 / 8
- **圖示庫**：Lucide React

---

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴
```bash
npm install
```

### 2. 本地開發
```bash
npm run dev
```
瀏覽器打開 `http://localhost:3000` 即可開始實驗。

### 3. 生產環境打包
```bash
npm run build
```
打包產物將輸出於 `dist/` 目錄中。

---

## 📦 推送到 GitHub 步驟 (Push to GitHub)

若您尚未初始化 Git，可在終端機執行以下指令推送到您的 GitHub 倉庫：

```bash
# 1. 初始化 Git 倉庫
git init

# 2. 將所有檔案加入暫存區
git add .

# 3. 提交初始版本
git commit -m "feat: complete friction physics simulator with triple-sync layout"

# 4. 建立 main 分支
git branch -M main

# 5. 連接您的 GitHub 遠端倉庫 (請將 <YOUR_REPO_URL> 替換為您的倉庫網址)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 6. 推送到 GitHub
git push -u origin main
```

---

## 📄 License
Apache-2.0
