# PLAN: 英語版Visual Thinkingページの検出とvt_config.json更新

## 現状

- vt_config.jsonに27ページのVisual Thinkingがある（ID 13は欠番）
- 全て`page_en: null`（英語版未設定）
- 英語版Markdownは以下の2箇所に存在する可能性：
  1. `modules/mem/data/en/pages/`（memリポジトリ内）
  2. `modules/external_brain_in_markdown_english/pages/`（サブモジュール）
- 英語版のフッターに以下のパターンで元ページへの参照がある：
  ```
  This page is auto-translated from [/nishio/日本語ページ名](https://scrapbox.io/nishio/日本語ページ名)
  ```

## 目標

1. 各日本語ページ名（例: `ブロードリスニング`）に対応する英語版ページを見つける
2. 英語版のfrontmatterから`title`を取得（例: `broad listening`）
3. vt_config.jsonの各illustの`page_en`フィールドを更新

## 検証済みの事実

- Grepツールで`/nishio/ブロードリスニング`を検索すると以下が見つかった：
  - `modules/external_brain_in_markdown_english/pages/broad listening.md`
  - `modules/external_brain_in_markdown_english/pages/What is Broad Listening?.md`
- ファイル名からは日本語ページ名を推測できない（翻訳されている）
- フッター内の参照パターンを使った検索が必要

## アプローチ

### ステップ1: 手動で数ページテスト

まず3ページほど手動で確認：
1. Grepツールで`/nishio/<日本語ページ名>`を検索
2. 見つかったファイルをReadツールで読む
3. frontmatterのtitleを確認
4. パターンが正しいか検証

### ステップ2: スクリプト作成

確認できたパターンに基づいて、シンプルなNode.jsスクリプトを作成：

**入力**:
- vt_config.jsonから各`page_ja`を読む

**処理**:
各ページに対して：
1. `find`コマンドと`grep`を組み合わせて検索
   ```bash
   find <dir> -name "*.md" -type f -exec grep -l "/nishio/<page_ja>" {} \; | head -1
   ```
2. 見つかったファイルのfrontmatterから`title`を抽出
3. `page_en`に設定

**出力**:
- 更新されたvt_config.json
- 検索結果のサマリー（found: X, not found: Y）

### ステップ3: vt_config.json更新

スクリプトを実行して更新

### ステップ4: テスト

開発サーバーで以下を確認：
- `/ja/vt` - 日本語版一覧
- `/en/vt` - 英語版一覧
- `/en/vt/1` - 個別ページ（英語版）

## 想定される問題と対策

### 問題1: 英語版が存在しないページがある

**対策**:
- スクリプトで「not found」をカウント
- 該当ページはetude-github-actionsで翻訳する必要がある

### 問題2: 複数の英語版ファイルがマッチする

**対策**:
- `head -1`で最初の1件のみ使用
- 必要に応じて手動で確認

### 問題3: findコマンドが遅い

**対策**:
- 1ページずつ順次実行（並列化しない）
- プログレス表示で進捗を確認

## 次のアクション

1. ✅ このPLANファイルを作成
2. ✅ 手動で3ページテスト
3. ✅ スクリプト作成
4. ✅ スクリプト実行
5. ✅ テスト完了

---

## テスト結果（2025-11-14）

### 実行環境
- Next.js 15.5.6
- ローカル開発サーバー: http://localhost:3001

### テスト内容

#### 1. `/en/vt` - 英語版一覧ページ
**結果**: ✅ 成功

- 20個のタイル表示（`page_en`がnullの7ページは表示されない）
- 各タイルに画像が表示される
- IntroSection（英語版の解説）が表示される
- 言語切り替えリンク `[日本語]` が機能する

#### 2. `/en/vt/1` - 英語版個別ページ（broad listening）
**結果**: ✅ 成功

- タイトル: "broad listening" が表示される
- Gyazo画像が正しく表示される
- 「Show Description」ボタンが機能する
- モーダルに英語のタイトルと説明が表示される
- 「Read More →」リンクが新しいタブで `/en/broad listening` を開く

#### 3. `/en/vt/11` - 英語版が存在しないページ（FLAT-STEP→NAMERAKA）
**結果**: ✅ 成功（UX改善実施）

**実装前の動作**:
- `/ja/vt/11` にリダイレクトされる
- 英語を期待したユーザーが混乱する

**実装後の動作**:
- 画像が表示される（日本語版ファイルから取得）
- 英語UIを維持（ボタンなどは英語のまま）
- 「Show Description」ボタンをクリックすると:
  - タイトル: "English Version Not Available Yet"
  - 説明: "This visual thinking illustration does not have an English description yet. You can view the Japanese version instead."
  - リンク: "View Japanese Version →" → `/ja/FLAT-STEP→NAMERAKA` に遷移（新しいタブ）

### コード変更

#### `pages/[lang]/vt/[page].tsx`

**Type定義の追加**:
```typescript
type Props = {
  // ... existing props
  noEnglishVersion: boolean;
  jaPageName: string;
};
```

**getStaticPropsの変更**:
1. 英語版が存在しない場合、リダイレクトせず `noEnglishVersion: true` を設定
2. 日本語ファイルから画像のみ取得
3. `jaPageName` を保存

**UI変更**:
モーダル内で `noEnglishVersion` の場合に専用メッセージを表示し、日本語版詳細ページへのリンクを提供。

### 統計

- **vt_config.json**: 27ページ（ID 13は欠番）
- **英語版対応**: 20/27ページ（74%）
- **未対応**: 7ページ
  - ID 11: FLAT-STEP→NAMERAKA
  - ID 20: 辺縁が育てばそれが中心
  - ID 21: 辺縁での湧き出しを中とするか外とするか
  - ID 22: 湧き出すひとの移動
  - ID 24: 分布の中央から削減される
  - ID 26: 情報の価値は人によって異なる
  - ID 27: 分布を観察して気づくこと

### 今後の課題

1. **残り7ページの翻訳**
   - etude-github-actionsで翻訳パイプライン実行
   - 再度 `scripts/find_en_pages_fast.js` を実行して `vt_config.json` 更新

2. **SEO対策**
   - 英語版が存在しないページに `<link rel="alternate" hreflang="ja">` を追加
   - `robots.txt` で英語版未対応ページの扱いを検討

3. **アクセシビリティ改善**
   - モーダルに `role="dialog"` と `aria-labelledby` を追加
   - キーボードナビゲーション（Escapeキーでモーダルを閉じる）
