# sample-webapp-2026

`flaker` と `vrt` の使い方をまとめて確認できる、Vite + React ダッシュボード / Hono API のリファレンスです。

このリポジトリで示していること:

- Hono API と Vite React dashboard を分けた構成
- Playwright E2E を `flaker` の runner に載せる方法
- `vrt snapshot` で operator view の visual regression を見る方法
- GitHub Actions の定期バッチで quality signal を集め、Codex で自動改善 PR を起こす流れ

## レイアウト

- `apps/api`: Hono API
- `apps/dashboard`: Vite + React ダッシュボード
- `packages/contracts`: API / UI で共有する Zod contract
- `scripts/run-flaker.mjs`: sibling `flaker` repo を叩くラッパー
- `scripts/run-vrt.mjs`: sibling `vrt` repo を叩くラッパー
- `scripts/vrt-snapshot.mjs`: route 一覧を使って snapshot と markdown summary を生成
- `vrt/dashboard`: 画面ごとの committed baseline

## ローカル前提

ローカルでは次のように repo を横並びに置く想定です。

```text
../flaker
../vrt
../sample-webapp-2026
```

初回セットアップ:

```bash
pnpm install
pnpm --dir ../flaker install
pnpm --dir ../vrt install

pnpm exec playwright install chromium
pnpm --dir ../vrt exec playwright install chromium
```

## 開発

```bash
pnpm dev
```

- dashboard: `http://127.0.0.1:4173`
- api: `http://127.0.0.1:8787`

主要コマンド:

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`just` からも同じ流れを呼べます。

## flaker

このプロジェクトでは `flaker.toml` を Playwright runner 向けに固定しています。

```bash
pnpm flaker:run:local
pnpm flaker:run:actrun
pnpm flaker:collect:local
pnpm flaker:run:scheduled
pnpm flaker:eval:markdown
```

ポイント:

- runner は `pnpm exec playwright test -c playwright.config.ts`
- `actrun` 用 workflow path は `flaker.toml` の `[runner.actrun].workflow = ".github/workflows/flaker-local.yml"`
- local profile は affected 優先
- scheduled profile は full 実行
- DB は `.flaker/data.duckdb`

`actrun` でローカル実行するときの明示的な path:

```bash
actrun workflow run .github/workflows/flaker-local.yml
pnpm flaker:collect:local
```

`pnpm flaker:run:actrun` でも同じ workflow path を使います。

## vrt

`vrt snapshot` は query ではなく path ごとに baseline を分けています。

```bash
pnpm vrt:snapshot
pnpm vrt:snapshot:ci
pnpm vrt:approve
```

対象 route:

- `/`
- `/critical`
- `/services/payments`

baseline は `vrt/dashboard/*-baseline.png` に commit されます。差分確認だけなら `pnpm vrt:snapshot:ci`、意図した変更を baseline に反映するときは `pnpm vrt:approve` を使います。

## GitHub Actions

### CI

`.github/workflows/ci.yml` は次を実行します。

- side-by-side checkout: `sample-webapp-2026`, `.tools/flaker`, `.tools/vrt`
- typecheck
- unit test
- Playwright E2E
- `vrt:snapshot:ci`

### Nightly Auto Improve

`.github/workflows/nightly-auto-improve.yml` は次を実行します。

1. unit / e2e / `flaker` / `vrt` の signal を収集
2. `.artifacts/nightly-context.md` を生成
3. `openai/codex-action` で low-risk な改善を 1 つ試す
4. diff があれば draft PR を自動作成

必要な secret:

- `OPENAI_API_KEY`

### Weekly Review Issue

`.github/workflows/weekly-review.yml` は GitHub Actions だけで週次レビュー issue を起こします。

1. typecheck / unit / e2e / `flaker` / `vrt` を実行
2. `.artifacts/weekly-review.md` を生成
3. `weekly review: YYYY-Www` 形式の issue を create または update

GitHub 組み込みだけで回すため、AI 改善 PR は作らず、レビュー結果を `weekly-review` / `quality` ラベル付き issue に集約します。

## 検証済みコマンド

staging で確認したもの:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm flaker:run:scheduled`
- `pnpm flaker:eval:markdown`
- `pnpm vrt:snapshot:ci`
