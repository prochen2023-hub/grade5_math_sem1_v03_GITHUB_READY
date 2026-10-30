# Content Guide｜v0.4

## 教學原則

1. **先畫懂，再列式。** 重要關係一定要在圖上標出「誰和誰」。
2. **距離一定說清楚量法。** 例如高與線對稱的距離，都指垂直的最短距離。
3. **一個詞只代表一件事。** 邊長不是周長；圓周不是多邊形的邊；弧是圓周的一部分；弧長是那段弧的長度。
4. **公式要能回到圖。** 面積、最小公倍數、通分等都先有圖像來源。
5. **生活題不是只換人名。** 題目要帶入購物、分裝、跑步、交通、空間、包裝等真實決策。

## 每章基本資料

`data/units.json` 需包含：hook、draw_first、why、say、lab、mini、life、task、goals、keywords、story、mission、pitfall、badge、warmup、worked、error_clinic、memory、challenge。

## v0.4 互動圖重點

- `factors`：拆分／零用錢與因數配對。
- `multiples`：數線步長共同落點。
- `lcm`：操場繞圈與再次同時回起點。
- `polygon`：邊長、周長、正／不規則多邊形。
- `sector`：圓心、半徑、圓心角、弧、弧長、扇形。
- `symmetry`：鏡面、對應點、同垂直距離、對稱軸。
- `area`：三種圖形、底所在直線、延長線、垂線、直角。
- `solids`：立體 SVG 與高度／底面／視角控制。

## 練習題

`data/practice.json` 每題至少包含：
- `id`
- `type`：`life` 或 `concept`
- `difficulty`
- `text`
- `options`
- `answer`
- `explain`
- `hint`
- `wrong_tip`

生活題在介面上以 🏙️ 標示。
