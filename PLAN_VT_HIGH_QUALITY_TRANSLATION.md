# PLAN: Visual Thinking高品質翻訳

## 現状

- **vt_config.json**: 27ページ（ID 13は欠番）
- **英語版対応**: 20/27ページ（74%）
- **未翻訳**: 7ページ
  - ID 11: FLAT-STEP→NAMERAKA
  - ID 20: 辺縁が育てばそれが中心
  - ID 21: 辺縁での湧き出しを中とするか外とするか
  - ID 22: 湧き出すひとの移動
  - ID 24: 分布の中央から削減される
  - ID 26: 情報の価値は人によって異なる
  - ID 27: 分布を観察して気づくこと

**既存20ページの問題点**:
- すべてDeepLによる自動翻訳
- フッターに "This page is auto-translated from [/nishio/...] using DeepL"
- 品質にばらつきがある可能性

## 目標

**Visual Thinking専用の高品質翻訳を作成**

1. 残り7ページの高品質翻訳
2. 図解の文脈を理解した自然な英語
3. 専門用語の正確な翻訳
4. 国際的な読者にとって理解しやすい表現

## データフロー

### 入力データ
```
vt_config.json
  → page_ja (日本語ページ名)
    → modules/external_brain_in_markdown/pages/{page_ja}.md
      → frontmatter (title)
      → markdown content
      → Gyazo image URLs
      → [[wiki links]]
```

### 処理
```
Claude API
  + Visual Thinking専用プロンプト
  + 文脈理解
  + 専門用語保持
  → 高品質英語翻訳
```

### 出力データ
```
modules/mem/translations/vt/
  → {id}_{japanese_title}.md (レビュー用一時ファイル)
    ↓ 承認後
modules/external_brain_in_markdown_english/pages/
  → {english_title}.md (最終出力)
    ↓ コミット後
vt_config.json
  → page_en: "{english_title}" (更新)
```

## 翻訳プロセス

### ステップ1: 翻訳生成

**スクリプト**: `scripts/translate_vt_pages.ts`

**処理フロー**:
1. `vt_config.json`を読み込み
2. `page_en === null`のページを抽出
3. 各ページに対して:
   - 日本語MDファイルを読み込み
   - OpenAI API (gpt-4o)で翻訳
   - `translations/vt/{id}_{japanese_title}.md`に保存
4. 翻訳サマリーを表示（成功/失敗件数）

**OpenAI APIプロンプト** (gpt-4o, temperature: 0.3):
```
You are translating Visual Thinking diagram explanations from Japanese to English.

Context:
- Visual Thinking is a collection of diagrams by NISHIO Hirokazu that explain concepts visually
- These are thoughtful explanations of what diagrams represent
- The audience is international readers interested in philosophy, systems thinking, and knowledge work

Requirements:
1. Generate a clear, natural English title (max 80 chars)
2. Translate the content accurately while maintaining:
   - [[wiki-style links]] (keep brackets and translate content)
   - Gyazo image URLs (preserve exactly)
   - Technical and philosophical terms (accurate translation)
3. Make the text accessible to international readers
4. Do NOT add a translation footer
5. Preserve markdown formatting

Output format:
---
title: "English Title Here"
---

[Translated content]

---
This page is a high-quality translation from [/nishio/{japanese_page_name}](https://scrapbox.io/nishio/{japanese_page_name}). The original content is maintained by NISHIO Hirokazu.

Source (Japanese):
{japanese_content}
```

### ステップ2: 人間レビュー

**レビュー対象**:
- `modules/mem/translations/vt/` 内の7ファイル

**チェック項目**:
- [ ] タイトルが適切か
- [ ] 図解の説明として自然な英語か
- [ ] 専門用語が正確か
- [ ] [[リンク]]が保持されているか
- [ ] Gyazo画像URLが保持されているか
- [ ] frontmatterが正しいか

**修正方法**:
- 直接ファイルを編集
- または翻訳スクリプトのプロンプトを改善して再実行

### ステップ3: external_brain_in_markdown_englishにコミット

**手順**:
1. レビュー済みファイルを移動:
   ```bash
   mv translations/vt/11_FLAT-STEP→NAMERAKA.md \
      ../external_brain_in_markdown_english/pages/"FLAT-STEP to SMOOTH.md"
   ```
2. コミット:
   ```bash
   cd ../external_brain_in_markdown_english
   git add pages/*.md
   git commit -m "feat: add high-quality VT translations (7 pages)"
   git push
   ```

### ステップ4: vt_config.json更新

**方法1: 手動更新**
- 各ページの`page_en`を英語タイトルに更新

**方法2: スクリプト自動更新**
- `scripts/find_en_pages_fast.js`を再実行
- フッターパターンで日本語ページ名を検出
- vt_config.jsonを自動更新

## スクリプト設計

### `scripts/translate_vt_pages.ts`

**依存関係**:
- `openai` (OpenAI API)
- `tsx` (TypeScript実行)
- `fs`, `path` (ファイル操作)
- `gray-matter` (frontmatter処理)

**環境変数**:
- `OPENAI_API_KEY` (OpenAI APIキー)

**関数構成**:
```typescript
// 1. vt_config.jsonから未翻訳ページを取得
function getUntranslatedPages(): Array<{id, page_ja}>

// 2. 日本語MDファイルを読み込み
function readJapanesePage(pageName: string): {frontmatter, content}

// 3. Claude APIで翻訳
async function translateWithClaude(
  jaContent: string,
  jaTitle: string
): Promise<{title: string, content: string}>

// 4. 翻訳結果を保存
function saveTranslation(id: number, jaTitle: string, translation: string): void

// 5. メイン処理
async function main(): Promise<void>
```

**出力形式**:
```
translations/vt/
├── 11_FLAT-STEP→NAMERAKA.md
├── 20_辺縁が育てばそれが中心.md
├── 21_辺縁での湧き出しを中とするか外とするか.md
├── 22_湧き出すひとの移動.md
├── 24_分布の中央から削減される.md
├── 26_情報の価値は人によって異なる.md
└── 27_分布を観察して気づくこと.md
```

## 実行手順

### 準備

1. **APIキーの設定**
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

2. **出力ディレクトリの作成**
   ```bash
   mkdir -p modules/mem/translations/vt
   ```

### 実行

```bash
cd modules/mem
pnpm tsx scripts/translate_vt_pages.ts
```

**期待される出力**:
```
Translating Visual Thinking pages...

Processing ID 11: FLAT-STEP→NAMERAKA
✓ Translated to: "FLAT-STEP to SMOOTH"
✓ Saved to: translations/vt/11_FLAT-STEP→NAMERAKA.md

Processing ID 20: 辺縁が育てばそれが中心
✓ Translated to: "The Periphery Becomes the Center"
✓ Saved to: translations/vt/20_辺縁が育てばそれが中心.md

...

Summary:
- Total: 7 pages
- Success: 7
- Failed: 0

Next steps:
1. Review translations in modules/mem/translations/vt/
2. Edit if needed
3. Move to ../external_brain_in_markdown_english/pages/
4. Commit and push
5. Run scripts/find_en_pages_fast.js to update vt_config.json
```

### レビュー

```bash
# レビュー用にVSCodeで開く
code modules/mem/translations/vt/
```

### コミット

```bash
# 承認後、ファイル名を英語タイトルに変更して移動
cd modules/external_brain_in_markdown_english/pages

# 例: ID 11の場合
mv ../../mem/translations/vt/11_FLAT-STEP→NAMERAKA.md "FLAT-STEP to SMOOTH.md"

# すべて移動後
git add .
git commit -m "feat: add high-quality Visual Thinking translations

- ID 11: FLAT-STEP to SMOOTH
- ID 20: The Periphery Becomes the Center
- ID 21: Whether to Include or Exclude Emergence at the Periphery
- ID 22: Movement of Those Who Emerge
- ID 24: Reduced from the Center of the Distribution
- ID 26: The Value of Information Varies by Person
- ID 27: Insights from Observing Distributions

Translation method: OpenAI gpt-4o with Visual Thinking context
Quality: High-quality translation with human review"

git push
```

### vt_config.json更新

```bash
cd modules/mem
pnpm tsx scripts/find_en_pages_fast.js
```

## 品質チェック項目

### 翻訳品質

- [ ] **タイトルの適切性**: 短く、内容を表している
- [ ] **自然な英語**: ネイティブにとって読みやすい
- [ ] **専門用語**: 正確に翻訳されている
- [ ] **図解の説明**: Visual Thinkingとして適切

### 技術的正確性

- [ ] **frontmatter**: `title`フィールドが正しい
- [ ] **Gyazo URL**: すべて保持されている
- [ ] **[[リンク]]**: すべて保持されている（内容は翻訳）
- [ ] **Markdown構文**: 正しくフォーマットされている

### フッター

- [ ] **元ページへのリンク**: 正しいURL
- [ ] **翻訳方法の記載**: "high-quality translation"と明記

## 今後の展開

### オプション: 既存20ページの改善

既存ページもレビューし、必要に応じて高品質翻訳に置き換える：

```bash
# 既存ページの品質チェック
pnpm tsx scripts/review_existing_translations.ts

# 問題があるページのみ再翻訳
pnpm tsx scripts/translate_vt_pages.ts --only-improve
```

### 継続的な品質向上

- 新しいVisual Thinkingページが追加されたら、このプロセスを使用
- フィードバックに基づいてプロンプトを改善
- 翻訳の一貫性を保つ

## リスクと対策

### リスク1: OpenAI APIの品質のばらつき

**対策**:
- プロンプトに具体的な例を含める
- temperature を低めに設定（0.3）
- 失敗した場合は再実行
- gpt-4o を使用（より高品質）

### リスク2: ファイル名の衝突

**対策**:
- 翻訳前にexternal_brain_in_markdown_englishで同名ファイルをチェック
- 衝突した場合は手動でファイル名を調整

### リスク3: リンク切れ

**対策**:
- [[リンク]]の翻訳は内容のみ、構文は保持
- 翻訳後にリンクが機能することを確認

## 次のアクション

1. ✅ このPLANファイルを作成
2. ⏸️ `scripts/translate_vt_pages.ts`を作成
3. ⏸️ APIキーを設定
4. ⏸️ スクリプト実行（7ページ翻訳）
5. ⏸️ 翻訳結果をレビュー
6. ⏸️ external_brain_in_markdown_englishにコミット
7. ⏸️ vt_config.json更新
8. ⏸️ テスト（/en/vt で7ページ追加を確認）
