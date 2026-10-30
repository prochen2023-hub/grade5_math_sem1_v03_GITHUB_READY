# GitHub Pages 部署

## 1. 建立 repository

在 GitHub 建立一個空 repository，例如：

```text
grade5-math-sem1
```

不必先建立 README，因為本專案已包含。

## 2. 將檔案放在 repo root

`index.html` 必須位於 repository 根目錄。請不要再多包一層 `web/`，否則目前的相對路徑需要調整。

## 3. Push 到 main

```bash
git init
git add .
git commit -m "Release v0.2"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## 4. 啟用 Pages

GitHub repository → **Settings → Pages**：

- Build and deployment
- Source：**GitHub Actions**

本專案的 `.github/workflows/pages.yml` 會在 push 到 `main` 後自動部署。

## 5. 後續更新

只要再次 commit + push：

```bash
git add .
git commit -m "Update lessons"
git push
```

Pages 會自動重新部署。

## 注意

- GitHub Pages 是靜態網站，無法自行提供學生帳密或跨裝置資料庫。
- 現階段進度存在每台裝置自己的 `localStorage`。
- 若未來接雲端後端，API key、service role key 等秘密資料絕對不可直接提交到公開 repository。
