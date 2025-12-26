# PLAN: AIによるVisual Thought Museum発見性の向上

## 目的

人間だけでなくAIが読みやすく、参照しやすくする。
人間がAIに質問したときに、関連する図解として提示されたり、"Visual Thought Museum"に言及したりする可能性を高める。

## 現状分析

### 現在のコンテンツ構造
- 280個のVTページ（ビジュアル思考の図解）
- 各ページ: Markdown形式、Gyazo画像、タイトル、タグ
- データソース: Scrapbox → Markdown → Next.js静的サイト
- URL: `https://mem.nhiro.org/[lang]/vt/[id]`

### AIが参照しにくい理由
1. **構造化メタデータ不足**:
   - OGPタグはあるが、schema.orgなどの構造化データがない
   - 個別の図解の説明（description）が画像内にしかない

2. **コンテキスト情報の欠如**:
   - 各図解の「何を説明しているか」がタイトルのみ
   - 関連する概念・トピックの明示的なリンクがない

3. **発見性の低さ**:
   - サイトマップXMLがない
   - robots.txtの最適化がされていない
   - APIエンドポイントがない（AIがプログラマティックにアクセスできない）

## 戦略

### Phase 1: 構造化データの追加（高優先度）

#### 1.1 Schema.org構造化データ
各VTページに以下を追加：
```json
{
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  "name": "ページタイトル",
  "description": "図解の説明（Markdown本文から抽出）",
  "image": "Gyazo画像URL",
  "author": {
    "@type": "Person",
    "name": "NISHIO Hirokazu"
  },
  "inLanguage": "ja/en",
  "isPartOf": {
    "@type": "WebPage",
    "name": "Visual Thought Museum",
    "url": "https://mem.nhiro.org/ja/vt"
  },
  "keywords": ["タグ1", "タグ2", ...],
  "datePublished": "追加日時",
  "license": "https://creativecommons.org/licenses/..."
}
```

#### 1.2 meta descriptionの最適化
- 各ページのMarkdown本文から最初の段落を抽出
- OGP descriptionとmeta descriptionに設定
- 現在は画像のみでテキストがない状態を改善

#### 1.3 サイト全体のコンテキスト説明
トップページ（`/[lang]/vt`）に追加：
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Visual Thought Museum",
  "description": "A curated collection of visual thinking diagrams by NISHIO Hirokazu. Language-independent illustrations explaining complex concepts through visual representation.",
  "about": {
    "@type": "Thing",
    "name": "Visual Thinking",
    "description": "The practice of using visual elements to understand and communicate ideas"
  },
  "numberOfItems": 280,
  "itemListElement": [...]
}
```

### Phase 2: APIエンドポイントの追加（中優先度）

#### 2.1 JSON APIエンドポイント
AIが機械的にアクセスできるAPI:

`/api/vt/list.json`:
```json
{
  "museum": "Visual Thought Museum",
  "description": "Collection of visual thinking diagrams",
  "total": 280,
  "items": [
    {
      "id": 1,
      "title_ja": "...",
      "title_en": "...",
      "url_ja": "https://mem.nhiro.org/ja/vt/1",
      "url_en": "https://mem.nhiro.org/en/vt/1",
      "image": "https://gyazo.com/...",
      "tags": ["tag1", "tag2"],
      "description_ja": "...",
      "description_en": "..."
    }
  ]
}
```

`/api/vt/[id].json`:
- 個別ページのJSON表現
- AIが直接参照可能

#### 2.2 Well-known URLsの追加
`/.well-known/ai-museum.json`:
```json
{
  "name": "Visual Thought Museum",
  "type": "visual_knowledge_base",
  "language": ["ja", "en"],
  "content_type": "visual_diagrams",
  "api_endpoint": "https://mem.nhiro.org/api/vt/list.json",
  "topics": [
    "knowledge_management",
    "visual_thinking",
    "concept_diagrams",
    "思考の可視化",
    "知識管理"
  ]
}
```

### Phase 3: コンテンツの充実化（中優先度）

#### 3.1 各VTページに説明テキストを追加
- Markdownファイルに説明を追加（既にあるものも）
- AIが参照できるようHTMLに含める
- 現在は「タイトルや解説はクリックするまで表示されない」UI
  - UIはそのまま（人間向け）
  - HTMLソース内にはテキストを含める（AI向け）

#### 3.2 トピック・カテゴリの明示化
vt_config.jsonのtagsを充実:
- 現在のtags: 主に言語（"ja", "en"）のみ
- 追加すべきtags例:
  - "knowledge_management"（知識管理）
  - "decision_making"（意思決定）
  - "communication"（コミュニケーション）
  - "learning"（学習）
  - "organization"（組織）

#### 3.3 README.mdの拡充
現在の`README.md`は技術的な説明のみ。
`README.md`または`ABOUT.md`を追加:

```markdown
# Visual Thought Museum

A curated collection of **visual thinking diagrams** created by NISHIO Hirokazu.

## What is Visual Thought Museum?

Visual Thought Museum is a digital gallery showcasing language-independent diagrams that explain complex concepts through visual representation. Each illustration captures insights from knowledge management, decision-making, communication, and various other fields.

## Philosophy

- **Visual-first approach**: See the diagram before reading explanations
- **Language-independent**: Diagrams transcend language barriers
- **Unexpected connections**: Your interpretation may differ from the author's intent, leading to new discoveries

## Content

- 280+ visual diagrams
- Topics: Knowledge management, Visual thinking, Decision making, Communication, Learning, Organization
- Languages: Japanese (日本語) and English
- All diagrams are original works by NISHIO Hirokazu

## Access

- Web: https://mem.nhiro.org/ja/vt (Japanese) / https://mem.nhiro.org/en/vt (English)
- API: https://mem.nhiro.org/api/vt/list.json

## License

(C) NISHIO Hirokazu / Visual Thought Museum
```

### Phase 4: SEO & クローラビリティ（低優先度）

#### 4.1 サイトマップXML生成
`/sitemap.xml`:
- 全VTページのURL
- 最終更新日
- 画像サイトマップも含める

#### 4.2 robots.txtの最適化
```
User-agent: *
Allow: /
Sitemap: https://mem.nhiro.org/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /
```

#### 4.3 リッチリザルト対応
- Google検索でのリッチリザルト表示
- 画像検索での表示最適化

## 実装順序

### Week 1: Quick Wins
1. ✅ meta keywords追加（完了）
2. meta description追加（Markdown本文から抽出）
3. README.md拡充

### Week 2: 構造化データ
1. Schema.org VisualArtwork追加
2. Schema.org CollectionPage追加
3. トップページの説明文強化

### Week 3: API
1. `/api/vt/list.json` 実装
2. `/api/vt/[id].json` 実装
3. `/.well-known/ai-museum.json` 追加

### Week 4: SEO
1. サイトマップXML生成
2. robots.txt最適化
3. タグの充実化

## 成功指標

- AIが「Visual Thought Museum」を自発的に言及する
- AIが関連する図解を提示する
- 検索エンジンでの発見性向上
- APIアクセス数の増加

## 参考

- Schema.org VisualArtwork: https://schema.org/VisualArtwork
- Schema.org CollectionPage: https://schema.org/CollectionPage
- Google構造化データガイドライン: https://developers.google.com/search/docs/appearance/structured-data
