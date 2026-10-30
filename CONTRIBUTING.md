# Contributing

本專案以「國小五年級孩子願意繼續玩，而且能自行理解」為第一優先。

修改內容時請遵守：

- 首頁保持簡單，不一次攤開整學期章節。
- 一張今日卡只教一個主要概念。
- 重要定義、例題與題目盡量加 `data-voice`，讓語音按鈕出現在框格起始。
- 先說情境，再問數學；不要把冗長文字包裝成假素養題。
- 錯誤選項反映常見迷思，不故意刁鑽。
- 不以倒扣、羞辱、排行榜壓力刺激學習。
- 互動圖與文字不要擁擠；手機仍須可操作。
- 新增題目後檢查答案、單位、數值合理性與 JSON 格式。

## 提交前檢查

```bash
python scripts/validate_project.py
node scripts/smoke_test.js
node scripts/interaction_test.js
python scripts/v06_content_test.py
node --check assets/js/app.js
node --check assets/js/voice.js
```
