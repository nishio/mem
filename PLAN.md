# イラストビュー実装計画

## 目的

xkcd風のイラストをまとめて表示するビューを実装する。

## 現在のルーティング構造

### 既存のページタイプ

```
/                       ← トップページ（index.tsx）
/dashboard              ← ダッシュボード（dashboard.tsx）
/nishio/<page>          ← Scrapbox APIから直接取得（リアルタイム）
/ja/<page>              ← Markdownから表示（external_brain_in_markdown）
/en/<page>              ← Markdownから表示（external_brain_in_markdown_english）
```

### PR#1の変更（✅ マージ済み）

- `/<page>` → `/legacy/<page>` へのrewrite追加
- 互換性維持のため既存のURLをサポート
- `/ja`, `/en`, `/legacy`, `/dashboard`などは除外
- `pages/nishio/[page].tsx` → `pages/legacy/[page].tsx` にリネーム

## イラストビューの設計

### URL構造

**決定**: `/ja/illust/<page>` および `/en/illust/<page>` を採用

**理由**:
- 言語コードを最上位に配置（i18nのベストプラクティス）
- 既存の`/ja/<page>`構造と一貫性がある
- PR#1のrewriteルールと衝突しない
- 拡張性がある（将来的に`/ja/gallery/<page>`なども追加可能）

### ディレクトリ構造

```
pages/
  [lang]/
    [page].tsx              ← 既存: 通常のMarkdownページ
    illust/
      [page].tsx            ← 新規: イラストビュー
      index.tsx             ← 新規: イラスト一覧（オプション）
```

### データソース（✅ 決定：オプションA）

**決定事項**:
- 既存のMarkdownファイル（`data/ja/pages/*.md`）を使用
- JSON設定ファイルで表示対象を管理
- 段階的実装：まず1つのURLから開始

#### 設定ファイル構造

```json
// illust_config.json
{
  "illusts": [
    {
      "id": "001",
      "page_ja": "ブロードリスニング",
      "page_en": "Broad_Listening",  // 英語版ページ名（将来対応）
      "tags": ["xkcd", "communication"]
    },
    {
      "id": "002",
      "page_ja": "ツリーとリゾーム",
      "page_en": null,  // 英語版未対応の場合はnull
      "tags": ["philosophy", "structure"]
    }
  ]
}
```

**フェーズ1実装時の注意**:
- `page_ja`のみを使用（`page_en`は予約フィールドとして定義のみ）
- `/ja/illust/<id>` → `page_ja`でMarkdownを取得

#### データフロー

```
既存Markdown (data/ja/pages/Illustration_Title.md)
    ↓
illust_config.json (表示対象として登録)
    ↓
/ja/illust/001 (URLでアクセス)
    ↓
pages/[lang]/illust/[page].tsx (レンダリング)
```

#### メリット
- 既存のMarkdownワークフローをそのまま利用
- Scrapboxからの変換パイプラインも既存のまま
- JSON設定で柔軟な管理が可能
- 段階的な追加が容易

#### 将来の拡張
- 条件による一括追加（例：特定のタグを持つページを自動登録）
- メタデータの拡張（作成日、説明文、サムネイルなど）

### レイアウト設計

イラストビューには以下の要素を含める：

```
┌─────────────────────────────────┐
│ Header (言語切り替え、トップへ)    │
├─────────────────────────────────┤
│ Title                           │
├─────────────────────────────────┤
│                                 │
│      Large Image Display        │
│                                 │
├─────────────────────────────────┤
│ Caption / Description           │
├─────────────────────────────────┤
│ Navigation (xkcd風):            │
│ |< <Prev Random Next> >|        │
├─────────────────────────────────┤
│ Tags / Metadata                 │
├─────────────────────────────────┤
│ Footer                          │
└─────────────────────────────────┘
```

## 実装手順

### フェーズ0: 準備

1. **設定ファイル作成**
   ```bash
   touch illust_config.json
   ```
   - 最初は3つのイラストだけ登録

2. **既存イラストページの確認**
   - `data/ja/pages/` から表示したいMarkdownファイルを特定
   - ページ名、画像URL、説明を確認

### フェーズ1: 最小実装（1つのイラストを表示）

1. **ファイル作成**
   ```bash
   mkdir -p pages/[lang]/illust
   touch pages/[lang]/illust/[page].tsx
   ```

2. **基本的なルーティングとレンダリング**
   - `pages/[lang]/[page].tsx`を参考に実装
   - `illust_config.json`から設定を読み込む
   - ID → ページ名のマッピング処理
   - `getStaticProps`と`getStaticPaths`を実装

3. **基本的なレイアウト**
   - シンプルな画像表示
   - タイトルと説明
   - 言語切り替え
   - 元のMarkdownページへのリンク

4. **動作確認**
   - `/ja/illust/001` にアクセスして表示確認
   - ビルドが通ることを確認

### フェーズ2: 機能拡張

5. **複数イラストの追加**
   - `illust_config.json`に2-3件追加
   - 動作確認

6. **ナビゲーション機能（xkcd風）**
   - `|<` 最初のイラストへ
   - `<Prev` 前のイラストへ
   - `Random` ランダムなイラストへ
   - `Next>` 次のイラストへ
   - `>|` 最後のイラストへ
   - イラスト一覧ページ（`/ja/illust/`または`/ja/illust/index`）

7. **メタデータ表示**
   - タグの表示
   - 作成日（Markdown front-matterから取得）
   - 関連ページへのリンク

8. **デザイン改善**
   - レスポンシブ対応
   - 画像の最適化（Next.js Image）
   - アクセシビリティ対応

### フェーズ3: 自動化・拡張

9. **設定ファイルの自動生成**
   - 特定の条件（タグ、ファイル名パターンなど）に基づいて`illust_config.json`を自動生成するスクリプト
   - 例：`generate_illust_config.py`

10. **英語版対応**
    - `/en/illust/<id>` の実装
    - 同じIDで日英ページをマッピング

    **実装方針**:
    ```typescript
    // pages/[lang]/illust/[page].tsx の getStaticProps 内
    const config = require('../../../illust_config.json');
    const illustItem = config.illusts.find(item => item.id === page);

    if (lang === 'ja') {
      pageName = illustItem.page_ja;
    } else if (lang === 'en') {
      if (!illustItem.page_en) {
        // 英語版が存在しない場合の処理
        return { notFound: true };
        // または日本語版へリダイレクト
      }
      pageName = illustItem.page_en;
    }
    ```

    **言語切り替えリンク**:
    - `/ja/illust/001` ↔ `/en/illust/001` （同じID）
    - 英語版が存在しない場合はリンクをグレーアウトまたは非表示

11. **データパイプライン統合（オプション）**
    - from_scrapboxでの特殊処理（必要な場合）
    - etude-github-actionsでの翻訳対応確認

## 決定事項まとめ

- ✅ データソース: オプションA（既存Markdown + JSON設定）
- ✅ URL形式: `/ja/illust/<id>` （idは連番: 001, 002, ...）
- ✅ 段階的実装: まず3つのイラストから開始
- ✅ PR#1: マージ済み
- ✅ ページ名: 日本語のままで良い（`page_ja`, `page_en`で管理）
- ✅ 画像: Gyazo（Markdown内の最初の画像を抽出）
- ✅ 初期イラスト:
  - 001: ブロードリスニング
  - 002: ツリーとリゾーム
  - 003: 単語を変えると誤解が拡大する

## 未解決/検討中の項目

1. **✅ 最初のイラストページ（決定済み）**
   - 001: ブロードリスニング
   - 002: ツリーとリゾーム
   - 003: 単語を変えると誤解が拡大する

2. **イラストの形式**
   - ✅ Markdownに埋め込まれた画像（Gyazo）
   - ✅ 画像URLの取得方法: 一番上にあるGyazoへのリンク
   - Markdown内の`![image](https://gyazo.com/...)`パターンをパース

3. **一覧ページの実装タイミング**
   - フェーズ2で実装？
     - 雑に一覧表示を作ってみて、それをみて改善
   - ダッシュボードへの統合も検討？
   　- No

## 関連資料

- [PR#1: Add redirect logic and rewrites](https://github.com/nishio/mem/pull/1)
- 既存実装: `pages/[lang]/[page].tsx`
- 既存実装: `pages/nishio/[page].tsx`
- external_brain_in_markdownリポジトリ

## 次のステップ

1. ✅ データソース決定（オプションA）
2. ✅ PR#1マージ確認
3. **最初のイラストページを選定**
4. **フェーズ0: 設定ファイル作成**
5. **フェーズ1: 最小実装開始**

## 技術スタック

```typescript
// 使用する主な機能・ライブラリ
- Next.js (既存)
- TypeScript (既存)
- gray-matter (既存: Markdown front-matter解析)
- marked (既存: Markdown → HTML変換)
- JSON設定ファイル (新規)
```

## ファイル一覧（予定）

```
modules/mem/
├── illust_config.json          (新規: イラスト設定)
├── pages/
│   └── [lang]/
│       └── illust/
│           ├── [page].tsx      (新規: 個別イラストページ)
│           └── index.tsx       (新規: 一覧ページ - フェーズ2)
└── components/                 (既存コンポーネントを再利用)
```
