# mem - プロジェクト固有の指示

このドキュメントはClaude Code用のプロジェクト固有の指示です。

## プロジェクト概要

Next.js製の静的サイトで、Scrapboxのコンテンツを配信するサイトです。

- **デプロイ先**: Vercel (https://mem.nhiro.org/)
- **デフォルトブランチ**: `master`（注意：他のリポジトリは`main`）
- **フレームワーク**: Next.js
- **言語**: TypeScript

## 開発ワークフロー

### ⚠️ 重要：Push前の必須チェック

**memリポジトリにpushする前に、必ずローカルでビルドして型エラーがないかを確認すること**

```bash
# ビルドコマンド
yarn build

# または
npm run build
```

**理由**:
- Next.jsはビルド時に型チェックを行う
- 型エラーがあるとVercelのデプロイが失敗する
- ローカルで事前に確認することでデプロイ失敗を防げる

**チェックリスト**:
- [ ] `yarn build` が成功することを確認
- [ ] TypeScriptの型エラーがないことを確認
- [ ] eslint/prettier の警告を確認（必要に応じて修正）
- [ ] コミット・プッシュ

### ブランチとデプロイ

- **master**: 本番環境（Vercelに自動デプロイ）
- プッシュすると即座に本番反映されるため慎重に

## ディレクトリ構造

```
pages/
├── [lang]/
│   ├── [page].tsx        # Markdownページ（/ja/<page>, /en/<page>）
│   └── vt/
│       ├── index.tsx     # Visual Thinking一覧
│       └── [page].tsx    # Visual Thinking個別ページ
├── legacy/
│   └── [page].tsx        # Scrapbox API経由のページ
├── admin/
│   └── vt.tsx            # Visual Thinking管理画面（開発環境のみ）
└── api/
    └── vt/
        ├── scan.ts       # ページスキャンAPI
        ├── add.ts        # イラスト追加API
        └── skip.ts       # スキップ登録API

data/
├── ja/pages/             # 日本語Markdownファイル
└── en/pages/             # 英語Markdownファイル

vt_config.json            # Visual Thinking設定ファイル
```

## 設定ファイル

### vt_config.json

Visual Thinkingのコンテンツを管理する設定ファイル。

```json
{
  "illusts": [
    {
      "id": 1,
      "page_ja": "ページ名",
      "page_en": null,
      "tags": []
    }
  ],
  "skipped": ["スキップしたページ名"]
}
```

- **手動編集は非推奨**: 管理画面（`/admin/vt`）から操作すること
- **id**: 数値（ゼロパディングなし）
- **skipped**: 「追加しない」と判断したページのリスト

## 開発環境

### ローカルサーバー起動

```bash
yarn dev
# または
npm run dev
```

- デフォルトポート: 3000
- 管理画面: http://localhost:3000/admin/vt（開発環境のみアクセス可能）

### 管理画面（/admin/vt）

- **アクセス条件**: `NODE_ENV === 'development'` のみ
- **機能**:
  - Gyazo画像を含むページのスキャン
  - 候補ページの検索/フィルター
  - Add/Skipボタンでワンクリック管理
- **本番環境**: 404を返す（セキュリティ対策）

## URL構造

```
/                        # トップページ
/ja/<page>               # 日本語Markdownページ
/en/<page>               # 英語Markdownページ
/ja/vt                   # Visual Thinking一覧（日本語）
/ja/vt/<id>              # Visual Thinking個別ページ（例: /ja/vt/1）
/legacy/<page>           # Scrapbox API経由（後方互換性）
/admin/vt                # 管理画面（開発環境のみ）
```

## トラブルシューティング

### TypeScriptエラー

```bash
# 型チェックのみ実行
yarn tsc --noEmit
```

### ビルドエラー

```bash
# クリーンビルド
rm -rf .next
yarn build
```

### Vercelデプロイ失敗

1. ローカルで `yarn build` が成功するか確認
2. GitHubのActionsログを確認
3. Vercelのデプロイログを確認

### vendor-chunksエラー（Next.js dev環境）

**エラー例:**
```
Error: Cannot find module './chunks/vendor-chunks/next@15.5.6_react-dom@18.3.1_react@18.3.1__react@18.3.1.js'
```

**原因:**
- 複数のNext.js devプロセスが同時に動いている
- 異なるバージョンのNext.jsが同じ`.next`ディレクトリを共有している

**解決手順:**

1. **プロセス確認**
```bash
ps aux | grep "next dev" | grep -v grep
```

2. **全プロセスを停止**
```bash
kill <PID1> <PID2> ...
```

3. **ビルドキャッシュを削除**
```bash
rm -rf .next .turbo
```

4. **単一プロセスで再起動**
```bash
pnpm next dev
# または yarn dev / npm run dev
```

## 開発サーバーのベストプラクティス

### ⚠️ 重要：単一プロセスの原則

**必須ルール:**
- **1つのプロジェクトにつき、Next.js devプロセスは1つだけ起動する**
- 新しいdevサーバーを起動する前に、既存のプロセスを確認すること
- ポートが変わったとき（例: 3000 → 3001）は、別プロセスが動いている可能性がある

### 起動前のチェック

```bash
# 既存のプロセスを確認
ps aux | grep "next dev" | grep -v grep

# もしプロセスが見つかったら停止
kill <PID>
```

### よくある問題と原因

**複数プロセスが起動してしまうケース:**

1. **monorepo環境**: 親ディレクトリと子ディレクトリで別々にdevを起動
2. **ターミナル多重起動**: 別ターミナルでdevを重複起動
3. **バックグラウンド実行**: 過去に起動したプロセスが残っている

**結果として起こる問題:**
- vendor-chunksエラー（モジュールが見つからない）
- ビルドキャッシュの競合
- CPU使用率の異常な上昇
- ホットリロードの不安定化

### 復旧テンプレート

開発環境が不安定になった場合の標準手順：

```bash
# 1. 全devプロセスを停止
ps aux | grep "next dev" | grep -v grep
kill <全てのPID>

# 2. ビルドキャッシュを完全削除
cd /path/to/mem
rm -rf .next .turbo

# 3. 依存関係を確認（必要なら）
pnpm install

# 4. 単一プロセスで再起動
pnpm next dev
```

### バージョン確認

vendor-chunksエラーが頻発する場合、依存関係のバージョン混在を確認：

```bash
pnpm list next react react-dom
```

全てのバージョンが統一されているか確認し、複数バージョンが存在する場合は：

```bash
pnpm up next react react-dom
```

### Turbopack vs Webpack

Next.js 15はデフォルトでTurbopackを使用します。不安定な場合は、どちらかに明示的に固定すると安定しやすい：

**Webpackに固定:**
```json
// package.json
"scripts": {
  "dev": "next dev --webpack"
}
```

**Turbopackに固定:**
```json
// package.json
"scripts": {
  "dev": "next dev --turbopack"
}
```

固定後は `.next` を削除してから再起動すること。

## 多言語コンテンツの作成プロセス

### ⚠️ 重要：段階的なレビュープロセス

**多言語（日本語・英語）のコンテンツを作成する際は、以下のプロセスを厳守すること:**

1. **まず日本語版のみを作成**
   - 解説文、UI文言など、新しいコンテンツは日本語版だけを実装
   - コードには日本語版のみを含める状態でコミット

2. **人間にレビューを求める**
   - 日本語版の内容を提示
   - ユーザーの承認を得る
   - 必要に応じて修正

3. **承認後、英語版を作成**
   - 日本語版がOKであれば、英語版を追加
   - 英語版も同様にレビューを得る

**なぜこのプロセスが必要か:**
- 内容の確認が一度に一言語だけなので、レビューしやすい
- 誤った内容が両言語に広がるのを防ぐ
- 日本語ネイティブのユーザーにとって、日本語での確認が最も正確

**例外:**
- 既存の確立されたパターン（ボタンラベルなど）を踏襲する場合は、両言語同時でも可

## 注意事項

### 破壊的変更

URL構造の変更は破壊的変更になるため慎重に：
- 既存のブックマークが無効になる
- SEOに影響する可能性
- コンテンツが少ない段階で実施すべき

### サブモジュール

このリポジトリは `external_brain_management` のサブモジュールとして管理されています。

- **親リポジトリでの更新**: `git add modules/mem && git commit && git push`
- **サブモジュール内での作業後**: 必ず親リポジトリのポインタも更新

## Visual Thinking翻訳の更新手順

### ⚠️ 重要：日本語版が更新されたら英語版も更新する

日本語版Visual ThinkingページがScrapboxで更新された場合、**英語版の高品質翻訳も必ず更新すること**。

**更新プロセス：**

1. **vt_config.jsonで該当ページのpage_enを一時的にnullに設定**
   ```json
   {
     "id": 11,
     "page_ja": "FLAT-STEP→NAMERAKA",
     "page_en": null,  // 一時的にnullにする
     "tags": []
   }
   ```

2. **翻訳スクリプトを実行**
   ```bash
   cd modules/mem
   pnpm tsx scripts/translate_vt_pages.ts
   ```
   - OpenAI gpt-4oで高品質翻訳を生成
   - `translations/vt/` ディレクトリに出力

3. **翻訳結果をレビュー**
   - `translations/vt/<id>_<page_ja>.md` を確認
   - 必要に応じて手動修正

4. **翻訳ファイルを移動**
   ```bash
   pnpm tsx scripts/move_vt_translations.ts
   ```
   - `../external_brain_in_markdown_english/pages/` にコピー

5. **external_brain_in_markdown_englishでコミット**
   ```bash
   cd ../external_brain_in_markdown_english
   git add "pages/<英語タイトル>.md"
   git commit -m "Update <page_ja> translation"
   git push
   ```

6. **vt_config.jsonを手動更新**
   - `page_en` フィールドに英語タイトルを設定
   - 自動検出スクリプト（find_en_pages_fast.js）は遅いため手動推奨

7. **memでコミット**
   ```bash
   git add vt_config.json
   git commit -m "Update vt_config.json with new translation for ID <id>"
   git push
   ```

**重要な注意点:**
- Visual Thinkingは画像が言語非依存なので、画像は常に日本語版から取得
- 説明文のみ英語版から取得するため、翻訳更新が必須
- フッター「This page is a high-quality translation from...」が自動追加される

**なぜこの手順が必要か:**
- Scrapboxの日本語版が更新されても、external_brain_in_markdown_englishは自動更新されない
- 手動で翻訳を再実行しないと、古い説明文が表示され続ける
- ユーザーは最新の情報を期待しているため、翻訳の鮮度維持が重要

## 参考資料

- [PLAN_ILLUST_IMPROVEMENT.md](./PLAN_ILLUST_IMPROVEMENT.md) - Visual Thinking実装計画
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
