# イラストビュー改善計画

## 現状分析

### 既存の実装（2025-11-11時点）

- **イラスト登録**: 3件（001-003）
- **ID形式**: 文字列、3桁ゼロパディング（"001", "002", "003"）
- **URL構造**: `/ja/illust/001`, `/ja/illust/002`, etc.
- **データソース**: `illust_config.json` で管理
- **タグ機能**: 設定ファイルに存在するが、UIでは未活用

### illust_config.json の構造

```json
{
  "illusts": [
    {
      "id": "001",
      "page_ja": "ブロードリスニング",
      "page_en": null,
      "tags": ["xkcd", "communication", "democracy"]
    }
  ],
  "skipped": []
}
```

**skippedフィールド**: 管理者が「追加しない」と判断したページ名のリスト

### 現在のページ構成

1. `/[lang]/illust/index.tsx` - イラスト一覧（グリッド表示）
2. `/[lang]/illust/[page].tsx` - 個別イラストページ（xkcd風ナビゲーション付き）

## 問題点

### 0. URL構造の問題

**現状**: `/ja/illust/001`

**問題**:
- "illust" という名称が内容を正確に表していない
- Visual Thinking（視覚的思考）というコンセプトをより明確に示すべき

**提案**: `/ja/vt/1` (vt = Visual Thinking)

**影響範囲**:
- ディレクトリ構造: `pages/[lang]/illust/` → `pages/[lang]/vt/`
- 設定ファイル: `illust_config.json` → `vt_config.json` (オプション)
- API routes: `/api/illust/` → `/api/vt/`
- 管理ページ: `/admin/illust` → `/admin/vt`
- ページタイトルやヘッダーの文言

### 1. ID形式の問題

**現状**: `"001"`, `"002"`, `"003"` (文字列、3桁ゼロパディング)

**問題**:
- 999件を超えると破綻する
- 不要な複雑性（パディングロジックが各所に散在）
- URL生成時に`padStart(3, "0")`が必要

**影響範囲**:
- `illust_config.json`
- `pages/[lang]/illust/[page].tsx` (ID生成ロジック)
- URL構造: `/ja/illust/001` → `/ja/illust/1`

### 2. タグ機能の未活用

**現状**:
- `illust_config.json` にタグフィールドが存在
- UI上でタグが表示・活用されていない
- 手動でタグを管理する必要がある

**問題**:
- タグを入力する手間がかかる
- UIで活用されていないため優先度が低い
- 将来的には内部リンク（`[[リンク]]`）をタグとして活用したい

### 3. イラスト追加の手作業

**現状**:
- `illust_config.json` を手動で編集
- 画像を含むページを手動で探す必要がある
- IDの採番を手動で行う

**問題**:
- 時間がかかる
- ミス（重複、IDの誤り）が発生しやすい
- スケールしない

## 改善提案

### 提案0: URL構造の変更（破壊的変更）

**変更内容**:
```
// Before
/ja/illust/001
pages/[lang]/illust/index.tsx
pages/[lang]/illust/[page].tsx
illust_config.json

// After
/ja/vt/1
pages/[lang]/vt/index.tsx
pages/[lang]/vt/[page].tsx
vt_config.json (または illust_config.json のまま)
```

**メリット**:
- コンセプトが明確（Visual Thinking）
- URLが短く覚えやすい
- ブランディングの一貫性

**デメリット**:
- 既存URL（`/ja/illust/001`）が無効になる（破壊的変更）
- 早期に実施すべき（イラストが少ない今のうちに）

**移行手順**:
1. `pages/[lang]/illust/` を `pages/[lang]/vt/` にリネーム
2. `illust_config.json` を `vt_config.json` にリネーム（または設定ファイル内のキー名のみ変更）
3. ページ内の文言を更新（"Illustrations" → "Visual Thinking"）
4. next.config.js のリダイレクトルールを確認（必要に応じて除外パターンに `vt` を追加）

**注意**: 提案1（ID形式の変更）と同時に実施するのが効率的

### 提案1: ID形式の変更（破壊的変更）

**変更内容**:
```json
// Before
{"id": "001", ...}

// After
{"id": 1, ...}
```

**メリット**:
- シンプル
- スケーラブル（999件制限なし）
- コードが簡潔になる

**デメリット**:
- 既存URL（`/ja/illust/001`）が無効になる（破壊的変更）
- 早期に実施すべき（イラストが少ない今のうちに）

**移行手順**:
1. `illust_config.json` のidを数値に変更
2. `[page].tsx` のID生成ロジックから`padStart()`を削除
3. ナビゲーションボタンのロジックを簡素化

### 提案2: タグのUI非表示

**変更内容**:
- index.tsx と [page].tsx からタグ表示を削除
- `illust_config.json` のtagsフィールドは保持（将来の拡張用）
- タグ入力を省略可能にする（空配列をデフォルト）

**将来的な拡張**:
- Markdownの内部リンク `[[リンク]]` を自動抽出してタグとする
- 同じタグのイラストへのナビゲーション機能

### 提案3: 管理者ページの作成（最重要）

**目的**: イラスト追加を半自動化

**機能**:
1. **スキャン機能**
   - `data/ja/pages/` 内の全Markdownファイルをスキャン
   - Gyazo画像を含むページを検出
   - 既に登録済みのページを除外
   - **スキップ済みのページを除外**

2. **プレビュー表示**
   - 未登録ページの一覧（画像サムネイル付き）
   - タイトル表示
   - 画像URL表示
   - **検索/フィルター機能**（タイトルやページ名で絞り込み）

3. **ワンクリック操作**
   - 各ページに「Add」ボタン → vt_config.json の `illusts` に追加
   - 各ページに「Skip」ボタン → vt_config.json の `skipped` に追加
   - 自動ID採番（最大ID + 1）

4. **スキップ管理**
   - スキップしたページは候補から除外される
   - 必要に応じてスキップを解除できる機能（将来的に）

**URL**: `/admin/vt`

**実装方法**:
- **API Routes**:
  - `POST /api/vt/scan` - ページスキャン（登録済み・スキップ済みを除外）
  - `POST /api/vt/add` - イラスト追加（illusts配列に追加）
  - `POST /api/vt/skip` - スキップ登録（skipped配列に追加）
- **フロントエンド**:
  - `pages/admin/vt.tsx` - 管理画面UI（検索/フィルター機能付き）

## 実装計画

### フェーズ0: URL構造の変更（破壊的変更）

**タスク**:
- [ ] `pages/[lang]/illust/` ディレクトリを `pages/[lang]/vt/` にリネーム
- [ ] `illust_config.json` を `vt_config.json` にリネーム
- [ ] ページ内の文言を更新
  - "Illustrations" → "Visual Thinking"
  - "Illustration View" → "Visual Thinking"
  - title, header, footer などすべての箇所
- [ ] next.config.js を確認
  - rewriteルールの除外パターンに `vt` を追加（必要に応じて）
- [ ] 動作確認（URL `/ja/vt`, `/en/vt`）
- [ ] コミット・プッシュ

**所要時間**: 15分

**注意**: フェーズ1（ID形式の変更）と同時に実施することを推奨

### フェーズ1: ID形式の変更（破壊的変更）

**タスク**:
- [ ] illust_config.json のidを数値に変更（001→1, 002→2, 003→3）
- [ ] [page].tsx のID生成ロジック修正
  - `padStart(3, "0")` を削除
  - `String(number)` でシンプルに変換
- [ ] ナビゲーションボタンのロジック簡素化
- [ ] 動作確認（URL `/ja/illust/1`, `/ja/illust/2`, `/ja/illust/3`）
- [ ] コミット・プッシュ

**所要時間**: 30分

### フェーズ2: タグのUI非表示

**タスク**:
- [ ] index.tsx からタグ表示を削除（存在しない場合はスキップ）
- [ ] [page].tsx からタグ表示を削除（存在しない場合はスキップ）
- [ ] illust_config.json のtagsフィールドは保持
- [ ] コミット・プッシュ

**所要時間**: 15分

### フェーズ3: 管理者ページの作成

#### ステップ3.1: APIルートの作成

**タスク**:
- [ ] `pages/api/vt/scan.ts` を作成
  - data/ja/pages/ をスキャン
  - Gyazo画像を含むページを抽出
  - 既存登録とスキップ済みをフィルター
  - ページメタデータを返す
- [ ] `pages/api/vt/add.ts` を作成
  - リクエストボディ: `{pageName: string}`
  - vt_config.json を読み込み
  - illusts配列に新しいエントリを追加（自動ID採番）
  - ファイルを保存
- [ ] `pages/api/vt/skip.ts` を作成
  - リクエストボディ: `{pageName: string}`
  - vt_config.json を読み込み
  - skipped配列にページ名を追加
  - ファイルを保存
- [ ] `pages/api/vt/list.ts` を作成
  - 現在のvt_config.jsonの内容を返す

**所要時間**: 1-2時間

#### ステップ3.2: 管理画面UIの作成

**タスク**:
- [ ] `pages/admin/vt.tsx` を作成
- [ ] レイアウト実装
  - シングルカラム: 未登録候補のグリッド表示
  - グリッド表示
- [ ] スキャン機能の実装
  - 「Scan」ボタン
  - `/api/vt/scan` を呼び出し
- [ ] プレビュー表示
  - 画像サムネイル
  - タイトル
  - 「Add」「Skip」ボタン
- [ ] 検索/フィルター機能の実装
  - テキスト入力でリアルタイム絞り込み
  - タイトル・ページ名で検索
- [ ] 追加/スキップ機能の実装
  - 「Add」クリックで `/api/vt/add` を呼び出し
  - 「Skip」クリックで `/api/vt/skip` を呼び出し
  - 成功時にUIから該当アイテムを削除

**所要時間**: 2-3時間

#### ステップ3.3: 拡張機能（将来的に）

**今回は実装しない**:
- [ ] 削除機能（DELETE API）
- [ ] 並び替え機能（ドラッグ&ドロップ）
- [ ] バルク追加（複数選択）
- [ ] スキップ解除機能

## 技術的詳細

### ID生成ロジック（変更後）

```typescript
// Before
const getNextId = () => {
  const maxId = Math.max(...config.illusts.map(i => parseInt(i.id)));
  return String(maxId + 1).padStart(3, "0");
};

// After
const getNextId = () => {
  const maxId = Math.max(...config.illusts.map(i => i.id));
  return maxId + 1;
};
```

### ナビゲーションロジック（変更後）

```typescript
// Before
const getFirstId = () => "001";
const getLastId = () => String(props.totalIllusts).padStart(3, "0");
const getPrevId = () => {
  if (props.currentIndex <= 0) return null;
  return String(props.currentIndex).padStart(3, "0");
};
const getNextId = () => {
  if (props.currentIndex >= props.totalIllusts - 1) return null;
  return String(props.currentIndex + 2).padStart(3, "0");
};

// After
const getFirstId = () => 1;
const getLastId = () => props.totalIllusts;
const getPrevId = () => {
  if (props.currentIndex <= 0) return null;
  return props.currentIndex; // 注：currentIndexは0-based、IDは1-based
};
const getNextId = () => {
  if (props.currentIndex >= props.totalIllusts - 1) return null;
  return props.currentIndex + 2;
};
```

### API: /api/vt/scan.ts

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type ScanResult = {
  pageName: string;
  title: string;
  imageUrl: string;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pagesDir = path.join(process.cwd(), "data", "ja", "pages");
  const configPath = path.join(process.cwd(), "vt_config.json");

  // Read existing config
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configContent);
  const registeredPages = new Set(config.illusts.map(i => i.page_ja));
  const skippedPages = new Set(config.skipped || []);

  // Scan pages
  const files = fs.readdirSync(pagesDir);
  const results: ScanResult[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const pageName = file.replace(/\.md$/, "");
    if (registeredPages.has(pageName)) continue; // Skip registered
    if (skippedPages.has(pageName)) continue; // Skip skipped

    const filePath = path.join(pagesDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Check for Gyazo image
    const gyazoPattern = /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
    const match = content.match(gyazoPattern);

    if (match) {
      results.push({
        pageName,
        title: data.title || pageName,
        imageUrl: match[1],
      });
    }
  }

  return res.status(200).json({ results });
}
```

### API: /api/vt/add.ts

```typescript
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pageName } = req.body;
  if (!pageName) {
    return res.status(400).json({ error: "pageName is required" });
  }

  const configPath = path.join(process.cwd(), "vt_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configContent);

  // Generate next ID
  const maxId = Math.max(...config.illusts.map(i => i.id), 0);
  const nextId = maxId + 1;

  // Add new entry
  config.illusts.push({
    id: nextId,
    page_ja: pageName,
    page_en: null,
    tags: [],
  });

  // Save
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return res.status(200).json({ success: true, id: nextId });
}
```

### API: /api/vt/skip.ts

```typescript
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pageName } = req.body;
  if (!pageName) {
    return res.status(400).json({ error: "pageName is required" });
  }

  const configPath = path.join(process.cwd(), "vt_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configContent);

  // Initialize skipped array if not exists
  if (!config.skipped) {
    config.skipped = [];
  }

  // Add to skipped list if not already there
  if (!config.skipped.includes(pageName)) {
    config.skipped.push(pageName);
  }

  // Save
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return res.status(200).json({ success: true });
}
```

## セキュリティ考慮事項

### 管理者ページのアクセス制御

現状では認証がないため、以下のオプションを検討：

1. **オプションA: 環境変数による簡易認証**
   - `ADMIN_PASSWORD` 環境変数
   - ページアクセス時にパスワード入力
   - セッションストレージに保存

2. **オプションB: Vercelの認証機能を利用**
   - Vercel Authenticationを使用
   - GitHub/Google OAuth

3. **オプションC: 開発環境のみ有効**（採用）
   - `process.env.NODE_ENV === 'development'` でのみアクセス可能
   - 本番環境では404

**採用**: オプションC（開発環境のみ）

## 決定事項

### 確定事項
- **URL構造を変更**: `/illust/` → `/vt/` (Visual Thinking)（破壊的変更、早期実施）
- **ID形式を数値に変更**（破壊的変更、早期実施）
- **タグをUIから隠す**（設定ファイルには残す）
- **管理者ページを作成**（イラスト追加の半自動化）
- **管理者ページのURL**: `/admin/vt`
- **設定ファイルの構造**:
  - ファイル名は `vt_config.json`
  - キー名は `illusts` のまま維持（後方互換性）
  - `skipped` 配列を追加（スキップしたページのリスト）
- **管理者ページの機能**:
  - Add/Skip ボタン（スキップしたページは候補から除外）
  - 検索/フィルター機能
  - 削除・並び替え・バルク追加は今回実装しない
- **認証方式**: オプションC（開発環境のみアクセス可能）

### 未解決事項
なし（すべて決定済み）

## 次のステップ

1. このPLAN.mdをレビュー・承認
2. フェーズ1から順次実装
3. 各フェーズ完了後にコミット・デプロイ
4. 動作確認
5. diary/に作業記録を追加

---

**作成日**: 2025-11-11
**最終更新**: 2025-11-11
