# MapToolsPanel 埋め込み時 最小化/最大化 修正方針

## 概要

埋め込み RD Map（`?mode=embed`）でツールパネルを常に表示し、最小化/最大化で切り替えられるようにする。

## 変更対象ファイル

| ファイル | 役割 |
|----------|------|
| `apps/map/src/pages/parts/MapToolsPanel.tsx` | パネル本体・折りたたみロジック |
| `apps/map/src/pages/map.css` | 折りたたみ時のスタイル |

---

## 1. MapToolsPanel.tsx の修正

### 1.1 埋め込み時の早期 return を削除

**現在（97–99行目）:**
```tsx
if (typeof window !== "undefined" && detectEmbedMode()) {
  return null;
}
```
→ **削除する**

### 1.2 埋め込み時用の折りたたみ state を追加

```tsx
const isEmbed = typeof window !== "undefined" && detectEmbedMode();
const [collapsed, setCollapsed] = useState(true);  // 埋め込み時はデフォルト折りたたみ
```

- `isEmbed` が false（通常モード）のときは `collapsed` を無視し、常に展開表示
- `isEmbed` が true のときだけ `collapsed` で表示を切り替え

### 1.3 hasContent の見直し（埋め込み時）

埋め込み時は `showDjiNfzSection` が false のため、`showOverlaySection` が false だと `hasContent` が false になる可能性がある。

- 埋め込み時は `showOverlaySection` があればパネルを表示する（色変更・表示切り替えが目的）
- `hasContent` が false でも、埋め込み時は折りたたみボタンだけ表示する方針にする

**修正案:**
```tsx
// 埋め込み時は showOverlaySection があれば表示（色変更・表示切替が目的）
const hasContent =
  showOverlaySection ||
  showCreateButton ||
  showDeleteButton ||
  showMeasureButton ||
  showDjiNfzSection ||
  showAirportHeightRestrictionCheckbox;

// 埋め込み時かつ hasContent がなければ何も表示しない
if (isEmbed && !hasContent) return null;
```

### 1.4 折りたたみ UI の追加

**aside に付与するクラス:**
- 埋め込みかつ折りたたみ時: `map-tools-panel map-tools-panel--collapsed`

**折りたたみ時の表示:**
- 小さな「ツール」ボタン（またはアイコン）のみ表示
- クリックで `setCollapsed(false)` にして展開

**展開時の表示:**
- 従来どおり全セクション表示
- ヘッダー部分に「閉じる」ボタンを追加し、クリックで `setCollapsed(true)`

**実装イメージ:**
```tsx
return (
  <aside
    ref={panelRef}
    className={clsx(
      "map-tools-panel",
      isEmbed && collapsed && "map-tools-panel--collapsed"
    )}
    aria-label="地図ツール"
    aria-expanded={!isEmbed || !collapsed}
  >
    {isEmbed && (
      <button
        type="button"
        className="map-tools-panel__toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "ツールパネルを開く" : "ツールパネルを閉じる"}
        aria-expanded={!collapsed}
      >
        {collapsed ? "ツール" : "×"}  {/* またはアイコン */}
      </button>
    )}
    {(!isEmbed || !collapsed) && (
      <>
        {/* 既存の section 群 */}
      </>
    )}
  </aside>
);
```

### 1.5 useDraggablePanel の条件

折りたたみ時はドラッグ不要のため、`enabled` を制御する:

```tsx
useDraggablePanel(panelRef, {
  exclude: ["input", "select", "textarea", "button", "label", ".color-picker-popover"],
  enabled: !isEmbed || !collapsed,  // 折りたたみ時はドラッグ無効
});
```

※ 折りたたみ時はボタンクリックのみ想定し、ドラッグは無効でよい。

---

## 2. map.css の修正

### 2.1 折りたたみ用スタイルの追加

```css
/* 埋め込み時の折りたたみ状態 */
.map-tools-panel--collapsed {
  min-width: auto;
  padding: 6px 10px;
}

.map-tools-panel--collapsed .map-tools-panel__section,
.map-tools-panel--collapsed .map-tools-panel__toggle + * {
  display: none;
}

.map-tools-panel__toggle {
  /* 折りたたみ時のトグルボタン */
  background: transparent;
  border: none;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  -webkit-appearance: none;
  appearance: none;
}

.map-tools-panel__toggle:hover {
  opacity: 0.9;
}
```

### 2.2 折りたたみ時の表示構造

- 折りたたみ時: `map-tools-panel__toggle` のみ表示
- 子要素の非表示は、`map-tools-panel--collapsed` 時に `> *:not(.map-tools-panel__toggle)` を `display: none` にする方法が簡単

**推奨構造:**
```tsx
<aside className={...}>
  {isEmbed && (
    <button className="map-tools-panel__toggle" ...>ツール</button>
  )}
  {(!isEmbed || !collapsed) && (
    <div className="map-tools-panel__body">
      {/* 既存の section 群 */}
    </div>
  )}
</aside>
```

この場合の CSS:
```css
.map-tools-panel--collapsed .map-tools-panel__body {
  display: none;
}
```

---

## 3. 実装チェックリスト

- [x] `MapToolsPanel.tsx`: 97–99行目の `detectEmbedMode()` 時の `return null` を削除
- [x] `MapToolsPanel.tsx`: `isEmbed` と `collapsed` state を追加
- [x] `MapToolsPanel.tsx`: 埋め込み時は `hasContent` が false なら `return null`（折りたたみボタンも出さない）
- [x] `MapToolsPanel.tsx`: 折りたたみトグルボタンを追加（埋め込み時のみ表示）
- [x] `MapToolsPanel.tsx`: 展開時のみ既存セクションを表示する条件分岐
- [x] `MapToolsPanel.tsx`: `useDraggablePanel` の `enabled` に `!isEmbed || !collapsed` を指定
- [x] `map.css`: `.map-tools-panel--collapsed` と `.map-tools-panel__toggle` のスタイルを追加
- [ ] 動作確認: 通常モード（RD Map 単体）で従来どおり表示されること
- [ ] 動作確認: 埋め込みモードで初期は折りたたみ、クリックで展開できること
- [ ] 動作確認: 埋め込みモードで色変更・表示切り替えができること

---

## 4. 補足

### 4.1 通常モードへの影響

- `isEmbed` が false のときは `collapsed` を参照しない
- トグルボタンも表示しない
- 既存の挙動はそのまま

### 4.2 埋め込み時のデフォルト

- `collapsed` の初期値は `true`（折りたたみ）
- ユーザーが「ツール」をクリックすると展開

### 4.3 アクセシビリティ

- `aria-expanded` でパネルの開閉状態を伝える
- トグルボタンに `aria-label` を付与
