---
name: resolve-dependabot
description: GitHub Dependabot アラートを洗い出し、`resolutions` を極力避けて大元ライブラリのアップデートで解決する。直接依存は manifest を bump、間接依存は lockfile refresh、内部 pin で更新不能な場合のみ resolutions を例外適用する。commit / push / CI グリーンでの auto-merge / supersede PR クローズ / 最終再スキャンまで含み、アラートが実際に close されるところまで見届ける。
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

- §8 の `AskUserQuestion` (push 方針確認) は **必ずスキップ** し、「ブランチ + PR + auto-merge」パスを強制する
- ブランチ名は **固定で `chore/dependabot-auto`** (日付を付けない)。既に open な PR があれば同じブランチに push して **その PR を更新**する
- **main への直 push は禁止**。ただし PR には `gh pr merge --auto --squash` を設定し、CI グリーンで自動的に main へ入る (§0.5)
- PR 本文に「このスキルが autonomous モードで自動生成したこと」「元アラート番号一覧」を明記
- §7 lint/build が **ローカルで実行できない場合は abort せず**、CI に検証を委ねて PR を作る (§0.6)
- §7 lint/build を実行できて **失敗した**場合のみ commit せず、§0.7 の単一トラッキング Issue を更新して終了
- open アラート 0 件なら no-op で `"no open alerts"` ログを残して終了

### §0.5 ループを閉じる仕組み (最重要)

**このスキルの autonomous 実行だけではアラートは閉じない。** PR が main にマージされて初めて Dependabot はアラートを close する。
過去に約 30 回連続で失敗した原因がこれで、PR を作るだけで誰もマージせず、アラートが無限に滞留した。

ループを閉じるのは以下の 3 点セット。**どれか 1 つでも欠けたら機能しない**ので、実行時に存在を確認すること。

| 部品 | 役割 | 確認コマンド |
|---|---|---|
| `.github/workflows/ci.yml` | PR 上で lint/build を検証する | `gh api repos/:owner/:repo/contents/.github/workflows/ci.yml --silent` |
| main の required status check | CI 未通過の PR がマージされないようにする | `gh api repos/:owner/:repo/branches/main/protection/required_status_checks -q .contexts` |
| `gh pr merge --auto --squash` | CI グリーンで自動マージ | PR 作成直後に必ず実行 |

欠けている場合は §0.7 の Issue に「どの部品が欠けているか」を明記する。

さらに `.github/workflows/dependabot-auto-merge.yml` が Dependabot 自身の PR を自動マージする。
**このスキルが動けない環境でもアラートが解消される主経路はこちら**であり、本スキルは Dependabot が扱えないケース
(resolutions が必要な内部 pin、複数 advisory の同時解決など) の backstop と位置づける。

### §0.6 ネットワーク遮断環境でのフォールバック

実行サンドボックスから npm/yarn レジストリへ到達できず `yarn install` が失敗することがある
(`registry.npmjs.org:443` への CONNECT が 403、`repo.yarnpkg.com` へ `fetch failed` 等)。
**この場合に abort してはならない。** 過去の失敗の大半がこれで、毎回 Issue だけ積み上がった。

判定と行動:

```bash
# レジストリ到達性を先に測る (install より前)
timeout 30 npm view tar version >/dev/null 2>&1 && echo REACHABLE || echo BLOCKED
```

- **REACHABLE**: 通常どおり §6 → §7 (lint/build) → §8.5 (PR + auto-merge)
- **BLOCKED**:
  1. lockfile を書き換える作業は **できない** (transitive 更新にはレジストリが要る)。無理に試さない。
  2. 代わりに **Dependabot 自身の PR に auto-merge を付けて回る**。これが唯一そのアラートを閉じられる手段:
     ```bash
     gh pr list --state open --author 'app/dependabot' --json number,title \
       --jq '.[] | "\(.number)\t\(.title)"'
     # 各 PR に対して:
     gh pr merge <#> --auto --squash
     ```
  3. `package.json` の**直接依存の bump だけ**なら lockfile 無しでも意味を持たないため行わない。
  4. 1〜2 を実施したうえで §0.7 のトラッキング Issue を更新して終了。**新規 Issue は作らない**。

### §0.7 単一トラッキング Issue (Issue 濫造の禁止)

**実行のたびに新しい Issue を立ててはならない。** 過去に日次で 30 件超の失敗 Issue が生成され、
本当に対応が要る情報が埋もれた。

固定タイトル `Dependabot auto-resolve: status` の Issue を 1 件だけ使い回す:

```bash
EXISTING=$(gh issue list --state open --search 'in:title "Dependabot auto-resolve: status"' \
  --json number --jq '.[0].number')

if [ -n "$EXISTING" ]; then
  gh issue comment "$EXISTING" --body "$REPORT"    # 追記のみ
else
  gh issue create --title "Dependabot auto-resolve: status" --body "$REPORT"
fi
```

- 成功して open アラートが 0 になったら、その Issue は `gh issue close` する。
- 連続失敗時は同じ Issue にコメントを積むだけにし、タイトルは変えない。

## 1. 役割と禁則

- **DEFAULT**: `package.json` の直接依存を bump、間接依存は lockfile refresh で解決する。
- **禁則**: 最初から `resolutions` / `overrides` を入れることは禁止。理由・代替検証なしに使うのは NG。
- **例外条件 (resolutions / overrides 許可)**: 親パッケージが脆弱版を `"x.y.z"` 形式で **厳密ピン** しており、かつ **公開されている全 stable バージョン** で同じピンが続いていることを `npm view` で実測検証した場合のみ。採用時はコミットメッセージに理由を必ず明記する。
- **push 方針** (interactive モード): 必ずユーザー確認後。`AskUserQuestion` で「main 直 push / feature branch + PR / ローカルのみ」を選ばせる。
- **push 方針** (autonomous モード): §0 参照。確認スキップで固定ブランチ + PR + auto-merge、main 直 push は禁止。
- 検証 (lint / build) が失敗したら commit/push に進まず即時報告 (autonomous は §0.7 のトラッキング Issue に追記)。
- **成果の定義は「PR を作ったこと」ではなく「open アラートが減ったこと」**。PR を作って終わりにしない (§0.5)。

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

**ブランチは固定名を使い回す。** 日付付きブランチを毎回切ると、同じ修正の PR が何本も並走して滞留する
(実際に #18 / #40 / #43 / #55 が同一の tar 修正で 4 本溜まった)。

```bash
BRANCH="chore/dependabot-auto"
DATE=$(date -u +%Y-%m-%d)

# 変更を退避 → 最新 main から固定ブランチを作り直す → 復元
git stash --include-untracked --quiet
git fetch origin main
git checkout -B "$BRANCH" origin/main
git stash pop --quiet 2>/dev/null || true

# (実際の編集と install は §6 までに完了している前提)
git add <変更ファイル>
git commit -m "<§8 のコミットメッセージ>"
git push -u --force-with-lease origin "$BRANCH"
```

既存 PR の有無で分岐する:

```bash
PR=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number')

if [ -n "$PR" ]; then
  gh pr comment "$PR" --body "${DATE}: 最新の main に載せ直し、新規アラートを取り込んで更新しました。"
else
  PR=$(gh pr create \
    --title "chore: auto-resolve Dependabot alerts" \
    --body "$(cat <<'EOF'
このPRは `resolve-dependabot` スキルが autonomous モードで自動生成しました。
CI (`lint + build`) がグリーンになり次第 auto-merge で main に入ります。

## 解決対象アラート
- #<番号>: <package> <old>→<new> [<severity>]

## 変更内容
- 直接依存: ...
- 間接依存 refresh: ...
- resolutions/overrides 例外: ... (該当時、理由付き)

## 検証結果
- `<pm> lint` ✓ / ✗ (ローカル実行不可の場合は CI に委譲)
- `<pm> build` ✓ / ✗
EOF
)" --json number --jq .number)
fi

# ★ ここを飛ばすとループが閉じない (§0.5)
gh pr merge "$PR" --auto --squash
```

`gh pr merge --auto` が `Auto-merge is not allowed for this repository` で失敗する場合、
リポジトリ設定の auto-merge が無効。以下で有効化してから再実行する:

```bash
gh api -X PATCH repos/:owner/:repo -f allow_auto_merge=true
```

PR 作成失敗時 (gh CLI 認証エラー、ブランチ衝突等) は §0.7 のトラッキング Issue に追記して終了する。

## 9. 最終再スキャン

### Interactive で main に push した場合

push 後、GitHub 側で yarn.lock の再スキャンが走る (通常 15-30s)。

```bash
sleep 20
gh api repos/:owner/:repo/dependabot/alerts --jq '[.[] | select(.state == "open")] | length'
```

- **0 でなければ新規アラートを取得して §3〜§8 を繰り返す**。push をトリガーにそれまで隠れていた advisory が浮上することがある (前回セッションで `ws@8.19.0 → 8.20.1` の追加対応が発生した実例あり)。
- 0 で完了。最終サマリーを出力する。

### Autonomous の場合

auto-merge 待ちなので即時に 0 にはならない。**代わりに「前回の実行がちゃんと着地したか」を毎回検証する**
— これを見ていなかったために 30 回連続の空振りに気付けなかった。

```bash
# 1. 固定ブランチの PR が前回から居座っていないか
gh pr list --head chore/dependabot-auto --state open \
  --json number,createdAt,autoMergeRequest \
  --jq '.[] | "PR #\(.number) created=\(.createdAt[0:10]) auto_merge=\(.autoMergeRequest != null)"'

# 2. CI の直近の結果
gh pr checks "$PR" 2>&1 | tail -5
```

判定:

- `auto_merge=false` → §8.5 の `gh pr merge --auto --squash` が抜けている。今すぐ設定する。
- `auto_merge=true` なのに 3 日以上 open → CI が落ち続けているか required check 名が不一致。
  `gh pr checks` の失敗内容を §0.7 のトラッキング Issue に貼り、**原因を書く** (「失敗しました」だけの報告は禁止)。
- PR が無く open アラートも 0 → 正常。トラッキング Issue が open なら close する。

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
