/**
 * Shared constants for the Random Memo App
 */

export const APP_CONFIG = {
  name: 'Random Memo App',
  version: '0.1.0',
  description: 'Desktop sticky notes app with drag & drop functionality',
} as const;

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
  SYSTEM_GET_INFO: 'system:getInfo',
  
  // Settings operations
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET: 'settings:reset',
  
  // License operations
  LICENSE_ACTIVATE: 'license:activate',
  LICENSE_VALIDATE: 'license:validate',
  LICENSE_GET_STATUS: 'license:getStatus',
  LICENSE_DEACTIVATE: 'license:deactivate',
  LICENSE_CHECK_FEATURE: 'license:checkFeature',
  LICENSE_GET_LIMITS: 'license:getLimits',
  
  // Events (from main to renderer)
  EVENT_MEMO_CREATED: 'event:memoCreated',
  EVENT_MEMO_UPDATED: 'event:memoUpdated',
  EVENT_MEMO_DELETED: 'event:memoDeleted',
  EVENT_HOTKEY_PRESSED: 'event:hotkeyPressed',
  EVENT_SETTINGS_CHANGED: 'event:settingsChanged',
  EVENT_THEME_CHANGED: 'event:themeChanged',
  EVENT_LICENSE_ACTIVATED: 'event:licenseActivated',
  EVENT_LICENSE_EXPIRED: 'event:licenseExpired',
  EVENT_GRACE_PERIOD_STARTED: 'event:gracePeriodStarted',
  EVENT_FEATURE_LIMIT_REACHED: 'event:featureLimitReached',
} as const;

export const DEFAULT_MEMO_SETTINGS = {
  width: 200,
  height: 150,
  opacity: 1.0,
  priority: 3,
  backgroundColor: '#FFEB3B',
  textColor: '#000000',
  fontSize: 14,
} as const;

export const LICENSE_LIMITS = {
  FREE: {
    maxMemos: 10,
    maxConcurrentMemos: 10,
    features: ['basic_memo', 'drag_drop', 'light_dark_mode', 'basic_search', 'memo_edit', 'memo_delete'],
  },
  STANDARD: {
    maxMemos: -1, // unlimited
    maxConcurrentMemos: -1,
    features: ['all_features'],
  },
} as const;

export const PRIORITY_COLORS = {
  1: '#E0E0E0', // Low
  2: '#81C784', // Medium-Low
  3: '#FFEB3B', // Medium
  4: '#FF9800', // Medium-High
  5: '#F44336', // High
} as const;

export const HOTKEY_DEFAULTS = {
  createMemo: 'CommandOrControl+Shift+N',
  toggleVisibility: 'CommandOrControl+Shift+H',
  focusSearch: 'CommandOrControl+Shift+F',
} as const;

export const UI_CONSTANTS = {
  MIN_MEMO_WIDTH: 50,
  MIN_MEMO_HEIGHT: 50,
  MAX_MEMO_WIDTH: 800,
  MAX_MEMO_HEIGHT: 600,
  DRAG_THRESHOLD: 5,
  PREVIEW_DELAY: 250,
  ANIMATION_DURATION: 200,
} as const;

export const DATABASE_CONSTANTS = {
  MAX_CONTENT_LENGTH: 10000,
  BACKUP_INTERVAL_HOURS: 24,
  GRACE_PERIOD_DAYS: 30,
} as const;