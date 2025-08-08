/**
 * Shared types for the Random Memo App
 * Used by both main and renderer processes
 */

// Re-export design document types
export * from '../../docs/design/desktop-memo-app/interfaces';

// Additional runtime types
export interface AppInfo {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  arch: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppConfig {
  isDev: boolean;
  userDataPath: string;
  resourcesPath: string;
}

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  version: string;
  displays: DisplayInfo[];
}

// IPC Communication types
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  requestId?: string;
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Memo operations
  MEMO_CREATE: 'memo:create',
  MEMO_GET_BY_ID: 'memo:getById',
  MEMO_GET_ALL: 'memo:getAll',
  MEMO_UPDATE: 'memo:update',
  MEMO_DELETE: 'memo:delete',
  MEMO_GET_COUNT: 'memo:getCount',
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