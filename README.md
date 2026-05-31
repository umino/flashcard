# 🃏 FlashCard — スペイン語・中国語 単語復習アプリ

スペイン語と中国語の単語を SM-2（間隔反復）で効率よく復習するWebアプリ。  
GitHub Pages で静的ホスティング。Firebase (Spark 無料枠) でPC/スマホ間の進捗を同期。

## 機能

- 📱 PC/スマホ両対応（レスポンシブ）
- 🃏 フラッシュカード学習（4段階評価 + SM-2 SRS）
- ❌ 間違えた単語を重点的に再学習
- 🗂 単語管理画面（検索・ソート・フィルタ、CSV/JSON インポート/エクスポート）
- 📊 統計：正答率推移グラフ・習熟度分布・苦手単語TOP10
- 🔥 ストリーク（連続学習日数）・デイリーゴール
- ☁️ Firebase ログインで PC/スマホ間同期（未ログイン時は端末ローカル保存）

## クイックスタート

```bash
git clone <repo-url>
cd flashcard
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。初回起動時にサンプル単語が投入されます。

## ビルド & プレビュー

```bash
npm run build      # dist/ にビルド
npm run preview    # ビルド済みをローカルプレビュー
npm test           # 単体テスト（Vitest）
```

## GitHub Pages へのデプロイ

1. GitHub にリポジトリを作成し push する
2. リポジトリの **Settings > Pages > Source** を `GitHub Actions` に設定
3. `main` ブランチに push すると自動デプロイされる

## Firebase 同期を有効にする（任意・無料）

PC とスマホで進捗を同期したい場合のみ設定が必要です。

### Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Firestore Database** を有効化（ロケーション: asia-northeast1 推奨）
3. **Authentication > Google** プロバイダを有効化
4. **プロジェクト設定 > ウェブアプリ** を追加し、設定値をコピー

### Firestore セキュリティルール

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### ローカル開発で使う

```bash
cp .env.example .env
# .env に Firebase 設定値を記入
npm run dev
```

### GitHub Pages で使う

**Settings > Secrets and variables > Actions** に以下を登録:

| Secret名 | 値 |
|---|---|
| `VITE_FB_API_KEY` | Firebase の apiKey |
| `VITE_FB_AUTH_DOMAIN` | Firebase の authDomain |
| `VITE_FB_PROJECT_ID` | Firebase の projectId |
| `VITE_FB_STORAGE_BUCKET` | Firebase の storageBucket |
| `VITE_FB_MESSAGING_SENDER_ID` | Firebase の messagingSenderId |
| `VITE_FB_APP_ID` | Firebase の appId |

Secrets を登録せずに push した場合は Firebase 無効で動作します（端末ローカル保存のみ）。

## 単語の管理（CSVインポート）

CSV 列順: `id,lang,term,reading,meaning,example,tags,createdAt,updatedAt`

- `lang`: `es`（スペイン語）または `zh`（中国語）
- `reading`: 中国語のピンイン等（省略可）
- `tags`: `|` 区切りで複数指定（例: `挨拶|日常`）
- `id`: ユニークな文字列。空欄の場合は自動生成されます

## 技術スタック

| 技術 | 用途 |
|---|---|
| Vite + React + TypeScript | ビルド・UI |
| Zustand | 状態管理 |
| Recharts | グラフ |
| Firebase | 認証・Firestore 同期 |
| Vitest | 単体テスト |
| GitHub Actions | CI/CD |
| GitHub Pages | ホスティング |
