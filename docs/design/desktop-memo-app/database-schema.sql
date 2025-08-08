-- =============================================================================
-- デスクトップメモアプリ データベーススキーマ
-- SQLite 3.47+ 対応
-- =============================================================================

-- データベース設定
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;

-- =============================================================================
-- メインテーブル: memos
-- =============================================================================

CREATE TABLE IF NOT EXISTS memos (
    -- 基本情報
    id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36), -- UUID v4
    content TEXT NOT NULL DEFAULT '',
    
    -- 位置・サイズ情報
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    width INTEGER NOT NULL DEFAULT 200 CHECK (width >= 50 AND width <= 2000),
    height INTEGER NOT NULL DEFAULT 150 CHECK (height >= 50 AND height <= 2000),
    
    -- 表示設定
    opacity REAL NOT NULL DEFAULT 1.0 CHECK (opacity >= 0.1 AND opacity <= 1.0),
    always_on_top BOOLEAN NOT NULL DEFAULT FALSE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- スタイル設定
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    background_color TEXT NOT NULL DEFAULT '#FFEB3B' CHECK (background_color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    text_color TEXT NOT NULL DEFAULT '#000000' CHECK (text_color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    font_size INTEGER NOT NULL DEFAULT 14 CHECK (font_size >= 10 AND font_size <= 32),
    
    -- タイムスタンプ
    due_date TEXT, -- ISO 8601 format (nullable)
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    
    -- ソフト削除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- タグテーブル: tags
-- =============================================================================

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT DEFAULT '#808080' CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =============================================================================
-- メモ-タグ関連テーブル: memo_tags
-- =============================================================================

CREATE TABLE IF NOT EXISTS memo_tags (
    memo_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    
    PRIMARY KEY (memo_id, tag_id),
    FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- =============================================================================
-- 設定テーブル: settings
-- =============================================================================

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL, -- JSON string
    type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =============================================================================
-- バックアップメタデータテーブル: backup_metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS backup_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_path TEXT NOT NULL,
    memo_count INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER NOT NULL DEFAULT 0, -- bytes
    checksum TEXT NOT NULL, -- SHA-256
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    
    UNIQUE(backup_path, created_at)
);

-- =============================================================================
-- インデックス定義
-- =============================================================================

-- メモテーブルのパフォーマンス最適化
CREATE INDEX IF NOT EXISTS idx_memos_is_deleted ON memos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON memos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_due_date ON memos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memos_priority ON memos(priority DESC);
CREATE INDEX IF NOT EXISTS idx_memos_position ON memos(x, y);

-- フルテキスト検索用インデックス (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS memos_fts USING fts5(
    content,
    content=memos,
    content_rowid=rowid,
    tokenize='porter'
);

-- FTS5インデックスの自動更新トリガー
CREATE TRIGGER IF NOT EXISTS memos_fts_insert AFTER INSERT ON memos BEGIN
    INSERT INTO memos_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER IF NOT EXISTS memos_fts_delete AFTER DELETE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
END;

CREATE TRIGGER IF NOT EXISTS memos_fts_update AFTER UPDATE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
    INSERT INTO memos_fts(rowid, content) VALUES (new.rowid, new.content);
END;

-- タグ関連インデックス
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo_id ON memo_tags(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag_id ON memo_tags(tag_id);

-- 設定テーブルインデックス
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- =============================================================================
-- トリガー定義
-- =============================================================================

-- メモ更新時のupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_memos_updated_at 
AFTER UPDATE ON memos
FOR EACH ROW
BEGIN
    UPDATE memos SET updated_at = datetime('now', 'utc') WHERE id = NEW.id;
END;

-- 設定更新時のupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_settings_updated_at 
AFTER UPDATE ON settings
FOR EACH ROW
BEGIN
    UPDATE settings SET updated_at = datetime('now', 'utc') WHERE key = NEW.key;
END;

-- メモ削除時のタグ関連レコード削除
CREATE TRIGGER IF NOT EXISTS delete_memo_tags_on_memo_delete
AFTER UPDATE OF is_deleted ON memos
FOR EACH ROW
WHEN NEW.is_deleted = TRUE
BEGIN
    DELETE FROM memo_tags WHERE memo_id = NEW.id;
END;

-- =============================================================================
-- ビュー定義
-- =============================================================================

-- アクティブなメモのビュー（削除されていないメモ）
CREATE VIEW IF NOT EXISTS active_memos AS
SELECT 
    id,
    content,
    x,
    y,
    width,
    height,
    opacity,
    always_on_top,
    pinned,
    priority,
    background_color,
    text_color,
    font_size,
    due_date,
    created_at,
    updated_at
FROM memos 
WHERE is_deleted = FALSE;

-- タグ付きメモのビュー
CREATE VIEW IF NOT EXISTS memos_with_tags AS
SELECT 
    m.*,
    GROUP_CONCAT(t.name, ',') as tag_names,
    GROUP_CONCAT(t.color, ',') as tag_colors
FROM active_memos m
LEFT JOIN memo_tags mt ON m.id = mt.memo_id
LEFT JOIN tags t ON mt.tag_id = t.id
GROUP BY m.id;

-- 期限切れメモのビュー
CREATE VIEW IF NOT EXISTS overdue_memos AS
SELECT *
FROM active_memos
WHERE due_date IS NOT NULL 
  AND datetime(due_date) < datetime('now', 'utc');

-- 統計情報ビュー
CREATE VIEW IF NOT EXISTS memo_stats AS
SELECT 
    COUNT(*) as total_memos,
    COUNT(CASE WHEN is_deleted = FALSE THEN 1 END) as active_memos,
    COUNT(CASE WHEN is_deleted = TRUE THEN 1 END) as deleted_memos,
    COUNT(CASE WHEN due_date IS NOT NULL AND datetime(due_date) < datetime('now', 'utc') THEN 1 END) as overdue_memos,
    AVG(CASE WHEN is_deleted = FALSE THEN priority END) as avg_priority,
    MIN(created_at) as oldest_memo,
    MAX(created_at) as newest_memo
FROM memos;

-- =============================================================================
-- 初期設定データ
-- =============================================================================

-- デフォルト設定の挿入
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES 
-- UI設定
('ui.theme', '"system"', 'string', 'アプリケーションテーマ (light/dark/system)'),
('ui.defaultMemoSize', '{"width": 200, "height": 150}', 'object', 'デフォルトメモサイズ'),
('ui.defaultFontSize', '14', 'number', 'デフォルトフォントサイズ'),
('ui.previewDelay', '250', 'number', 'プレビュー表示遅延時間 (ms)'),
('ui.animationDuration', '200', 'number', 'アニメーション時間 (ms)'),
('ui.autoArrangeEnabled', 'true', 'boolean', '自動整列機能有効フラグ'),

-- 優先度カラー設定
('ui.priorityColors', '{"1": "#E0E0E0", "2": "#81C784", "3": "#FFEB3B", "4": "#FF9800", "5": "#F44336"}', 'object', '優先度別カラー設定'),

-- ホットキー設定
('hotKeys.createMemo', '"CommandOrControl+Shift+N"', 'string', 'メモ作成ホットキー'),
('hotKeys.toggleVisibility', '"CommandOrControl+Shift+H"', 'string', '表示切り替えホットキー'),
('hotKeys.focusSearch', '"CommandOrControl+Shift+F"', 'string', '検索フォーカスホットキー'),

-- システム設定
('system.startMinimized', 'false', 'boolean', '起動時最小化'),
('system.showInSystemTray', 'true', 'boolean', 'システムトレイ表示'),
('system.autoStart', 'false', 'boolean', '自動起動'),
('system.notificationsEnabled', 'true', 'boolean', '通知有効'),
('system.backupEnabled', 'true', 'boolean', 'バックアップ有効'),
('system.backupInterval', '24', 'number', 'バックアップ間隔 (時間)');

-- デフォルトタグの挿入
INSERT OR IGNORE INTO tags (name, color) VALUES 
('重要', '#F44336'),
('仕事', '#2196F3'),
('プライベート', '#4CAF50'),
('TODO', '#FF9800'),
('アイデア', '#9C27B0'),
('メモ', '#607D8B');

-- =============================================================================
-- データベース整合性チェック用関数（カスタム関数として使用）
-- =============================================================================

-- 孤立タグのクリーンアップ用クエリ
-- DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM memo_tags);

-- 重複メモのチェック用クエリ
-- SELECT content, x, y, COUNT(*) as count FROM memos WHERE is_deleted = FALSE GROUP BY content, x, y HAVING count > 1;

-- データベースサイズ最適化用クエリ
-- VACUUM;
-- PRAGMA optimize;

-- =============================================================================
-- パフォーマンス最適化のための分析クエリ
-- =============================================================================

-- 最も使用されているタグ
-- SELECT t.name, COUNT(*) as usage_count FROM tags t JOIN memo_tags mt ON t.id = mt.tag_id GROUP BY t.id ORDER BY usage_count DESC;

-- 画面領域ごとのメモ分布
-- SELECT 
--     CASE 
--         WHEN x < 500 AND y < 500 THEN '左上'
--         WHEN x >= 500 AND y < 500 THEN '右上'
--         WHEN x < 500 AND y >= 500 THEN '左下'
--         ELSE '右下'
--     END as screen_area,
--     COUNT(*) as memo_count
-- FROM active_memos 
-- GROUP BY screen_area;

-- 優先度別メモ統計
-- SELECT priority, COUNT(*) as count, AVG(length(content)) as avg_content_length FROM active_memos GROUP BY priority ORDER BY priority;

-- =============================================================================
-- バックアップ・復元用SQL
-- =============================================================================

-- 完全バックアップ用クエリ（アプリケーションで使用）
-- SELECT * FROM memos WHERE is_deleted = FALSE;
-- SELECT * FROM tags;
-- SELECT * FROM memo_tags;
-- SELECT * FROM settings;

-- 復元時の重複チェック
-- INSERT OR IGNORE INTO memos (...) VALUES (...);

-- =============================================================================
-- 開発・デバッグ用クエリ
-- =============================================================================

-- テストデータ生成
-- INSERT INTO memos (id, content, x, y) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'テストメモ1', 100, 100),
-- ('550e8400-e29b-41d4-a716-446655440001', 'テストメモ2', 300, 200),
-- ('550e8400-e29b-41d4-a716-446655440002', 'テストメモ3', 500, 300);

-- 全データクリア（開発環境のみ）
-- DELETE FROM memo_tags;
-- DELETE FROM memos;
-- DELETE FROM tags WHERE id > 6; -- デフォルトタグは保持
-- DELETE FROM backup_metadata;

-- =============================================================================
-- スキーマバージョン管理
-- =============================================================================

-- スキーマバージョン情報
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES 
('schema.version', '"1.0.0"', 'string', 'データベーススキーマバージョン'),
('schema.createdAt', '"' || datetime('now', 'utc') || '"', 'string', 'スキーマ作成日時'),
('schema.lastMigration', 'null', 'string', '最後のマイグレーション実行日時');

-- 初期化完了フラグ
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES 
('system.initialized', 'true', 'boolean', 'システム初期化完了フラグ');

-- =============================================================================
-- ライセンス・マネタイゼーション関連テーブル
-- =============================================================================

-- ライセンス情報テーブル
CREATE TABLE IF NOT EXISTS license (
    id INTEGER PRIMARY KEY,
    license_key TEXT UNIQUE,
    license_type TEXT NOT NULL DEFAULT 'free' CHECK (license_type IN ('free', 'standard', 'student', 'enterprise')),
    activation_date TEXT,
    last_verification TEXT,
    grace_period_start TEXT,
    device_id TEXT NOT NULL,
    user_email TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ライセンス制限設定テーブル
CREATE TABLE IF NOT EXISTS license_limits (
    license_type TEXT PRIMARY KEY,
    max_memos INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited
    max_concurrent_memos INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited  
    features_enabled TEXT NOT NULL DEFAULT '[]', -- JSON array
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- アップグレード促進履歴テーブル
CREATE TABLE IF NOT EXISTS upgrade_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('subtle', 'modal', 'banner')),
    feature_triggered TEXT,
    shown_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    user_action TEXT CHECK (user_action IN ('dismissed', 'upgraded', 'later', 'never_show'))
);

-- 機能使用統計テーブル（マネタイゼーション分析用）
CREATE TABLE IF NOT EXISTS feature_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    license_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    
    UNIQUE(feature_name, license_type) ON CONFLICT REPLACE
);

-- =============================================================================
-- ライセンス関連インデックス
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_license_key ON license(license_key);
CREATE INDEX IF NOT EXISTS idx_license_type ON license(license_type);
CREATE INDEX IF NOT EXISTS idx_license_device_id ON license(device_id);
CREATE INDEX IF NOT EXISTS idx_license_valid ON license(is_valid);

CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_type ON upgrade_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_shown_at ON upgrade_prompts(shown_at);

CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage_stats(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_license ON feature_usage_stats(license_type);

-- =============================================================================
-- ライセンス関連トリガー
-- =============================================================================

-- ライセンステーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_license_updated_at 
AFTER UPDATE ON license
FOR EACH ROW
BEGIN
    UPDATE license SET updated_at = datetime('now', 'utc') WHERE id = NEW.id;
END;

-- ライセンス制限テーブルのupdated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_license_limits_updated_at 
AFTER UPDATE ON license_limits
FOR EACH ROW
BEGIN
    UPDATE license_limits SET updated_at = datetime('now', 'utc') WHERE license_type = NEW.license_type;
END;

-- 機能使用時の統計更新トリガー
CREATE TRIGGER IF NOT EXISTS update_feature_usage_on_memo_create
AFTER INSERT ON memos
FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO feature_usage_stats (feature_name, usage_count, license_type)
    VALUES (
        'memo_create',
        COALESCE((SELECT usage_count FROM feature_usage_stats WHERE feature_name = 'memo_create' AND license_type = (SELECT license_type FROM license WHERE id = 1)), 0) + 1,
        (SELECT license_type FROM license WHERE id = 1)
    );
END;

-- =============================================================================
-- ライセンス関連ビュー
-- =============================================================================

-- 現在のライセンス状態ビュー
CREATE VIEW IF NOT EXISTS current_license_status AS
SELECT 
    l.license_type,
    l.license_key,
    l.is_valid,
    l.activation_date,
    l.last_verification,
    l.grace_period_start,
    ll.max_memos,
    ll.max_concurrent_memos,
    ll.features_enabled,
    CASE 
        WHEN l.grace_period_start IS NOT NULL 
        THEN julianday('now') - julianday(l.grace_period_start)
        ELSE 0 
    END as grace_period_days
FROM license l
LEFT JOIN license_limits ll ON l.license_type = ll.license_type
WHERE l.id = 1; -- 現在のライセンス（1つのみ）

-- メモ数制限状態ビュー
CREATE VIEW IF NOT EXISTS memo_limit_status AS
SELECT 
    (SELECT COUNT(*) FROM memos WHERE is_deleted = FALSE) as current_memo_count,
    (SELECT COUNT(*) FROM memos WHERE is_deleted = FALSE) as concurrent_memo_count,
    ll.max_memos,
    ll.max_concurrent_memos,
    CASE 
        WHEN ll.max_memos = -1 THEN TRUE
        ELSE (SELECT COUNT(*) FROM memos WHERE is_deleted = FALSE) < ll.max_memos
    END as can_create_memo,
    CASE 
        WHEN ll.max_memos = -1 THEN -1
        ELSE ll.max_memos - (SELECT COUNT(*) FROM memos WHERE is_deleted = FALSE)
    END as remaining_slots
FROM license_limits ll
WHERE ll.license_type = (SELECT license_type FROM license WHERE id = 1);

-- 機能使用統計サマリービュー
CREATE VIEW IF NOT EXISTS feature_usage_summary AS
SELECT 
    license_type,
    COUNT(DISTINCT feature_name) as total_features_used,
    SUM(usage_count) as total_usage_count,
    MAX(last_used_at) as last_activity
FROM feature_usage_stats
GROUP BY license_type;

-- =============================================================================
-- ライセンス制限初期データ
-- =============================================================================

-- ライセンス制限設定の初期データ
INSERT OR REPLACE INTO license_limits (license_type, max_memos, max_concurrent_memos, features_enabled) VALUES 
('free', 10, 10, '["basic_memo", "drag_drop", "light_dark_mode", "basic_search", "memo_edit", "memo_delete"]'),
('standard', -1, -1, '["all_features"]'),
('student', -1, -1, '["all_features"]'),
('enterprise', -1, -1, '["all_features", "priority_support", "advanced_analytics"]');

-- デフォルトライセンス（無料版）の設定
INSERT OR IGNORE INTO license (id, license_type, device_id, is_valid) VALUES 
(1, 'free', 'default_device_' || hex(randomblob(8)), TRUE);

-- ライセンス関連設定
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES 
-- ライセンス設定
('license.lastCheck', 'null', 'string', '最後のライセンス確認日時'),
('license.graceWarningShown', 'false', 'boolean', 'グレースピリオド警告表示済みフラグ'),
('license.deviceFingerprint', '""', 'string', 'デバイスフィンガープリント'),

-- アップグレード促進設定
('upgrade.promptInterval', '7', 'number', 'アップグレード促進表示間隔（日数）'),
('upgrade.lastPromptDate', 'null', 'string', '最後のアップグレード促進表示日'),
('upgrade.permanentlyHidden', 'false', 'boolean', 'アップグレード促進の永続非表示'),
('upgrade.promptsShown', '0', 'number', 'アップグレード促進表示回数'),

-- 機能制限関連設定  
('limits.memoLimitWarningShown', 'false', 'boolean', 'メモ数制限警告表示済み'),
('limits.featureLimitPromptCount', '0', 'number', '機能制限プロンプト表示回数'),

-- 使用統計設定
('analytics.enabled', 'true', 'boolean', '匿名使用統計収集有効'),
('analytics.lastReport', 'null', 'string', '最後の統計レポート送信日時'),
('analytics.userId', '""', 'string', '匿名ユーザーID');

-- =============================================================================
-- ライセンス管理用クエリ（参考）
-- =============================================================================

-- 現在のライセンス情報取得
-- SELECT * FROM current_license_status;

-- メモ作成可否チェック
-- SELECT can_create_memo, remaining_slots FROM memo_limit_status;

-- 機能利用可否チェック（例：グローバルホットキー）
-- SELECT 
--   CASE 
--     WHEN JSON_EXTRACT(features_enabled, '$') LIKE '%global_hotkeys%' OR 
--          JSON_EXTRACT(features_enabled, '$') LIKE '%all_features%'
--     THEN 1 ELSE 0 
--   END as can_use_global_hotkeys
-- FROM license_limits 
-- WHERE license_type = (SELECT license_type FROM license WHERE id = 1);

-- ライセンス有効期限チェック（グレースピリオド考慮）
-- SELECT 
--   is_valid,
--   CASE 
--     WHEN grace_period_start IS NOT NULL 
--     THEN 30 - (julianday('now') - julianday(grace_period_start))
--     ELSE NULL 
--   END as grace_days_remaining
-- FROM license WHERE id = 1;

-- 機能使用統計の取得
-- SELECT feature_name, usage_count, last_used_at 
-- FROM feature_usage_stats 
-- WHERE license_type = (SELECT license_type FROM license WHERE id = 1)
-- ORDER BY usage_count DESC;