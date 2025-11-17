# Visual Thinking (VT) ナビゲーション機能の設計書

## 概要

Visual Thinking (VT) システムに、日本語元データのリンク情報を使ったナビゲーション機能を追加します。

## 要件

1. **直接リンク**: VTの対象になっているページに直接リンクがある場合、それを表示する
2. **共通リンクによる相互接続**: 共通のページX（これ自体はVTの中になくて良い）にリンクしているVTの中のページA、B、Cは相互につながり合うべき

## 現状の理解

### 既存のVTシステム

- VTページは `vt_config.json` に登録されている（`{id, page_ja, page_en, tags}`）
- 各VTページは `data/ja/pages/*.md` のマークダウンファイルに対応
- マークダウンファイルには `[[ページ名]]` 形式のwikiスタイルリンクが含まれる
- 現在のVTページは順次ナビゲーション（前/次/ランダム）のみ
- 通常ページ（非VT）は `generate_links.tsx` を使ってScrapbox APIから1ホップ・2ホップの関連ページを表示

### 既存のリンク処理

- `utils/generate_links.tsx`: Scrapbox APIの `links1hop` と `links2hop` を処理
- `processWikiLinks()`: マークダウン内の `[[Link]]` を `/[lang]/Link` に変換
- `title_to_url()`: ページタイトルをURL形式に変換

## 設計方針

### 1. リンク抽出のタイミング

**決定**: ビルド時（getStaticProps内）に動的に計算する

**理由**:
- 日本語元データのマークダウンファイルは独立して変更される可能性がある
- ISR（revalidate: 30）により、手動管理なしで変更を自動的に反映できる
- VTページ数は少ないため、ページレンダリングごとに全VTページをスキャンしてグラフを構築してもコストは低い
- `vt_config.json` との同期を保つ追加の状態管理が不要

### 2. リンク情報の保存場所

**決定**: 動的に計算し、`vt_config.json` には保存しない

**理由**:
- `vt_config.json` はコンテンツレジストリ（id/page_ja/page_en/tags）として保持
- 派生したリンクグラフを注入すると、ドリフトのリスクがあり、コンテンツ更新が困難になる
- `data/ja/pages/*.md` からオンデマンドでリンクグラフを構築

### 3. 共通ページXによる相互接続の処理

**アルゴリズム**:

1. **グラフ構築** (getStaticProps内でメモリ上に構築):
   - 各VTの日本語マークダウンからwikiリンクを抽出: `[[Title]]` → リンクターゲットタイトルのセット（重複除去）
   - マッピングを作成:
     - `vtId → Set(linkTargets)`: 各VTページがリンクしているページのセット
     - `linkTarget → Set(vtIds)`: 各ページにリンクしているVTページのセット

2. **直接VTリンク**:
   - 現在のVTページAについて、そのlinkTargetのうち、いずれかの `illust.page_ja` と完全一致するものは、そのVTページへの直接リンク

3. **共有参照による関連**:
   - VTページAの各linkTargetについて、それがVTページの `page_ja` でない場合
   - `linkTarget → Set(vtIds)` を参照し、そのセットを結合して、Aと共通のターゲット経由でつながる他のVTページB、Cを取得
   - オプション: linkTargetごとにグループ化して、コンテキスト（「Xを経由」）を表示

**対称性**:
- 直接リンクは一方向（A→B）
- 共有参照による接続は自然に対称的（A、B、CはXを経由して相互接続）

### 4. ナビゲーションの表示場所

**主要**: `pages/[lang]/vt/[page].tsx`

画像とナビゲーションの下に2つのセクションを追加:

1. **直接VTリンク**: AのJAリンクからVTページに到達するもの
2. **共有参照による関連VTページ**: 
   - フラットリストまたはXごとにグループ化
   - 推奨: Xごとにグループ化し、小さな「Xを経由」ラベルを表示
   - オプション: Xを `/[lang]/[X]` ページへのリンクにする

**インデックスページ**: `[lang]/vt/index.tsx` と `latest.tsx` は当初スコープ外。ギャラリーとして保持し、後でバッジやフィルターを追加することを検討可能。

### 5. 非VTリンクとVTリンクの扱い

- **VT間の直接リンク**: 画像タイルで `/[lang]/vt/{id}` へのリンクとして、第一級のナビゲーションターゲットとして扱う
- **非VTリンク**: VTナビゲーションタイルとして直接リストしない。「共有参照」接続の計算に使用。UIでは、共有Xラベルを表示し、オプションでXを `/[lang]/{title_to_url(X)}` へのクリック可能なリンクにして、コンテキストを提供

## 実装計画

### ファイル構成

```
utils/
  vt_links.ts          # wikiリンク抽出ユーティリティ
  vt_graph.ts          # VTリンクグラフ構築ユーティリティ

pages/[lang]/vt/
  [page].tsx           # VTページコンポーネント（拡張）
```

### 新規ユーティリティ

#### `utils/vt_links.ts`

```typescript
/**
 * マークダウンテキストからwikiスタイルリンク [[...]] を抽出
 * @param markdown マークダウンテキスト
 * @returns リンクタイトルの配列（重複除去済み）
 */
export function parseWikiLinks(markdown: string): string[]
```

#### `utils/vt_graph.ts`

```typescript
/**
 * VT設定を読み込む
 */
export function loadVtConfig(): IllustConfig

/**
 * 日本語マークダウンを読み込む
 */
export function readJaMarkdown(page_ja: string): string

/**
 * VTリンクグラフを構築
 */
export interface VtGraph {
  idToPageJa: Map<number, string>
  pageJaToId: Map<string, number>
  idToLinkTargets: Map<number, Set<string>>
  linkTargetToVtIds: Map<string, Set<number>>
}

export function buildVtGraph(illusts: IllustConfig['illusts']): VtGraph

/**
 * 現在のVTページからの直接VTリンクを取得
 */
export function getDirectVtLinks(currentId: number, graph: VtGraph): number[]

/**
 * 共有参照による関連VTページを取得（グループ化）
 */
export interface SharedRefGroup {
  via: string           // 共通リンク先ページ名
  vtIds: number[]       // 関連VTページID
}

export function getSharedReferenceVtLinks(
  currentId: number, 
  graph: VtGraph
): SharedRefGroup[]
```

### `pages/[lang]/vt/[page].tsx` の変更

#### Props型の拡張

```typescript
type VtLinkItem = {
  id: number
  title: string
  imageUrl: string | null
}

type SharedRefGroup = {
  via: string
  items: VtLinkItem[]
}

type Props = {
  // ... 既存のプロパティ
  directVtLinks: VtLinkItem[]
  sharedRefGroups: SharedRefGroup[]
}
```

#### getStaticPropsの変更

```typescript
export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  // ... 既存のコード

  // VTリンクグラフを構築
  const graph = buildVtGraph(config.illusts)
  
  // 直接VTリンクを取得
  const directVtIds = getDirectVtLinks(illustItem.id, graph)
  const directVtLinks = directVtIds.map(id => {
    const pageJa = graph.idToPageJa.get(id)!
    const jaFilePath = path.join(process.cwd(), 'data', 'ja', 'pages', `${pageJa}.md`)
    const jaContent = fs.existsSync(jaFilePath) 
      ? fs.readFileSync(jaFilePath, 'utf-8') 
      : ''
    const { data } = matter(jaContent)
    const imageUrl = extractGyazoImage(jaContent)
    
    return {
      id,
      title: data.title || pageJa,
      imageUrl
    }
  })
  
  // 共有参照による関連を取得
  const sharedRefGroups = getSharedReferenceVtLinks(illustItem.id, graph)
    .map(group => ({
      via: group.via,
      items: group.vtIds.map(id => {
        const pageJa = graph.idToPageJa.get(id)!
        const jaFilePath = path.join(process.cwd(), 'data', 'ja', 'pages', `${pageJa}.md`)
        const jaContent = fs.existsSync(jaFilePath) 
          ? fs.readFileSync(jaFilePath, 'utf-8') 
          : ''
        const { data } = matter(jaContent)
        const imageUrl = extractGyazoImage(jaContent)
        
        return {
          id,
          title: data.title || pageJa,
          imageUrl
        }
      })
    }))

  return {
    props: {
      // ... 既存のプロパティ
      directVtLinks,
      sharedRefGroups
    },
    revalidate: 30
  }
}
```

#### コンポーネントのレンダリング

```tsx
export default function IllustPage(props: Props) {
  // ... 既存のコード

  return (
    <>
      {/* ... 既存のコンテンツ */}
      
      {/* 直接VTリンク */}
      {props.directVtLinks.length > 0 && (
        <div className="vt-links-section">
          <h3>{props.lang === 'ja' ? '関連する図解' : 'Related Illustrations'}</h3>
          <div className="illust-grid">
            {props.directVtLinks.map(link => (
              <Link key={link.id} href={`/${props.lang}/vt/${link.id}`}>
                <div className="illust-tile">
                  {link.imageUrl && (
                    <img src={link.imageUrl} alt={link.title} className="illust-image" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* 共有参照による関連 */}
      {props.sharedRefGroups.length > 0 && (
        <div className="vt-links-section">
          <h3>{props.lang === 'ja' ? '共通のトピックでつながる図解' : 'Connected via Shared Topics'}</h3>
          {props.sharedRefGroups.map((group, idx) => (
            <div key={idx} className="shared-ref-group">
              <h4 className="shared-ref-label">
                {props.lang === 'ja' ? '経由: ' : 'via: '}
                <Link href={`/${props.lang}/${title_to_url(group.via)}`}>
                  {group.via}
                </Link>
              </h4>
              <div className="illust-grid">
                {group.items.map(item => (
                  <Link key={item.id} href={`/${props.lang}/vt/${item.id}`}>
                    <div className="illust-tile">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="illust-image" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
```

### ソート順

- **直接VTリンク**: IDの昇順
- **共有参照グループ**: 
  - グループはサイズ降順、次にviaタイトル順
  - グループ内のアイテムはID昇順

### 言語の扱い

- グラフ構築は常に日本語リンクから行う
- 英語ページでレンダリングする場合も、リンクタイルは `/en/vt/{id}` に向ける
- ターゲットに英語コンテンツがない場合、既存のVTページの動作により「English Version Not Available Yet」モーダルが表示され、日本語へのリンクが提供される（現在の設計と一貫性あり）

## パフォーマンス考慮事項

- VTページ数は数十程度のため、各ISRでの全JAマークダウンのスキャンは問題なし
- ISR 30秒により、手動ステップなしで更新が迅速に伝播
- 将来VTが大幅に増加した場合、オプションでビルド時に `data/vt_links.json` を事前計算するスクリプト `scripts/generate_vt_link_graph.ts` を追加可能（現時点では不要）

## エッジケースの処理

### 完全一致

- `[[Title]]` がいずれかの `illust.page_ja` と完全一致することを前提
- タイトルが異なる場合（エイリアス、句読点の違い）、直接VT解決は失敗する
- 最初は完全一致で開始し、ユーザーが要求した場合、正規化レイヤー（トリミング、全角/半角正規化、大文字小文字の区別など）を追加

### 重複除去

- ページが同じターゲットに複数回リンクする可能性がある - Setを使用

### UI の肥大化防止

- ページが多数の参照を多くの他のページと共有する場合、グループごとの数を制限するか、後でページネーションを追加
- 現時点では、ソートして合理的な数を表示し、混雑する場合はユーザーと調整

### 型の同期

- `pages/[lang]/vt/[page].tsx` の Props を拡張する際、関連するコードパスを更新し、検証済みコマンド `npx tsc --noEmit` でビルドが通ることを確認

### ファイル読み込みの堅牢性

- 英語レンダリング時もグラフ構築にはJAマークダウンを使用
- ファイル読み込みパスは欠落ファイルを堅牢に処理し、ビルドをクラッシュさせない

## 確定した設計決定

すべての設計決定が確定しました:

1. **直接VTリンクの対称性**: ✅ **確定**
   - 向きによらず「直接のリンク」として扱う
   - 並び順の優先度:
     1. 相互リンク（A↔B）- 最優先
     2. ここからのリンク（A→B）
     3. ここへのリンク（B→A）- 最後

2. **共有参照グループのXの表示**: ✅ **確定**
   - Xは言語的に表示しない（Visual Thinkingの特性上、画像が先に目に入るべき）
   - 関連VTページのみをタイル表示

3. **XがVTページの場合の扱い**: ✅ **確定**
   - XがVTページの場合は画像として表示可能
   - ただし、優先度は低め（多くは直接リンクで既につながっているため）
   - 初期実装では対応せず、データが増えてから確認する

4. **表示数の制限**: ✅ **確定**
   - 初期実装: 全て表示（問題が観測されるまで複雑な制御は不要）
   - 将来的な拡張: 共有参照が多くなったら、7件程度で残りをellipsisにし、クリックでXにリンクしているページ一覧（latest風）を表示

5. **視覚デザイン**: ✅ **確定**
   - シンプルなグリッド（タイル表示、latest pageと同様のスタイル）

## 実装ステップ

1. ユーザーからの設計確認とフィードバック取得
2. `utils/vt_links.ts` の実装とテスト
3. `utils/vt_graph.ts` の実装とテスト
4. `pages/[lang]/vt/[page].tsx` の拡張
5. ローカルでの動作確認
6. 型チェック（`npx tsc --noEmit`）
7. ビルドテスト（`npm run build`）
8. PRの作成
9. CIの通過確認

## 注意事項

- `utils/generate_links.tsx` をVTに再利用しない（入力がScrapbox API JSONであり、VTページには存在しない）
- 重複を積極的に除去する（Setを使用）
- ビルドを通すために型の同期を保つ
- 英語レンダリング時もグラフ構築にはJAマークダウンを使用
- ファイル読み込みは欠落ファイルを堅牢に処理
