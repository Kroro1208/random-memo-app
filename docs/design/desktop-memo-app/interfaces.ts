/**
 * デスクトップメモアプリ TypeScript型定義
 * 
 * このファイルはメインプロセスとレンダラープロセス間で共有される
 * 型定義を含んでいます。
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * メモの基本データ構造
 */
export interface Memo {
  /** 一意識別子 (UUID v4) */
  id: string;
  
  /** メモの内容テキスト */
  content: string;
  
  /** X座標位置 (px) */
  x: number;
  
  /** Y座標位置 (px) */
  y: number;
  
  /** 幅 (px) */
  width: number;
  
  /** 高さ (px) */
  height: number;
  
  /** 透明度 (0.1-1.0) */
  opacity: number;
  
  /** 最前面表示フラグ */
  alwaysOnTop: boolean;
  
  /** ピン留めフラグ (移動禁止) */
  pinned: boolean;
  
  /** 重要度レベル (1-5) */
  priority: number;
  
  /** 背景色 (hex color) */
  backgroundColor: string;
  
  /** テキスト色 (hex color) */
  textColor: string;
  
  /** フォントサイズ (px) */
  fontSize: number;
  
  /** 期限日時 (optional) */
  dueDate?: Date;
  
  /** タグ (optional) */
  tags?: string[];
  
  /** 作成日時 */
  createdAt: Date;
  
  /** 更新日時 */
  updatedAt: Date;
  
  /** ソフト削除フラグ */
  isDeleted: boolean;
}

/**
 * 新規メモ作成用の入力データ
 */
export interface CreateMemoInput {
  content?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
  priority?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  dueDate?: Date;
  tags?: string[];
}

/**
 * メモ更新用の部分データ
 */
export interface UpdateMemoInput {
  id: string;
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  alwaysOnTop?: boolean;
  pinned?: boolean;
  priority?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  dueDate?: Date | null;
  tags?: string[];
}

// ============================================================================
// Position and Layout Types
// ============================================================================

/**
 * 2D座標
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * サイズ情報
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 矩形領域
 */
export interface Rectangle extends Position, Size {}

/**
 * 画面情報
 */
export interface DisplayInfo {
  id: number;
  bounds: Rectangle;
  workArea: Rectangle;
  scaleFactor: number;
  isPrimary: boolean;
}

/**
 * ドラッグ状態
 */
export interface DragState {
  isDragging: boolean;
  memoId: string | null;
  startPosition: Position | null;
  currentPosition: Position | null;
  offset: Position | null;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * テーマ設定
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * メモ表示モード
 */
export type MemoDisplayMode = 'normal' | 'edit' | 'preview';

/**
 * 重要度色設定
 */
export interface PriorityColorScheme {
  1: string; // 最低
  2: string; // 低
  3: string; // 中
  4: string; // 高
  5: string; // 最高
}

/**
 * UI設定
 */
export interface UIPreferences {
  theme: ThemeMode;
  priorityColors: PriorityColorScheme;
  defaultMemoSize: Size;
  defaultFontSize: number;
  previewDelay: number; // ms
  animationDuration: number; // ms
  autoArrangeEnabled: boolean;
}

/**
 * グローバルホットキー設定
 */
export interface HotKeyConfig {
  createMemo: string; // e.g., 'CommandOrControl+Shift+N'
  toggleVisibility: string; // e.g., 'CommandOrControl+Shift+H'
  focusSearch: string; // e.g., 'CommandOrControl+Shift+F'
}

/**
 * アプリケーション設定
 */
export interface AppSettings {
  ui: UIPreferences;
  hotKeys: HotKeyConfig;
  startMinimized: boolean;
  showInSystemTray: boolean;
  autoStart: boolean;
  notificationsEnabled: boolean;
  backupEnabled: boolean;
  backupInterval: number; // hours
}

// ============================================================================
// IPC Communication Types
// ============================================================================

/**
 * IPC通信の基本レスポンス形式
 */
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * メモ操作のIPCチャンネル名
 */
export const IPC_CHANNELS = {
  // Memo operations
  MEMO_CREATE: 'memo:create',
  MEMO_UPDATE: 'memo:update',
  MEMO_DELETE: 'memo:delete',
  MEMO_GET_ALL: 'memo:getAll',
  MEMO_GET_BY_ID: 'memo:getById',
  MEMO_UPDATE_POSITION: 'memo:updatePosition',
  MEMO_AUTO_ARRANGE: 'memo:autoArrange',
  
  // System operations
  SYSTEM_GET_DISPLAYS: 'system:getDisplays',
  SYSTEM_SHOW_NOTIFICATION: 'system:showNotification',
  SYSTEM_SET_HOTKEYS: 'system:setHotkeys',
  
  // Settings operations
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET: 'settings:reset',
  
  // Events (from main to renderer)
  EVENT_MEMO_CREATED: 'event:memoCreated',
  EVENT_MEMO_UPDATED: 'event:memoUpdated',
  EVENT_MEMO_DELETED: 'event:memoDeleted',
  EVENT_HOTKEY_PRESSED: 'event:hotkeyPressed',
  EVENT_SETTINGS_CHANGED: 'event:settingsChanged',
  EVENT_THEME_CHANGED: 'event:themeChanged',
} as const;

/**
 * ホットキーイベント
 */
export interface HotKeyEvent {
  key: keyof HotKeyConfig;
  accelerator: string;
  timestamp: number;
}

/**
 * 通知表示要求
 */
export interface NotificationRequest {
  title: string;
  body: string;
  icon?: string;
  urgent?: boolean;
  actions?: Array<{
    type: string;
    text: string;
  }>;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

/**
 * 検索クエリ
 */
export interface SearchQuery {
  text?: string;
  tags?: string[];
  priority?: number[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasDeadline?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 検索結果
 */
export interface SearchResult {
  memos: Memo[];
  totalCount: number;
  hasMore: boolean;
}

// ============================================================================
// Animation and Effects Types
// ============================================================================

/**
 * アニメーション設定
 */
export interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'bounce';
  duration: number; // ms
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number; // ms
}

/**
 * プレビューポップアップ設定
 */
export interface PreviewConfig {
  maxWidth: number; // px
  maxHeight: number; // px
  showDelay: number; // ms
  hideDelay: number; // ms
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * アプリケーションエラータイプ
 */
export type AppErrorCode = 
  | 'MEMO_NOT_FOUND'
  | 'MEMO_VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'FILE_SYSTEM_ERROR'
  | 'IPC_ERROR'
  | 'HOTKEY_REGISTRATION_ERROR'
  | 'SYSTEM_INTEGRATION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * アプリケーションエラー
 */
export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * バリデーションルール
 */
export interface ValidationRule<T> {
  required?: boolean;
  min?: T extends number ? number : never;
  max?: T extends number ? number : never;
  minLength?: T extends string ? number : never;
  maxLength?: T extends string ? number : never;
  pattern?: T extends string ? RegExp : never;
  custom?: (value: T) => boolean | string;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 部分的なタイプ（ネストしたオブジェクトも含む）
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 必須フィールドのみ
 */
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * ID付きエンティティ
 */
export type WithId<T> = T & { id: string };

/**
 * タイムスタンプ付きエンティティ
 */
export type WithTimestamp<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// Database Types (for Prisma integration)
// ============================================================================

/**
 * データベースメモレコード（Prismaで生成される型と同期）
 */
export interface MemoRecord {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  alwaysOnTop: boolean;
  pinned: boolean;
  priority: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  dueDate: Date | null;
  tags: string;  // JSON string
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

/**
 * データベース操作結果
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    constraint?: string;
  };
}

// ============================================================================
// License and Monetization Types
// ============================================================================

/**
 * ライセンス種別
 */
export type LicenseType = 'free' | 'standard' | 'student' | 'enterprise';

/**
 * ライセンス情報
 */
export interface License {
  /** ライセンスキー（無料版はnull） */
  licenseKey: string | null;
  
  /** ライセンス種別 */
  licenseType: LicenseType;
  
  /** アクティベーション日時 */
  activationDate: Date | null;
  
  /** 最終認証日時 */
  lastVerification: Date | null;
  
  /** グレースピリオド開始日時 */
  gracePeriodStart: Date | null;
  
  /** デバイスID */
  deviceId: string;
  
  /** ライセンス有効性 */
  isValid: boolean;
  
  /** 有効期限までの日数（買い切りの場合は認証期限） */
  daysUntilExpiry: number | null;
}

/**
 * ライセンス制限情報
 */
export interface LicenseLimits {
  /** 最大メモ数（-1は無制限） */
  maxMemos: number;
  
  /** 最大同時表示メモ数（-1は無制限） */
  maxConcurrentMemos: number;
  
  /** 有効機能リスト */
  featuresEnabled: string[];
}

/**
 * ライセンス認証結果
 */
export interface LicenseValidationResult {
  /** 認証成功フラグ */
  isValid: boolean;
  
  /** ライセンス種別 */
  licenseType: LicenseType;
  
  /** 適用される制限 */
  limits: LicenseLimits;
  
  /** エラーメッセージ（認証失敗時） */
  error?: string;
  
  /** 認証トークン */
  token?: string;
}

/**
 * ライセンス認証リクエスト
 */
export interface LicenseActivationRequest {
  /** ライセンスキー */
  licenseKey: string;
  
  /** デバイスID */
  deviceId: string;
  
  /** ユーザーメールアドレス（オプション） */
  email?: string;
}

/**
 * 機能制限チェック結果
 */
export interface FeatureAvailability {
  /** 機能名 */
  feature: string;
  
  /** 利用可能フラグ */
  available: boolean;
  
  /** 制限理由（利用不可の場合） */
  reason?: 'license_required' | 'limit_exceeded' | 'not_implemented';
  
  /** アップグレード提案メッセージ */
  upgradeMessage?: string;
}

/**
 * メモ数制限状態
 */
export interface MemoLimitStatus {
  /** 現在のメモ数 */
  currentCount: number;
  
  /** 最大メモ数（-1は無制限） */
  maxCount: number;
  
  /** 新規作成可能フラグ */
  canCreate: boolean;
  
  /** 残り作成可能数 */
  remainingSlots: number;
  
  /** 制限に近づいている警告フラグ */
  nearLimit: boolean;
}

/**
 * アップグレード促進設定
 */
export interface UpgradePromptConfig {
  /** 表示頻度（日数） */
  showIntervalDays: number;
  
  /** 最後の表示日時 */
  lastShownAt: Date | null;
  
  /** 永続的に非表示フラグ */
  permanentlyHidden: boolean;
  
  /** プロンプトタイプ */
  promptType: 'subtle' | 'modal' | 'banner';
}

// ============================================================================
// License-aware Store Types
// ============================================================================

/**
 * ライセンス対応メモストア状態
 */
export interface LicenseAwareMemoStore {
  /** メモリスト */
  memos: Memo[];
  
  /** ライセンス情報 */
  license: License;
  
  /** ライセンス制限 */
  limits: LicenseLimits;
  
  /** メモ制限状態 */
  memoLimitStatus: MemoLimitStatus;
}

/**
 * 機能ゲート設定
 */
export interface FeatureGateProps {
  /** 機能識別子 */
  feature: string;
  
  /** 利用不可時のフォールバックUI */
  fallback?: React.ReactNode;
  
  /** 子要素 */
  children: React.ReactNode;
  
  /** アップグレード促進の強度 */
  upgradePromptLevel?: 'none' | 'subtle' | 'prominent';
}

// ============================================================================
// Export all types for easy importing
// ============================================================================

export type {
  // Core entities
  Memo,
  CreateMemoInput,
  UpdateMemoInput,
  
  // Position and layout
  Position,
  Size,
  Rectangle,
  DisplayInfo,
  DragState,
  
  // UI and settings
  ThemeMode,
  MemoDisplayMode,
  PriorityColorScheme,
  UIPreferences,
  HotKeyConfig,
  AppSettings,
  
  // IPC communication
  IPCResponse,
  HotKeyEvent,
  NotificationRequest,
  
  // Search and filter
  SearchQuery,
  SearchResult,
  
  // Animation and effects
  AnimationConfig,
  PreviewConfig,
  
  // Database
  MemoRecord,
  DatabaseResult,
  
  // Validation
  ValidationRule,
  ValidationResult,
  
  // Utility types
  DeepPartial,
  RequiredOnly,
  WithId,
  WithTimestamp,
  
  // License and monetization
  LicenseType,
  License,
  LicenseLimits,
  LicenseValidationResult,
  LicenseActivationRequest,
  FeatureAvailability,
  MemoLimitStatus,
  UpgradePromptConfig,
  LicenseAwareMemoStore,
  FeatureGateProps,
};

// Export constants
export { IPC_CHANNELS, AppError };
export type { AppErrorCode };