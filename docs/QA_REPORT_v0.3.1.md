# v0.3.1 QA 修正報告

## v0.3 問題根因

`assets/js/app.js` 的 `renderUnit()` 呼叫 `mainLab()` 與 `miniLab()`，但 v0.3 打包檔遺漏這兩個路由函式。瀏覽器執行到第一個互動圖時即拋出 `ReferenceError: mainLab is not defined`，導致後續章節內容都沒有建立，因此出現主內容空白與章節按鈕看似失效。

## v0.3.1 修復

- 補回 10 種主要互動圖的 `mainLab()` 映射。
- 補回 10 種小實驗的 `miniLab()` 映射。
- 新增啟動錯誤畫面，避免未來初始化失敗時只顯示空白。
- 驗證器新增 lab/mini 映射、必要函式與 inline handler 定義檢查。
- 新增 Node smoke test，實際執行 app.js 並逐一切換 10 章。
- GitHub Actions 必須同時通過資料驗證與渲染 smoke test 才部署。

## 已完成測試

1. `node --check assets/js/app.js`：通過。
2. `python scripts/validate_project.py`：10 章、100 題、100 個唯一題號通過。
3. `node scripts/smoke_test.js`：10 章均能渲染主要內容，且包含生活任務、錯誤診療室、Boss 題與 10 題分層練習。
4. Chromium JavaScript 引擎注入測試：
   - 首章成功產生 10 個章節按鈕與 11 個主要卡片。
   - 可切換第 2 章並產生因數互動圖。
   - 可打開精熟區，顯示 10 題練習與 Boss 題。
   - 起點快問按鈕可回饋。
   - 因數滑桿可由 12 改為 18 並更新圖面。
   - 逐一切換 10 章均無 JavaScript exception，且無 lab 映射錯誤。

## 防止重發

這次的核心缺陷在舊版只做「語法與 JSON 驗證」時不會被抓到。v0.3.1 起新增真正執行 `app.js` 的 smoke test，因此同樣的函式遺漏會在部署前直接失敗。
