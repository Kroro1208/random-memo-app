# デスクトップメモアプリ 技術設計書

## 📋 概要

本設計書は、デスクトップ上にランダムにメモを配置できるElectronアプリケーションの技術設計を包括的にまとめています。React 19とTypeScriptによる型安全な開発、SQLiteによるローカルデータ永続化、システム統合機能を提供するアプリケーションの詳細設計です。

## 📁 ファイル構成

### アーキテクチャ設計
- **[architecture.md](./architecture.md)**: システム全体のアーキテクチャ設計
  - レイヤードアーキテクチャ + イベント駆動設計
  - Main/Rendererプロセス分離設計
  - セキュリティ・パフォーマンス設計方針

### データフロー設計
- **[dataflow.md](./dataflow.md)**: アプリケーション内のデータフローと処理パターン
  - Mermaid図による可視化
  - メモ操作フロー（作成・編集・ドラッグ）
  - IPC通信パターン
  - エラーハンドリングフロー

### 型定義
- **[interfaces.ts](./interfaces.ts)**: TypeScript型定義とインターフェース
  - コアエンティティ型（Memo, Settings等）
  - UI状態管理型
  - IPC通信型
  - バリデーション・エラーハンドリング型

### データベース設計
- **[database-schema.sql](./database-schema.sql)**: SQLiteデータベース完全スキーマ
  - テーブル定義（制約・インデックス付き）
  - ビュー定義
  - トリガー定義
  - 初期データ・設定値

### IPC通信設計
- **[ipc-endpoints.md](./ipc-endpoints.md)**: Main-Renderer間IPC通信仕様
  - 全エンドポイント詳細仕様
  - リクエスト/レスポンス型定義
  - イベント通知仕様
  - エラーハンドリング戦略

## 🏗️ 設計思想

### 1. 型安全性重視
- TypeScript 5.6+による厳密な型チェック
- コンパイル時エラー検出によるバグ防止
- IPCレイヤーでの型安全な通信

### 2. パフォーマンス最適化
- React 19 Compilerによる自動最適化
- SQLite WALモードによる高速DB操作
- Virtual Scrollingによる大量データ対応

### 3. セキュリティファースト
- Context Isolation有効化
- CSP（Content Security Policy）厳格適用
- 入力バリデーション・サニタイゼーション

### 4. 拡張性確保
- イベント駆動アーキテクチャ
- プラグインシステム基盤
- 設定の階層化・モジュール化

## 🔧 技術スタック

### Core Framework
- **Electron 32+**: デスクトップアプリ基盤
- **React 19**: UI フレームワーク（Compiler対応）
- **TypeScript 5.6+**: 型安全開発
- **Vite 6**: 高速開発・ビルド環境

### State Management
- **Zustand 5**: 軽量状態管理
- **Immer 10**: イミュータブル更新
- **React Hook Form 7**: フォーム管理

### Database & Persistence
- **SQLite 3.47+**: ローカルデータベース
- **Prisma 6**: 型安全ORM
- **better-sqlite3**: Node.js SQLiteドライバー

### UI/UX
- **Tailwind CSS 4**: ユーティリティファーストCSS
- **Framer Motion 11**: アニメーションライブラリ
- **React Aria 3**: アクセシビリティ対応

## 📊 主要設計決定

### アーキテクチャパターン
- **採用**: Layered Architecture + Event-Driven
- **理由**: プロセス分離による安定性、疎結合設計による拡張性

### データベース選択
- **採用**: SQLite（ローカル）
- **理由**: ゼロ設定、高速、プライバシー保護、オフライン完結

### 状態管理戦略
- **採用**: Zustand + React状態の適材適所使い分け
- **理由**: Redux比較での簡潔性、学習コスト低減、パフォーマンス

### IPC通信設計
- **パターン**: Request-Response + Event Broadcasting
- **特徴**: 型安全、エラーハンドリング統一、パフォーマンス最適化

## 🚀 実装優先順位

### Phase 1: Core MVP（4-6週間）
1. **基本アーキテクチャ構築**
   - Electron + React セットアップ
   - TypeScript設定・型定義
   - SQLite データベース初期化

2. **コア機能実装**
   - メモ作成・編集・削除
   - ドラッグ&ドロップ
   - データ永続化

3. **基本UI実装**
   - メモコンポーネント
   - 設定パネル
   - ライト/ダークモード

### Phase 2: システム統合（2-3週間）
1. **OS統合機能**
   - グローバルホットキー
   - システムトレイ
   - 通知システム

2. **高度なUI機能**
   - 透明度調整
   - 最前面表示
   - メモプレビュー

### Phase 3: 管理機能（2-3週間）
1. **整理・管理機能**
   - 自動整列
   - 色分け・優先度
   - タグシステム

2. **検索・フィルタ機能**
   - 全文検索（FTS5）
   - 高度フィルタ
   - ソート機能

### Phase 4: 高度機能（2-4週間）
1. **通知・アラート**
   - 期限アラート
   - リマインダー
   - フォーカス追従

2. **最適化・polish**
   - パフォーマンス調整
   - アニメーション追加
   - アクセシビリティ対応

## 🧪 テスト戦略

### Unit Testing
- **フレームワーク**: Vitest + Testing Library
- **対象**: コンポーネント、フック、ユーティリティ
- **カバレッジ**: 80%以上目標

### Integration Testing
- **対象**: IPC通信、データベース操作
- **モック**: データベース、ファイルシステム
- **自動化**: CI/CDパイプライン統合

### E2E Testing
- **フレームワーク**: Playwright
- **対象**: ユーザーシナリオ全体
- **環境**: 各OS（Windows/macOS/Linux）

## 📈 パフォーマンス目標

### 応答性能
- **メモ作成**: 1秒以内
- **ドラッグ操作**: 遅延なし（<16ms）
- **プレビュー表示**: 250ms以内
- **検索**: 100ms以内（1000件まで）

### リソース使用量
- **メモリ使用量**: ベース100MB + 1KB/memo
- **起動時間**: 3秒以内
- **ファイルサイズ**: 配布パッケージ150MB以下

### スケーラビリティ
- **最大メモ数**: 10,000件（推奨1,000件）
- **同時表示**: 100件まで仮想化なしで軽快動作
- **データベースサイズ**: 100MB以下で最適パフォーマンス

## 🔒 セキュリティ設計

### Electron Security
- Context Isolation: ✅ 有効
- Node Integration: ❌ Renderer無効
- Remote Module: ❌ 使用禁止
- CSP: ✅ 厳格設定

### Data Security
- データ暗号化: SQLCipher対応（オプション）
- ファイル権限: 適切な権限設定
- 入力検証: 全入力のバリデーション・サニタイゼーション

## 🛠️ 開発環境

### 必要環境
- Node.js 20.x LTS
- npm 10.x / pnpm 9.x推奨
- Git 2.40+
- OS: Windows 10+, macOS 11+, Ubuntu 20.04+

### 開発ツール
- VS Code + 推奨拡張機能
- Chrome DevTools
- React DevTools
- SQLite Browser

## 📚 参考資料

### 技術ドキュメント
- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)
- [React 19 Documentation](https://react.dev/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 設計パターン
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Event-Driven Architecture](https://microservices.io/patterns/data/event-driven-architecture.html)
- [IPC Best Practices](https://www.electronjs.org/docs/api/ipc-main)

## 🎯 品質指標

### コード品質
- TypeScript strict mode: ✅
- ESLint + Prettier: ✅
- Husky pre-commit hooks: ✅
- 80%以上のテストカバレッジ: 🎯

### ユーザビリティ
- アクセシビリティ（WCAG 2.1 AA）: 🎯
- 多言語対応準備: 🎯
- レスポンシブ設計: 🎯
- 直感的なUX設計: 🎯

---

この設計書に基づいて、堅牢で拡張性の高いデスクトップメモアプリケーションを構築します。各設計決定は要件定義書の機能要件・非機能要件を満たすように最適化されており、将来的な機能拡張にも対応できる柔軟性を持っています。