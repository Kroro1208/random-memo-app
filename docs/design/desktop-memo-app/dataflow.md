# データフロー図

## システム全体データフロー

```mermaid
flowchart TD
    User[👤 User] --> UI[🖥️ React UI]
    UI --> Preload[🔌 Preload Script]
    Preload --> IPC[📡 IPC Channel]
    IPC --> Main[⚙️ Main Process]
    Main --> DB[(🗄️ SQLite)]
    Main --> FS[📁 File System]
    Main --> OS[💻 OS APIs]
    
    UI --> Store[📦 Zustand Store]
    Store --> UI
    
    OS --> Hotkey[⌨️ Global Hotkeys]
    OS --> Tray[📍 System Tray]
    OS --> Notify[🔔 Notifications]
    
    Hotkey --> Main
    Tray --> Main
    Main --> Notify
    
    subgraph "Renderer Process"
        UI
        Store
        Preload
    end
    
    subgraph "Main Process"
        Main
        IPC
    end
    
    subgraph "System Integration"
        OS
        Hotkey
        Tray
        Notify
    end
```

## メモ操作フロー

### 1. メモ作成フロー

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant P as Preload
    participant M as Main Process
    participant D as SQLite
    
    Note over U,D: ホットキー (Ctrl+Shift+N) でメモ作成
    
    U->>+M: Global Hotkey Pressed
    M->>+R: IPC: create-memo-request
    R->>+P: Create Memo Action
    P->>+M: IPC: memo:create
    
    M->>+D: INSERT INTO memos
    D-->>-M: memo_id, created_at
    M-->>-P: IPC: memo:created
    P-->>-R: Memo Created Event
    R->>R: Update Zustand Store
    R-->>-U: Show New Memo UI
```

### 2. メモ編集フロー

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant P as Preload
    participant M as Main Process
    participant D as SQLite
    
    Note over U,D: ダブルクリックで編集開始
    
    U->>+R: Double Click Memo
    R->>R: Enter Edit Mode
    R-->>U: Show Edit UI
    
    Note over U,D: リアルタイム入力
    
    U->>+R: Type Content
    R->>R: Update Local State
    R->>+P: Debounced Save (300ms)
    P->>+M: IPC: memo:update
    
    M->>+D: UPDATE memos SET content=?, updated_at=?
    D-->>-M: Success
    M-->>-P: IPC: memo:updated
    P-->>-R: Save Confirmed
    
    Note over U,D: 編集完了
    
    U->>+R: Click Outside / Escape
    R->>R: Exit Edit Mode
    R-->>-U: Show Normal View
```

### 3. ドラッグ&ドロップフロー

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant P as Preload
    participant M as Main Process
    participant D as SQLite
    
    Note over U,D: メモをドラッグして移動
    
    U->>+R: Mouse Down on Memo
    R->>R: Start Drag Mode
    R-->>U: Visual Feedback (Semi-transparent)
    
    loop During Drag
        U->>R: Mouse Move
        R->>R: Update Position (x, y)
        R-->>U: Move Memo Visually
    end
    
    U->>+R: Mouse Up (Drop)
    R->>R: End Drag Mode
    R->>+P: Position Changed
    P->>+M: IPC: memo:updatePosition
    
    M->>+D: UPDATE memos SET x=?, y=?, updated_at=?
    D-->>-M: Success
    M-->>-P: IPC: position:updated
    P-->>-R: Position Saved
    R-->>-U: Normal Appearance
```

### 4. プレビュー表示フロー

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant T as Timer
    
    Note over U,R: マウスホバーでプレビュー
    
    U->>+R: Mouse Enter Memo
    R->>+T: Start Timer (250ms)
    
    alt Timer Completes
        T-->>R: Timer Expired
        R->>R: Show Preview Popup
        R-->>U: Display Content Preview
        
        U->>+R: Mouse Leave
        R->>R: Hide Preview
        R-->>-U: Remove Preview
    else User Leaves Before Timer
        U->>+R: Mouse Leave
        R->>T: Cancel Timer
        T-->>-R: Timer Cancelled
        R-->>-U: No Preview Shown
    end
```

## データ同期パターン

### Optimistic Updates Pattern

```mermaid
flowchart TD
    UserAction[User Action] --> UIUpdate[Immediate UI Update]
    UIUpdate --> IPCCall[IPC to Main Process]
    IPCCall --> DBWrite[SQLite Write]
    
    DBWrite --> Success{Write Success?}
    Success -->|Yes| Confirm[Confirm UI State]
    Success -->|No| Rollback[Rollback UI State]
    Rollback --> ErrorNotify[Show Error Message]
    
    subgraph "Fast User Experience"
        UIUpdate
        Confirm
    end
    
    subgraph "Error Handling"
        Rollback
        ErrorNotify
    end
```

### Event-Driven Updates

```mermaid
flowchart TD
    MainEvent[Main Process Event] --> IPC[IPC Broadcast]
    IPC --> Renderer[Renderer Process]
    Renderer --> StoreUpdate[Update Zustand Store]
    StoreUpdate --> ReactRerender[React Re-render]
    ReactRerender --> UIUpdate[UI Updates]
    
    subgraph "Event Types"
        SettingsChanged[Settings Changed]
        ThemeChanged[Theme Changed]
        HotKeyTriggered[Hot Key Triggered]
        NotificationScheduled[Notification Scheduled]
    end
    
    SettingsChanged --> MainEvent
    ThemeChanged --> MainEvent
    HotKeyTriggered --> MainEvent
    NotificationScheduled --> MainEvent
```

## IPC通信パターン

### Request-Response Pattern

```mermaid
sequenceDiagram
    participant R as Renderer
    participant M as Main
    
    Note over R,M: 同期的な操作
    
    R->>+M: IPC: memo:create { content, x, y }
    M->>M: Validate Input
    M->>M: Generate ID
    M->>M: Save to DB
    M-->>-R: IPC Reply: { success: true, memo: {...} }
    
    Note over R,M: エラーハンドリング
    
    R->>+M: IPC: memo:delete { id: "invalid" }
    M->>M: Validate ID
    M-->>-R: IPC Reply: { success: false, error: "Memo not found" }
```

### Event Broadcasting Pattern

```mermaid
sequenceDiagram
    participant M as Main Process
    participant R1 as Renderer 1
    participant R2 as Renderer 2
    participant R3 as Renderer N...
    
    Note over M,R3: システム全体イベント
    
    M->>M: Settings Changed
    M->>R1: IPC Broadcast: settings:changed
    M->>R2: IPC Broadcast: settings:changed  
    M->>R3: IPC Broadcast: settings:changed
    
    R1->>R1: Update UI
    R2->>R2: Update UI
    R3->>R3: Update UI
```

## エラーハンドリングフロー

### Database Error Handling

```mermaid
flowchart TD
    DBOperation[Database Operation] --> CheckError{Error?}
    
    CheckError -->|No| Success[Return Success]
    CheckError -->|Yes| ErrorType{Error Type}
    
    ErrorType -->|Constraint| ValidationError[Validation Error]
    ErrorType -->|Disk Full| DiskError[Disk Space Error]
    ErrorType -->|Corruption| CorruptionError[Database Corruption]
    ErrorType -->|Other| UnknownError[Unknown Error]
    
    ValidationError --> UserNotify[Notify User - Validation]
    DiskError --> UserNotify2[Notify User - Disk Space]
    CorruptionError --> Recovery[Attempt Recovery]
    UnknownError --> LogError[Log Error Details]
    
    Recovery --> RecoverySuccess{Recovery OK?}
    RecoverySuccess -->|Yes| Success
    RecoverySuccess -->|No| FatalError[Fatal Error - Restart Required]
    
    LogError --> UserNotify3[Notify User - Technical Error]
```

### UI Error Boundaries

```mermaid
flowchart TD
    ComponentError[React Component Error] --> ErrorBoundary[Error Boundary]
    ErrorBoundary --> LogError[Log Error to Main Process]
    LogError --> ShowFallback[Show Fallback UI]
    
    ShowFallback --> UserChoice{User Action}
    UserChoice -->|Retry| ReloadComponent[Reload Component]
    UserChoice -->|Report| SendReport[Send Error Report]
    UserChoice -->|Continue| FallbackUI[Continue with Fallback]
    
    ReloadComponent --> Success{Recovery?}
    Success -->|Yes| NormalUI[Normal UI Restored]
    Success -->|No| FallbackUI
```

## パフォーマンス最適化フロー

### Virtual Scrolling for Large Memo Sets

```mermaid
flowchart TD
    ManyMemos[1000+ Memos] --> ViewportCalc[Calculate Viewport]
    ViewportCalc --> VisibleMemos[Determine Visible Memos]
    VisibleMemos --> RenderSubset[Render Only Visible Items]
    
    UserScroll[User Scrolls] --> UpdateViewport[Update Viewport]
    UpdateViewport --> VisibleMemos
    
    subgraph "Performance Benefits"
        ReducedDOM[Reduced DOM Nodes]
        FasterRender[Faster Rendering]
        LowerMemory[Lower Memory Usage]
    end
    
    RenderSubset --> ReducedDOM
    RenderSubset --> FasterRender
    RenderSubset --> LowerMemory
```

### Debounced Updates

```mermaid
sequenceDiagram
    participant U as User
    participant R as React
    participant D as Debounce Timer
    participant M as Main Process
    
    Note over U,M: Rapid typing in memo
    
    U->>R: Keystroke 1
    R->>D: Reset Timer (300ms)
    R->>R: Update Local State
    
    U->>R: Keystroke 2
    R->>D: Reset Timer (300ms)
    R->>R: Update Local State
    
    U->>R: Keystroke 3
    R->>D: Reset Timer (300ms)
    R->>R: Update Local State
    
    Note over U,M: User stops typing
    
    D-->>R: Timer Expired
    R->>M: IPC: Save to Database
    M-->>R: Save Confirmed
```

このデータフローにより、レスポンシブで安定したユーザー体験を実現しつつ、効率的なデータ管理を行います。