# 國小五年級上學期數學｜v0.7.0

**故事闖關＋五題分級＋模擬月考版**。純前端網站，可直接部署到 GitHub Pages。

## v0.7 重點

- 完整章節改成「場景故事 → 一關一關玩 → 故事任務 → AI 休息站 → 星星收穫」。不再用全貌地圖或教條式段落嚇孩子。
- 「核心觀念」全面改稱「挑戰關卡」；關卡卡片使用漸層與不同底色。
- 原本一次展開大量精熟題，改成 **A / B / C / D 四級**，每級固定 **5 題**。
- 每題都有圖像提示；答對 3/5 即算該級過關，不要求全對。
- 過關會點亮「📱 手機時間券」圖章（實際兌換由家長決定）。
- 「錯誤診療室」改成 **AI 休息站**：孩子不用作答，AI 直接整理最常見錯法，讓注意力換氣。
- 原本章節全貌地圖移除；章節重點改在加碼冒險區最後，用「故事完結篇＋冒險道具」回顧。
- 新增 **模擬月考 A / B 卷**：每卷 10 題、20 分鐘倒數、班級／姓名／座號欄、考場響鈴、交卷成績。
- 第 1～5 章歸為第一次模擬月考，第 6～10 章歸為第二次模擬月考。
- 題庫保留為後台素材，全站共 **212 題**；學生平常一次只看到 5 題。

## 闖關規則

- A 級：新手村
- B 級：探險隊
- C 級：高手坡
- D 級：勇者塔
- 每級 5 題，答對 3 題即可過關並解鎖下一級。
- 答錯不扣 XP、不扣星；可以看提示後再試。
- 每題都有圖形／情境提示，避免純文字牆。

## 模擬月考

- A、B 兩份不同題目，同一範圍。
- 每卷 10 題、20 分鐘。
- 剩 5 分鐘、1 分鐘及時間到會響鈴。
- 80 分以上首次可獲得 +30 XP。
- 模擬考是加碼模式，不會出現在每天的必做路線。

## GitHub Pages / CI

部署前會執行：

```bash
python scripts/validate_project.py
node scripts/smoke_test.js
node scripts/interaction_test.js
python scripts/v07_content_test.py
node scripts/exam_test.js
node --check assets/js/app.js
node --check assets/js/voice.js
```

ZIP 內容直接放在 repository root，Push 到 `main`，Settings → Pages → Source 選 **GitHub Actions**。

## 進度相容

`localStorage` namespace 仍沿用 `g5m1`。舊版 XP、星星、完成章節與錯題可延續。
