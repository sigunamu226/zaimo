# Zaimo

認証付きの在庫管理 Web アプリ。食材や日用品の名前・数量・賞味期限を管理できます。

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UI | React 19, HeroUI, Tailwind CSS |
| バックエンド | Supabase (PostgreSQL + Auth) |
| パッケージマネージャ | Yarn 4 |

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/<your-username>/zaimo.git
cd zaimo

# 依存パッケージをインストール
yarn install

# 環境変数を設定
cp .env.example .env
# .env を編集して Supabase の認証情報を入力

# 開発サーバーを起動
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `yarn dev` | 開発サーバー起動 |
| `yarn build` | プロダクションビルド |
| `yarn start` | プロダクションサーバー起動 |
| `yarn lint` | ESLint 実行 |

## ディレクトリ構成

```
src/
├── app/            # ルーティング（App Router）
├── components/     # UI コンポーネント
├── common/         # 型定義・Supabase クライアント・ユーティリティ
├── repositories/   # データアクセス（Server Actions）
└── services/       # ビジネスロジック（認証等）
```

## 環境変数

| 変数名 | 説明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名キー |
