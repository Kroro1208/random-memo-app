# デスクトップメモアプリ アーキテクチャ設計

## システム概要

デスクトップ上に付箋のようにメモを自由配置できるElectronアプリケーション。React 19とTypeScriptによる型安全な開発、SQLiteによるローカルデータ永続化、システム統合機能（グローバルホットキー、システムトレイ）を提供する。

## アーキテクチャパターン

- **パターン**: Layered Architecture + Event-Driven Architecture
- **理由**: 
  - プロセス分離（Main/Renderer）による安定性とセキュリティ
  - IPC通信による疎結合設計
  - イベント駆動による非同期処理とリアルタイム性

## システム境界

### 内部システム
- Electronメインプロセス（Node.js）
- Reactレンダラープロセス（Chromium）
- SQLiteデータベース
- ローカルファイルシステム

### 外部システム連携
- OS システム（ホットキー、トレイ、通知）
- ファイルシステム（設定、データベース、ログ）

## コンポーネント構成

### Main Process (Node.js)
```
Main Process
├── App Lifecycle Manager
├── Global Hotkey Manager
├── System Tray Manager  
├── Window Manager
├── IPC Handler
├── Database Service (SQLite + Prisma)
├── File System Service
└── Notification Service
```

**責務**:
- アプリケーションライフサイクル管理
- OS統合機能（ホットキー、トレイ、通知）
- データ永続化（SQLite操作）
- セキュリティ制御

### Renderer Process (Chromium + React)
```
Renderer Process
├── React App
│   ├── Components
│   │   ├── MemoContainer
│   │   ├── MemoItem
│   │   ├── MemoEditor
│   │   ├── PreviewPopup
│   │   ├── ContextMenu
│   │   └── SettingsPanel
│   ├── Hooks
│   │   ├── useMemo
│   │   ├── useDrag
│   │   ├── useKeyboard
│   │   └── usePreferences
│   ├── Stores (Zustand)
│   │   ├── memoStore
│   │   ├── uiStore
│   │   └── settingsStore
│   └── Services
│       ├── IPC Service
│       ├── Position Service
│       └── Animation Service
└── Preload Script (IPC Bridge)
```

**責務**:
- UI描画・インタラクション処理
- 状態管理（Zustand）
- ドラッグ&ドロップ処理
- アニメーション・エフェクト

## データアーキテクチャ

### データフロー原則
1. **Single Source of Truth**: SQLiteがマスターデータ
2. **Unidirectional Flow**: Main → Renderer の一方向データフロー
3. **Event Sourcing**: 全ての変更をイベントとして処理
4. **Optimistic Updates**: UI更新 → DB永続化の順序

### 状態管理階層
```
┌─ SQLite Database (Persistent)
├─ Main Process State (Runtime)
├─ Zustand Stores (UI State)
└─ React Component State (Local)
```

## セキュリティアーキテクチャ

### Electronセキュリティ
- **Context Isolation**: 有効化
- **Node Integration**: レンダラーでは無効
- **Preload Scripts**: 最小権限でのIPC通信
- **CSP**: 厳格なContent Security Policy

### データセキュリティ
- **SQLite Encryption**: SQLCipherでデータベース暗号化（オプション）
- **File Permissions**: データファイルの適切な権限設定
- **Input Validation**: 全入力のサニタイゼーション

## パフォーマンス設計

### 最適化戦略
- **React 19最適化**: React Compiler自動メモ化
- **Virtual DOM効率化**: キー戦略とコンポーネント最適化
- **メモリ管理**: WeakMapによる参照管理
- **レイジーローディング**: 大量メモの遅延表示

### レンダリング最適化
```typescript
// 例: メモコンポーネントの最適化
const MemoItem = memo(({ memo, onUpdate, onDelete }: MemoItemProps) => {
  // React Compilerが自動でuseMemo/useCallbackを適用
  return (
    <div className="memo-item" style={{ left: memo.x, top: memo.y }}>
      {memo.content}
    </div>
  );
});
```

## スケーラビリティ設計

### 水平スケーリング
- **プロセス分離**: 重処理は専用ワーカープロセス
- **メモリ効率**: 表示範囲外メモの仮想化
- **データベース最適化**: インデックス戦略

### 機能拡張性
- **プラグインシステム**: 将来的な機能拡張基盤
- **イベントシステム**: 疎結合な機能追加
- **設定システム**: 階層化された設定管理

## 技術選定理由

### Core Stack
- **Electron 32+**: デスクトップ統合とクロスプラットフォーム
- **React 19**: 最新パフォーマンス最適化とDX向上
- **TypeScript 5.6+**: 型安全性とコード品質
- **Vite 6**: 高速開発・ビルド

### State Management
- **Zustand 5**: Redux比較で軽量、簡潔なAPI
- **Immer 10**: イミュータブル更新の簡素化

### Database
- **SQLite 3.47+**: 
  - ゼロ設定でのローカル永続化
  - ACIDトランザクション
  - 高速読み書き
  - ファイル1つでの完結性

### UI/UX
- **Tailwind CSS 4**: ユーティリティファーストによる高速UI構築
- **Framer Motion 11**: 滑らかなアニメーション
- **React Aria 3**: アクセシビリティ対応

## 制約とトレードオフ

### 技術制約
- **Chromiumメモリ使用量**: 基本メモリオーバーヘッド ~100MB
- **ファイルサイズ**: Electron配布サイズ ~150MB
- **起動時間**: Cold start ~2-3秒

### 設計トレードオフ
| 選択 | メリット | デメリット |
|------|---------|-----------|
| Electron | デスクトップ統合、クロスプラットフォーム | メモリ使用量、ファイルサイズ |
| SQLite | シンプル、高速、ゼロ設定 | 同期機能なし、スケーリング限界 |
| ローカルファースト | プライバシー、オフライン動作 | クラウド同期なし |

## 運用・保守性

### ログ・監視
- **構造化ログ**: Winston + JSON形式
- **エラートラッキング**: Sentry統合
- **パフォーマンス監視**: 起動時間、メモリ使用量

### テスタビリティ
- **Unit Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright
- **Visual Regression**: Chromatic (将来)

### CI/CD
- **自動ビルド**: GitHub Actions
- **マルチプラットフォーム**: Windows/macOS/Linux
- **自動更新**: electron-updater