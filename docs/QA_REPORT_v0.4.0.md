# QA Report｜v0.4.0 圖解互動深化版

## 驗證範圍

本版不只檢查 JSON 與 JavaScript 語法，也加入「圖解計算邏輯」回歸測試。

### 結構與內容
- 10 個章節存在。
- 100 題練習題、100 個唯一題號。
- 題目答案 index 與必要欄位有效。
- HTML 本機引用檔案完整。

### 10 章渲染
`node scripts/smoke_test.js` 會以最小 DOM 執行 `app.js`，逐章呼叫 `selectUnit()`，確認：
- 10 個章節均能完整渲染。
- 生活任務、錯誤診療室、Boss、10 題練習均存在。
- `mainLab()` / `miniLab()` 不再出現未映射錯誤。

### v0.4 圖解邏輯
`node scripts/interaction_test.js` 逐項檢查：
- 12 的因數模型包含 1 與本身。
- 12、18 最大公因數為 6。
- 步長 4、6 的共同落點為 12、24 公尺。
- 4、6 分鐘／圈在 12 分鐘後同時回起點，甲 3 圈、乙 2 圈。
- 正五邊形邊長 4 的周長為 20。
- 90° 扇形對應全圓 1/4，並顯示弧長概念。
- 正五邊形顯示 5 條對稱軸。
- 三角形圖中存在「底的延長線」與垂直距離說明。
- 梯形圖中明示兩平行底之間的垂直距離。
- 角柱、圓柱、角錐、圓錐、球均能生成立體 SVG；球標示無稜、無頂點。

## 打包前命令

```bash
python scripts/validate_project.py
node scripts/smoke_test.js
node scripts/interaction_test.js
node --check assets/js/app.js
```

以上全部通過才可標示為 GitHub-ready。
