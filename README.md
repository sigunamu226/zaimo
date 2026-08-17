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

## 依存関係の自動更新

Dependabot のセキュリティアラートは人手を介さず解消されるように構成しています。

| 部品 | 役割 |
| --- | --- |
| `.github/dependabot.yml` | patch/minor と security 更新をグループ化して PR 本数を抑え、npm のメジャー更新は PR を作らせない |
| `.github/workflows/ci.yml` | PR と main への push で `lint` + `build` を検証 |
| `.github/workflows/dependabot-auto-merge.yml` | Dependabot PR を CI グリーンで自動マージ |
| `.claude/skills/resolve-dependabot/` | Dependabot が扱えないケース（`resolutions` が必要な内部 pin 等）の backstop |

main には `lint + build` の required status check が設定されており、CI が通らない限り自動マージは成立しません。

自動マージの範囲は以下に絞っています。

| 更新の種類 | 挙動 |
| --- | --- |
| セキュリティ更新（major 以外） | 自動マージ |
| 通常の版上げ（patch） | 自動マージ |
| 通常の版上げ（minor） | 人間レビュー |
| 通常の版上げ（major, npm） | PR を作らせない（`ignore`） |

通常の minor を除外しているのは、0.x 系パッケージでは minor が実質破壊的変更になるためです。
現状テストが無く CI は `lint` + `build` のみなので、ランタイムの破壊（特に認証まわり）を検出できません。

npm のメジャー更新は実施コストが大きく、必要になった時点で手動で上げる方針です
（例: HeroUI v3 はピアで `tailwindcss>=4` を要求するため、両者セットの UI 移行案件になります）。

> **注意 1**: `ignore` は Dependabot のセキュリティ更新にも効くため、メジャーでしか直らない CVE が
> 出ても PR は作られません。ただし Dependabot *アラート* は advisory DB から独立して出るため消えず、
> `resolve-dependabot` ルーティンが alerts API を直接読んで検知し、トラッキング Issue に記録します。

> **注意 2**: この仕組みは main の required status check と リポジトリの auto-merge 設定に依存します。
> どちらかが外れると PR がマージされず、アラートが黙って滞留します。
