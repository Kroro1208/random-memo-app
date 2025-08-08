# デスクトップメモアプリ 要件定義書

## 概要

デスクトップ上でランダムにメモを配置できるアプリケーション。ドラッグ&ドロップ機能を持ち、家の壁に付箋を貼るようにPCの画面上のどこでも移動・配置できるメモ管理システム。

## ユーザストーリー

### ストーリー1: メモの作成と配置

- **である** デスクトップユーザー **として**
- **私は** 新しいメモを作成してデスクトップ上の任意の場所に配置したい **をしたい**
- **そうすることで** 重要な情報を視覚的にわかりやすい場所に保存できる

### ストーリー2: メモの移動と整理

- **である** デスクトップユーザー **として**
- **私は** 既存のメモをドラッグ&ドロップで自由に移動したい **をしたい**
- **そうすることで** 作業内容に応じてメモを再配置し、効率的に情報を整理できる

### ストーリー3: メモの編集と管理

- **である** デスクトップユーザー **として**
- **私は** メモの内容を編集し、不要なメモを削除したい **をしたい**
- **そうすることで** 最新の情報を維持し、デスクトップを整理できる

### ストーリー4: メモの永続化

- **である** デスクトップユーザー **として**
- **私は** アプリを再起動してもメモの位置と内容が保持されていたい **をしたい**
- **そうすることで** 継続的にメモを活用できる

### ストーリー5: 即座のアクセス

- **である** 多忙なデスクトップユーザー **として**
- **私は** グローバルホットキーで瞬時にメモを作成し、システムトレイから素早くアクセスしたい **をしたい**
- **そうすることで** 作業を中断せずに思考を記録できる

### ストーリー6: 作業環境への適応

- **である** 長時間作業するデスクトップユーザー **として**
- **私は** メモの透明度を調整し、重要なメモを最前面に固定したい **をしたい**
- **そうすることで** 作業の邪魔にならずに重要な情報を常に確認できる

### ストーリー7: 効率的な整理と管理

- **である** 多数のメモを使用するデスクトップユーザー **として**
- **私は** メモを自動整列し、重要度で色分けして、期限があるものには通知を設定したい **をしたい**
- **そうすることで** 散らかったメモを効率的に管理し、重要な情報を見逃さずに済む

### ストーリー8: 直感的な確認と操作

- **である** 効率重視のデスクトップユーザー **として**
- **私は** マウスホバーでメモ内容をプレビューし、誤操作を防ぐピン留め機能を使いたい **をしたい**
- **そうすることで** クイックな確認と安全な操作を両立できる

## 機能要件（EARS記法）

### 通常要件

- REQ-001: システムは新しいメモを作成する機能を提供しなければならない
- REQ-002: システムはメモをデスクトップ上の任意の位置に配置できなければならない
- REQ-003: システはメモの内容を編集できなければならない
- REQ-004: システムはメモを削除できなければならない
- REQ-005: システムはメモをドラッグ&ドロップで移動できなければならない
- REQ-006: システムはメモの位置と内容を永続化しなければならない
- REQ-007: システムはグローバルホットキー機能を提供しなければならない
- REQ-008: システムはシステムトレイに常駐する機能を提供しなければならない
- REQ-009: システムはメモの透明度を調整できなければならない
- REQ-010: システムはメモを最前面に表示できなければならない
- REQ-011: システムはメモの自動整列機能を提供しなければならない
- REQ-012: システムはダークモード表示を提供しなければならない
- REQ-013: システムはメモのピン留め機能を提供しなければならない
- REQ-014: システムはメモプレビュー機能を提供しなければならない
- REQ-015: システムはメモの重要度による色分け機能を提供しなければならない
- REQ-016: システムは期限付きメモのアラート機能を提供しなければならない

### 条件付き要件

- REQ-101: ユーザーがメモをダブルクリックした場合、システムは編集モードに入らなければならない
- REQ-102: ユーザーがメモをドラッグした場合、システムはリアルタイムで位置を更新しなければならない
- REQ-103: ユーザーがメモの外側をクリックした場合、システムは編集モードを終了しなければならない
- REQ-104: ユーザーがアプリを起動した場合、システムは前回のセッションのメモを復元しなければならない
- REQ-105: ユーザーが右クリックした場合、システムはコンテキストメニューを表示しなければならない
- REQ-106: ユーザーがグローバルホットキーを押した場合、システムは新規メモを作成しなければならない
- REQ-107: ユーザーがシステムトレイアイコンをクリックした場合、システムはクイックアクセスメニューを表示しなければならない
- REQ-108: ユーザーがメモにマウスホバーした場合、システムはプレビューポップアップを表示しなければならない
- REQ-109: ユーザーがアクティブウィンドウを変更した場合、システムは関連メモを強調表示しなければならない
- REQ-110: ユーザーが期限設定したメモの期限が切れた場合、システムはアラート通知を表示しなければならない

### 状態要件

- REQ-201: メモが編集モードにある場合、システムは背景色を変更して視覚的フィードバックを提供しなければならない
- REQ-202: メモがドラッグされている場合、システムは半透明表示しなければならない
- REQ-203: メモが最小サイズに達した場合、システムはそれ以上の縮小を制限しなければならない
- REQ-204: メモがピン留めされている場合、システムは位置の変更を禁止しなければならない
- REQ-205: メモが最前面表示設定されている場合、システムは他のウィンドウより前面に表示しなければならない
- REQ-206: システムがダークモードの場合、メモのテーマも暗色系で表示されなければならない

### オプション要件

- REQ-301: システムはメモの色をカスタマイズできてもよい
- REQ-302: システムはメモのサイズを調整できてもよい
- REQ-303: システムはメモをグループ化できてもよい
- REQ-304: システムは検索機能を提供してもよい
- REQ-305: システムはメモのフォントサイズを変更できてもよい
- REQ-306: システムはメモをカテゴリ別に自動整列できてもよい
- REQ-307: システムはメモに期限を設定できてもよい
- REQ-308: システムはメモにタグ付け機能を提供してもよい
- REQ-309: システムはメモの作成時刻・更新時刻を表示できてもよい

### 制約要件

- REQ-401: システムはデスクトップの境界外にメモを配置してはならない
- REQ-402: システムは同時に1000個を超えるメモを表示してはならない
- REQ-403: システムはメモのデータ損失を防ぐため自動保存しなければならない
- REQ-404: システムは他のアプリケーションウィンドウの操作を妨げてはならない
- REQ-405: システムはグローバルホットキーが他のアプリケーションと競合してはならない
- REQ-406: システムは透明度設定が0%（完全透明）になってはならない
- REQ-407: システムは同時に表示できるプレビューポップアップを3個以下に制限しなければならない

## 非機能要件

### パフォーマンス

- NFR-001: メモの作成は1秒以内に完了しなければならない
- NFR-002: メモのドラッグ操作は遅延なく実行されなければならない
- NFR-003: アプリケーション起動時のメモ復元は3秒以内に完了しなければならない
- NFR-004: 100個のメモが表示されていてもアプリケーションはスムーズに動作しなければならない

### ユーザビリティ

- NFR-101: ユーザーは直感的にメモを操作できなければならない
- NFR-102: メモの視認性は十分に確保されなければならない
- NFR-103: ドラッグ&ドロップ操作は標準的なマウス操作で実行できなければならない
- NFR-104: メモの編集は一般的なテキスト編集操作をサポートしなければならない
- NFR-105: グローバルホットキーは0.5秒以内に反応しなければならない
- NFR-106: メモプレビューは250ms以内に表示されなければならない
- NFR-107: 透明度調整は10%〜90%の範囲でなければならない
- NFR-108: ダークモード切り替えは1秒以内に完了しなければならない

### アクセシビリティ

- NFR-111: システムは高コントラストモードをサポートしなければならない
- NFR-112: グローバルホットキーはユーザーがカスタマイズできなければならない
- NFR-113: フォントサイズは12px〜24pxの範囲で調整できなければならない
- NFR-114: 色分け機能は色覚異常者に配慮した色選択をしなければならない

### 互換性

- NFR-201: システムはWindows 10以降で動作しなければならない
- NFR-202: システムはmacOS 10.15以降で動作しなければならない
- NFR-203: システムは主要なLinuxディストリビューションで動作しなければならない

### セキュリティ

- NFR-301: メモのデータはローカルに安全に保存されなければならない
- NFR-302: 不正なファイルアクセスからメモデータを保護しなければならない

## Edgeケース

### エラー処理

- EDGE-001: メモの保存に失敗した場合、システムはユーザーに通知し、データ損失を防がなければならない
- EDGE-002: アプリケーションクラッシュ時、システムは未保存のメモ内容を復旧できなければならない
- EDGE-003: ディスク容量不足の場合、システムは適切なエラーメッセージを表示しなければならない
- EDGE-004: グローバルホットキーが登録できない場合、代替キーを提案しなければならない
- EDGE-005: システムトレイが利用できない環境では、タスクバー通知で代替しなければならない
- EDGE-006: 期限アラートが表示できない場合、システムログに記録しなければならない

### 境界値

- EDGE-101: メモのサイズが最小値（50x50px）の場合でも正常に動作しなければならない
- EDGE-102: メモのサイズが最大値（800x600px）の場合でも正常に動作しなければならない
- EDGE-103: メモの文字数が上限（10000文字）に達した場合、適切に制限しなければならない

### 特殊状況

- EDGE-201: 複数のモニター環境でメモが画面外に移動した場合、メイン画面に自動移動しなければならない
- EDGE-202: システム解像度変更時、メモの位置を適切に調整しなければならない
- EDGE-203: 長時間使用でメモリリークが発生しないよう適切にリソース管理しなければならない
- EDGE-204: 大量のメモ（100個以上）がある場合、プレビュー機能は性能劣化を起こしてはならない
- EDGE-205: システムがスリープ/復帰した際、メモの状態が保持されなければならない
- EDGE-206: 他アプリがフルスクリーンの場合、最前面メモは自動的に非表示になってもよい
- EDGE-207: OSのテーマ変更時、ダークモード設定が自動追従してもよい

## 受け入れ基準

### 機能テスト

- [ ] 新規メモを作成し、デスクトップ上に配置できる
- [ ] メモをドラッグ&ドロップで移動できる
- [ ] メモの内容を編集できる
- [ ] メモを削除できる
- [ ] アプリ再起動後にメモが復元される
- [ ] 複数のメモを同時に操作できる
- [ ] 右クリックコンテキストメニューが動作する
- [ ] キーボードショートカットが動作する
- [ ] グローバルホットキー（Ctrl+Shift+N等）でメモ作成できる
- [ ] システムトレイアイコンから各機能にアクセスできる
- [ ] メモの透明度調整ができる
- [ ] メモを最前面表示に設定できる
- [ ] メモの自動整列機能が動作する
- [ ] ダークモード表示に切り替えできる
- [ ] メモのピン留め機能が動作する
- [ ] マウスホバーでメモプレビューが表示される
- [ ] メモを重要度で色分けできる
- [ ] 期限付きメモのアラート通知が動作する
- [ ] フォーカス追従機能が動作する

### 非機能テスト

- [ ] 100個のメモが表示されていても動作が軽快である
- [ ] メモの作成・編集・削除が1秒以内に完了する
- [ ] ドラッグ操作に遅延がない
- [ ] アプリケーション起動が3秒以内に完了する
- [ ] 長時間使用してもメモリ使用量が安定している
- [ ] 複数モニター環境で正常動作する
- [ ] グローバルホットキーが0.5秒以内に反応する
- [ ] メモプレビューが250ms以内に表示される
- [ ] 透明度調整がスムーズに動作する
- [ ] ダークモード切り替えが1秒以内に完了する
- [ ] 期限アラートが正確な時刻に通知される
- [ ] 100個以上のメモでもプレビュー機能が軽快に動作する

### ユーザビリティテスト

- [ ] 高コントラストモードで視認性が確保される
- [ ] ユーザー定義ホットキーが正常に設定される
- [ ] フォントサイズ調整が適切に反映される
- [ ] 色覚異常者向けの色選択が適切である

### プラットフォーム別テスト

- [ ] Windows環境での動作確認
- [ ] macOS環境での動作確認
- [ ] Linux環境での動作確認
- [ ] 各OS固有の機能（通知、システムトレイ等）の確認

## 技術仕様

### コア技術スタック

#### フロントエンド
- **Electron**: v32+ (最新安定版)
- **React**: v19+ (React Compiler対応)
- **TypeScript**: v5.6+ (型安全性の強化)
- **Vite**: v6+ (高速ビルド・HMR)

#### UI・スタイリング
- **Tailwind CSS**: v4+ (モダンCSS、ダークモード対応)
- **Framer Motion**: v11+ (スムーズなアニメーション)
- **React Aria**: v3+ (アクセシビリティ対応)
- **Lucide React**: v0.460+ (アイコンライブラリ)

#### 状態管理・データ処理
- **Zustand**: v5+ (軽量状態管理)
- **React Hook Form**: v7+ (フォーム管理)
- **Zod**: v3+ (スキーマバリデーション)
- **Immer**: v10+ (イミュータブル更新)

#### データ永続化
- **SQLite**: v3.47+ (better-sqlite3経由)
- **Prisma**: v6+ (型安全なORM)
- **Node.js**: v20+ LTS (バックエンド処理)

#### 開発・ビルド環境
- **ESLint**: v9+ (コード品質)
- **Prettier**: v3+ (コードフォーマット)
- **Vitest**: v2+ (高速テスト)
- **Playwright**: v1.48+ (E2Eテスト)
- **electron-builder**: v25+ (パッケージング)

### アーキテクチャ設計

#### プロセス構成
```
┌─ Main Process (Node.js)
│  ├─ App lifecycle management
│  ├─ Global hotkeys (globalShortcut)
│  ├─ System tray integration
│  ├─ Data persistence (SQLite)
│  └─ IPC communication
│
└─ Renderer Process (Chromium)
   ├─ React 19 UI components
   ├─ Memo positioning engine
   ├─ Drag & Drop handlers
   └─ Real-time preview system
```

#### データフロー
```
User Action → UI Component → Zustand Store → IPC → Main Process → SQLite
                ↓
     Real-time UI Update ← IPC Response ←─────┘
```

#### コンポーネント階層
```
App
├── GlobalHotKeyManager
├── SystemTrayManager
├── MemoContainer
│   ├── MemoItem
│   │   ├── MemoContent (editable)
│   │   ├── MemoControls
│   │   └── MemoPreview
│   └── MemoCreator
├── SettingsPanel
└── NotificationSystem
```

### インフラ・デプロイ構成

#### 開発環境
- **開発サーバー**: Vite Dev Server (HMR対応)
- **デバッグ**: Chrome DevTools + React DevTools
- **プロファイリング**: React Profiler + Electron Performance Monitor
- **モックデータ**: MSW (Mock Service Worker)

#### ビルド・パッケージング
```yaml
Build Pipeline:
  1. TypeScript compilation (tsc)
  2. React compilation (Vite)
  3. Asset optimization (Vite plugins)
  4. Electron packaging (electron-builder)
  5. Code signing (Windows/macOS)
  6. Installer creation (NSIS/DMG/AppImage)
```

#### 配布戦略
- **Windows**: .exe installer + Microsoft Store (future)
- **macOS**: .dmg + Mac App Store (future) + Homebrew Cask
- **Linux**: .AppImage + .deb/.rpm packages + Snap Store
- **自動更新**: electron-updater (GitHub Releases)

### セキュリティ設計

#### Electron Security
- **Context Isolation**: 有効化
- **Node Integration**: 無効化（renderer process）
- **Remote Module**: 使用禁止
- **Content Security Policy**: 厳格設定
- **Preload Scripts**: 最小権限での IPC 通信

#### データ保護
- **暗号化**: SQLite + SQLCipher (機密データ)
- **バックアップ**: 自動バックアップ機能
- **データ検証**: Zod スキーマバリデーション

### パフォーマンス最適化

#### React 19最適化
- **React Compiler**: 自動メモ化
- **Concurrent Features**: useTransition, useDeferredValue
- **Server Components**: 将来的な拡張用
- **Selective Hydration**: 初期表示高速化

#### Electronパフォーマンス
- **Lazy Loading**: 非表示メモの遅延読み込み
- **Virtual Scrolling**: 大量メモ対応
- **メモリ管理**: WeakMap使用、適切なcleanup
- **プロセス分離**: 重い処理は専用プロセス

### 監視・ログ

#### エラートラッキング
- **Sentry**: クラッシュレポート
- **Winston**: 構造化ログ
- **電子ログ**: 診断用詳細ログ

#### メトリクス
- **アプリ使用統計**: 匿名化データ
- **パフォーマンス指標**: 起動時間、メモリ使用量
- **ユーザーフィードバック**: アプリ内フィードバック機能

## 開発環境セットアップ

### 必須環境
```yaml
Node.js: v20.x LTS以上
npm: v10.x以上 (または pnpm v9.x推奨)
Git: v2.40以上
OS: Windows 10+, macOS 11+, Ubuntu 20.04+
```

### プロジェクト構成
```
random-memo-app/
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── index.ts         # エントリーポイント
│   │   ├── ipc-handlers.ts  # IPC通信ハンドラー
│   │   ├── database/        # SQLite操作
│   │   └── system/          # OS連携機能
│   ├── renderer/            # React UI
│   │   ├── components/      # React コンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── stores/         # Zustand stores
│   │   ├── utils/          # ユーティリティ
│   │   └── styles/         # Tailwind設定
│   ├── preload/            # Preload scripts
│   └── shared/             # 共有型定義・ユーティリティ
├── tests/                  # テストファイル
├── docs/                   # ドキュメント
├── build/                  # ビルド設定
└── dist/                   # 出力ディレクトリ
```

### 開発スクリプト
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite --mode development",
    "dev:electron": "electron . --dev",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build",
    "build:main": "tsc -p tsconfig.main.json",
    "dist": "electron-builder",
    "dist:win": "electron-builder --win",
    "dist:mac": "electron-builder --mac", 
    "dist:linux": "electron-builder --linux",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write ."
  }
}
```

### 設定ファイル

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      external: ['electron']
    }
  }
});
```

#### electron-builder設定
```yaml
appId: com.yourcompany.random-memo-app
productName: Random Memo App
directories:
  output: release
files:
  - dist/**/*
  - node_modules/**/*
  - package.json
mac:
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
win:
  target: nsis
  publisherName: Your Company
linux:
  target:
    - AppImage
    - deb
    - rpm
publish:
  provider: github
  owner: yourcompany
  repo: random-memo-app
```

## CI/CD パイプライン

### GitHub Actions設定
```yaml
name: Build and Release
on:
  push:
    tags: ['v*']
  
jobs:
  release:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build
      - run: npm run dist
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 品質管理
- **Pre-commit hooks**: Husky + lint-staged
- **コード品質**: ESLint + TypeScript strict mode
- **テストカバレッジ**: 80%以上を目標
- **セキュリティスキャン**: npm audit + Snyk

## 実装ロードマップ

### Phase 1: コア機能 (MVP)
- [ ] 基本的なメモ作成・編集・削除
- [ ] ドラッグ&ドロップ機能
- [ ] データ永続化 (SQLite)
- [ ] 基本UI (ライト/ダークモード)

### Phase 2: アクセシビリティ機能
- [ ] グローバルホットキー
- [ ] システムトレイ統合
- [ ] 透明度調整
- [ ] 最前面表示

### Phase 3: 高度な管理機能
- [ ] メモプレビュー
- [ ] 重要度による色分け
- [ ] 自動整列機能
- [ ] 検索・フィルタ機能

### Phase 4: 通知・アラート
- [ ] 期限アラート機能
- [ ] リマインダー機能
- [ ] フォーカス追従機能

## 今後の拡張可能性

### 短期 (6ヶ月以内)
- マークダウン記法サポート
- 画像・ファイル添付機能
- テンプレート機能
- キーボードショートカットのカスタマイズ
- 多言語対応 (i18next)

### 中期 (1年以内)
- クラウド同期機能 (Firebase/Supabase)
- チーム共有機能
- プラグインシステム
- API連携 (Notion, Todoist等)
- Web版クライアント

### 長期 (1年以上)
- AI機能統合 (要約、分類、提案)
- モバイルアプリ (React Native)
- 音声入力・読み上げ
- 手書き入力対応
- エンタープライズ機能 (SSO, 管理コンソール)