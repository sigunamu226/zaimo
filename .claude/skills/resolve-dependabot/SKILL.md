---
name: resolve-dependabot
description: GitHub Dependabot アラートを洗い出し、`resolutions` を極力避けて大元ライブラリのアップデートで解決する。直接依存は manifest を bump、間接依存は lockfile refresh、内部 pin で更新不能な場合のみ resolutions を例外適用する。commit / push / supersede PR クローズ / 最終再スキャンまで含む。
argument-hint: "[任意: owner/repo] [任意: --autonomous]"
---

# Dependabot アラート一括解決

GitHub Dependabot のオープンアラートを列挙し、**大元ライブラリの更新で解決**することを default policy とする。`resolutions` (yarn) / `overrides` (npm/pnpm) は **upstream が壊れていて他に手段が無い時のみ** の最終手段。

修正は行うが、interactive モードでは `push` 前に必ず人間に確認を取る。autonomous モード (cron ルーティン等) では確認をスキップして固定で「ブランチ + PR」に出力する。

## 0. 実行モード

このスキルには 2 モードある。**起動直後に必ず判定し、以降の挙動を切り替えること**。

### Interactive (default)

人間が `/resolve-dependabot` を打って起動した場合。`AskUserQuestion` で push 方針を毎回確認する。§1-§10 をそのまま実行する。

### Autonomous

無人で起動された場合 (例: Anthropic Routine からの cron 実行)。発火条件 (どれか 1 つでも該当すれば autonomous):

- 引数に `--autonomous` が含まれる
- 起動プロンプトに `autonomous mode` / `無人` / `routine` のいずれかが明記されている
- `AskUserQuestion` を呼んでも応答する人間が居ないと推定できる文脈 (e.g. system note に scheduled execution の旨が記載)

Autonomous モード時の固定動作:

- §8 の `AskUserQuestion` (push 方針確認) は **必ずスキップ** し、「ブランチを切って PR オープン」パスを強制する
- ブランチ名は `fix/dependabot-auto-YYYYMMDD` (UTC 日付ベース)
- **main への直 push は禁止**。supersede された Dependabot PR のクローズも行わず、人間レビューに委ねる
- PR 本文に「このスキルが autonomous モードで自動生成したこと」「元アラート番号一覧」を明記
- §9 の最終再スキャン (open=0 確認) は PR マージ前なので不要。PR 作成完了時点で終了
- §7 lint/build が失敗したら commit せず、失敗内容を `gh issue create` で Issue 化して終了
- open アラート 0 件なら no-op で `"no open alerts"` ログを残して終了

## 1. 役割と禁則

- **DEFAULT**: `package.json` の直接依存を bump、間接依存は lockfile refresh で解決する。
- **禁則**: 最初から `resolutions` / `overrides` を入れることは禁止。理由・代替検証なしに使うのは NG。
- **例外条件 (resolutions / overrides 許可)**: 親パッケージが脆弱版を `"x.y.z"` 形式で **厳密ピン** しており、かつ **公開されている全 stable バージョン** で同じピンが続いていることを `npm view` で実測検証した場合のみ。採用時はコミットメッセージに理由を必ず明記する。
- **push 方針** (interactive モード): 必ずユーザー確認後。`AskUserQuestion` で「main 直 push / feature branch + PR / ローカルのみ」を選ばせる。
- **push 方針** (autonomous モード): §0 参照。確認スキップで固定「branch + PR」、main 直 push は禁止。
- 検証 (lint / build) が失敗したら commit/push に進まず即時報告 (autonomous は `gh issue create` で記録)。

## 2. Pre-flight チェック

```bash
# クリーンか確認 (未コミットがあればユーザーに確認してから進む)
git status

# gh CLI 認証
gh auth status

# パッケージマネージャ検出 (優先順)
node -e "console.log(require('./package.json').packageManager || '')"
ls yarn.lock package-lock.json pnpm-lock.yaml 2>/dev/null
```

検出ロジック:

1. `package.json` の `packageManager` フィールドがあればそれを採用 (例: `yarn@4.9.1` → yarn berry)
2. なければ lockfile から判定: `yarn.lock` → yarn classic、`package-lock.json` → npm、`pnpm-lock.yaml` → pnpm
3. yarn berry の場合は `corepack yarn` 経由で実行する (グローバル yarn が無くても動作)

## 3. Discovery: アラート列挙

```bash
gh api repos/:owner/:repo/dependabot/alerts \
  --jq '.[] | select(.state == "open") | {number, severity: .security_advisory.severity, package: .dependency.package.name, ecosystem: .dependency.package.ecosystem, manifest: .dependency.manifest_path, vulnerable_range: .security_vulnerability.vulnerable_version_range, patched: .security_vulnerability.first_patched_version.identifier, summary: .security_advisory.summary}'
```

引数で `owner/repo` を受け取った場合は `:owner/:repo` を置き換える。

**集計**: パッケージ単位でユニーク化。同一パッケージで複数 CVE があれば **最大の patched バージョン** を採用する。

## 4. カテゴリ分け

各パッケージを以下に分類する:

| 種別 | 判定 | 対応 |
|---|---|---|
| **直接依存** | `package.json` の `dependencies` / `devDependencies` に名前あり | manifest を bump |
| **間接依存 (transitive / 通常)** | lockfile のみに存在、親が semver range で参照 | lockfile refresh で解決 |
| **間接依存 (内部 pin 型)** | 親が `"x.y.z"` の厳密ピンで参照 | **§5 検証を経て** resolutions/overrides 例外適用 |

親パッケージと参照 spec の特定 (yarn berry の例):

```bash
grep -B30 '<pkg>: "npm:' yarn.lock | tail -32
```

`<pkg>: "npm:^X.Y.Z"` のように `^` / `~` 付きなら通常 transitive、`"x.y.z"` ピタリ指定なら内部 pin 型。

## 5. Resolutions / overrides 例外検証フロー

**「上げても解決しないこと」を実測してから使う。** 親 (例: `next`) の全 stable バージョンで同一脆弱版をピンしているか:

```bash
# 親パッケージの直近 stable 版で <pkg> のピンを確認
npm view <parent> dist-tags
for v in 15.5.18 16.0.0 16.1.0 16.2.0 $(npm view <parent>@latest version); do
  printf "%s -> " "$v"; npm view <parent>@$v dependencies.<pkg>
done
```

- 全て同一の脆弱版なら resolutions/overrides を採用してよい。
- どれか 1 つでも patched 版に上がっていたら、親を bump する方向で再検討。

採用時の書き方:

```json
// yarn berry / yarn classic
"resolutions": { "<pkg>": "^<patched-ver>" }

// npm
"overrides": { "<pkg>": "^<patched-ver>" }

// pnpm
"pnpm": { "overrides": { "<pkg>": "^<patched-ver>" } }
```

## 6. 適用

### パッケージマネージャ別コマンド

| PM | 直接依存 bump | 間接依存 refresh | install |
|---|---|---|---|
| yarn berry | `corepack yarn add <pkg>@<ver>` または `package.json` 直接編集 | `corepack yarn up -R <pkg1> <pkg2>` ※範囲不可、名前のみ | `corepack yarn install` |
| yarn classic | `yarn add <pkg>@<ver>` | `yarn upgrade <pkg> --latest` | `yarn install` |
| npm | `npm install <pkg>@<ver>` または `package.json` 編集 | `npm update <pkg> --depth=999` | `npm install` |
| pnpm | `pnpm add <pkg>@<ver>` | `pnpm update -r <pkg>` | `pnpm install` |

### ⚠️ 落とし穴 (実戦で踏んだもの)

- **yarn berry で `yarn install` だけでは既存 lockfile の transitive エントリは refresh されない**。`yarn up -R <pkg>` を別途叩く必要がある。`yarn install` 後に `grep -nE '^"?<pkg>@' yarn.lock` で実際の resolved version を必ず確認する。
- **`yarn up -R` は semver range を受け付けない**。`yarn up -R brace-expansion@^5.0.6` はエラー。名前だけ `yarn up -R brace-expansion` と渡す。
- **`resolutions` 追加後は `yarn install` を再実行**して反映を確認する。`yarn.lock` 内に該当パッケージの resolution が単一になっていることを `grep -E 'resolution: "<pkg>@' yarn.lock` で確認する。
- **package.json 編集後の差分確認**: `git diff package.json` で意図した差分のみであることを確認。

## 7. 検証

```bash
# 1. lint (package.json の scripts.lint があれば)
<pm-run> lint

# 2. build (scripts.build があれば)
<pm-run> build

# 3. dev サーバ HTTP スモーク (任意・余裕があれば)
<pm-run> dev   # background で起動
# Ready ログ確認後:
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/  # 等
# 完了後 TaskStop で終了
```

- 検証コマンドは `package.json` の `scripts` を `cat package.json | jq '.scripts'` で確認してから走らせる。
- `corepack yarn lint` / `npm run lint` / `pnpm lint` など、PM 別の prefix を使う。
- `curl: command not found` の sandbox では `/usr/bin/curl` をフルパス指定する。
- 失敗時は **commit/push に進まず即時報告**。

## 8. コミット & プッシュ (要ユーザー確認)

### コミットメッセージテンプレ

```
fix: resolve Dependabot alerts via <pkgA> X→Y, <pkgB> A→B, ...

- 直接依存: <list>
- 間接依存 refresh: <list>
- resolutions/overrides 例外: <pkg> (該当時のみ)
  理由: <upstream 全 stable 版で同一 pin のため等>

Verified with `<pm> lint`, `<pm> build`<, dev smoke if done>.
```

### push 前の必須確認

**Interactive モードの場合のみ** `AskUserQuestion` で以下を選ばせる:

1. **main 直 push** — 直近の commit history に従う場合
2. **feature branch + PR** — レビューを通したい場合
3. **ローカルコミットのみ** — 後でユーザーが手動 push

**Autonomous モード** では確認をスキップし、固定で「feature branch + PR」(下記 §8.5) を実行する。

### supersede された Dependabot PR のクローズ (interactive + main 直 push 時のみ)

main 直 push を選んだ場合のみ実施。**autonomous モードでは絶対に行わない** (人間レビューを通さず Dependabot PR を閉じてしまうと監査ログが壊れるため):

```bash
gh pr list --state open --json number,title,headRefName --jq '.[] | select(.headRefName | startswith("dependabot/"))'
# 該当 PR ごとに:
gh pr close <#> --comment "Superseded by <commit-sha> which resolves the same advisory along with others."
```

### §8.5. PR 作成手順 (autonomous 必須、interactive で branch 選択時も同様)

```bash
DATE=$(date -u +%Y%m%d)
BRANCH="fix/dependabot-auto-${DATE}"

# 変更を退避 → ブランチ切替 → 復元 (clean tree なら stash は no-op)
git stash --include-untracked --quiet
git checkout -b "$BRANCH"
git stash pop --quiet 2>/dev/null || true

# (実際の編集と install は §6 までに完了している前提)
git add <変更ファイル>
git commit -m "<§8 のコミットメッセージ>"
git push -u origin "$BRANCH"

gh pr create \
  --title "fix: auto-resolve Dependabot alerts (${DATE})" \
  --body "$(cat <<EOF
このPRは \`resolve-dependabot\` スキルが autonomous モードで自動生成しました。レビュー後にマージしてください。

## 解決対象アラート
- #<番号>: <package> <old>→<new> [<severity>]
- ...

## 変更内容
- 直接依存: ...
- 間接依存 refresh: ...
- resolutions/overrides 例外: ... (該当時、理由付き)

## 検証結果
- \`<pm> lint\` ✓
- \`<pm> build\` ✓

このPRは自動生成です。CI を通過したらマージしてください。
EOF
)"
```

PR 作成失敗時 (gh CLI 認証エラー、ブランチ衝突等) は `gh issue create` で失敗記録を残して終了する。

## 9. 最終再スキャン (push した場合のみ)

push 後、GitHub 側で yarn.lock の再スキャンが走る (通常 15-30s)。

```bash
sleep 20
gh api repos/:owner/:repo/dependabot/alerts --jq '[.[] | select(.state == "open")] | length'
```

- **0 でなければ新規アラートを取得して §3〜§8 を繰り返す**。push をトリガーにそれまで隠れていた advisory が浮上することがある (前回セッションで `ws@8.19.0 → 8.20.1` の追加対応が発生した実例あり)。
- 0 で完了。最終サマリーを出力する。

## 10. 最終出力フォーマット

```md
## Dependabot 解決完了

**変更**:
- 直接依存: <pkg> <old>→<new> (×N 件のアラートをクローズ)
- 間接依存: <pkg> <old>→<new>
- resolutions/overrides 例外: <pkg> (該当時のみ、理由付き)

**コミット**: <sha1>, <sha2>
**閉じた PR**: #<n> (supersede)
**Open alerts**: 0 ✓
```
