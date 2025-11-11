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

## 参考資料

- [PLAN_ILLUST_IMPROVEMENT.md](./PLAN_ILLUST_IMPROVEMENT.md) - Visual Thinking実装計画
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
