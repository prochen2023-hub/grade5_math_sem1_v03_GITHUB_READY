# QA Report｜v0.7.0 故事闖關＋五題分級＋模擬月考版

## 本版驗證目標

這次 QA 不只確認 JSON 與語法，而是針對小學生實際操作流程檢查：

- 首頁不攤開十章全貌。
- 完整章節以場景故事開始。
- 不再出現「核心觀念地圖」與「錯誤診療室」。
- 加碼練習以 A/B/C/D 四級呈現，每次固定 5 題。
- 5 題全部有圖像區。
- AI 休息站不用作答即可看到常見錯法。
- 故事完結篇放在加碼冒險區後段。
- 模擬月考 A/B 卷各 10 題，20 分鐘倒數，含班級、姓名、座號與響鈴。

## 自動驗證結果

```text
VALIDATION OK: 10 units, 212 practice questions, 212 unique question IDs
SMOKE OK: v0.7 story flow + 5-question levels + AI rest + A/B exam lobby
INTERACTION TEST OK: v0.7 concept diagrams and calculations
V07 CONTENT OK: 10 units, >=20 bank questions each, 5-question level system, story flow, AI rest, A/B timed exam
EXAM OK: A/B each 10 questions, 20-minute timer shell, school-test identity fields
```

## 分級規則

- A 卷：新手村
- B 卷：探險隊
- C 卷：高手坡
- D 卷：勇者塔
- 每卷 5 題；答對 3 題即視為過關。
- 過關可點亮「手機時間券」鼓勵圖章；是否兌換由家長決定。

## 月考規格

- 第一次模擬月考：第 1～5 章。
- 第二次模擬月考：第 6～10 章。
- A、B 兩卷各 10 題。
- 20 分鐘倒數；剩 5 分鐘、1 分鐘與時間到有鈴聲提示。
- 80 分以上首次 +30 XP。

## 限制

目前仍是純前端 GitHub Pages 版本，學習進度保存在瀏覽器 localStorage；不同裝置不會自動同步。
