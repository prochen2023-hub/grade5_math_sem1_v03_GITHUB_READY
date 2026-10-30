# Content Guide｜v0.3

## `data/units.json`

每章除基本欄位外，v0.3 新增四層教學資料：

- `warmup`：10 秒起點快問，包含 `q / options / answer / explain`。
- `worked`：逐步例題，包含 `title / problem / steps / check`。
- `error_clinic`：典型錯法辨認，包含 `q / options / answer / explain / rule`。
- `memory`：孩子應能自己說出口的一句記憶句。
- `challenge`：Boss 題，包含 `q / options / answer / hint / explain`。

原有欄位仍保留：`id`、`title`、`emoji`、`hook`、`draw_first`、`goals`、`keywords`、`story`、`mission`、`pitfall`、`why`、`say`、`badge`、`task`。

## `data/practice.json`

每章目前 10 題，共 100 題。題目格式：

```json
{
  "id": "u01_q1",
  "type": "life",
  "text": "題目",
  "options": ["A", "B", "C"],
  "answer": 1,
  "explain": "正確解法",
  "skill": "小數位值",
  "difficulty": "應用",
  "hint": "不直接公布答案的提示",
  "wrong_tip": "答錯時先提醒檢查哪個觀念"
}
```

`type` 建議只用 `life` 或 `concept`；`answer` 為從 0 開始的選項 index。難度目前使用 `基礎 / 應用 / 挑戰`。

## 題目編寫原則

生活題必須有「判斷要用哪個工具」的成分，而不只是替數字加上人物名稱。優先使用孩子熟悉的脈絡：購物、班級活動、交通班次、運動、食物分配、料理比例、校園空間、時間安排、包裝與圖形設計。

錯誤回饋不要直接寫「錯了，答案是 B」。應先指出可能錯在哪個概念，例如：「再次同時發生要找共同倍數，不是把兩個週期相加」。提示則要比完整解答少一層，保留孩子自己完成最後一步的機會。
