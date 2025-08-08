# マネタイゼーション設計書

## 概要

デスクトップメモアプリのマネタイゼーション戦略として、**無料版**と**買い切り版**の2層モデルを採用します。ユーザーにとって価値ある機能提供と持続可能なビジネスモデルを両立させる設計です。

## マネタイゼーション戦略

### ビジネスモデル
- **無料版（Freemium）**: 基本機能を無料提供、ユーザー獲得とブランド認知
- **有料版（One-time Purchase）**: 高度機能を買い切り提供、収益化

### 価格設定
- **無料版**: 完全無料（制限あり）
- **有料版**: ¥2,980（税込）/ $19.99 USD
- **学生割引**: 50% OFF（学生証明要）
- **企業ライセンス**: ¥9,800（税込）/ $69.99 USD（5台まで）

## 機能比較表

| 機能カテゴリ | 機能 | 無料版 | 有料版 |
|-------------|-----|--------|-------|
| **基本機能** | メモ作成・編集・削除 | ✅ | ✅ |
| | ドラッグ&ドロップ | ✅ | ✅ |
| | データ永続化 | ✅ | ✅ |
| | ライト/ダークモード | ✅ | ✅ |
| **メモ数制限** | 同時表示メモ数 | 最大10個 | 無制限 |
| | 総メモ数 | 最大10個 | 無制限 |
| **アクセス機能** | グローバルホットキー | ❌ | ✅ |
| | システムトレイ常駐 | ❌ | ✅ |
| **カスタマイズ** | 透明度調整 | ❌ | ✅ |
| | 最前面表示 | ❌ | ✅ |
| | カスタム色・フォント | 基本色のみ | ✅ |
| **整理・管理** | 自動整列 | ❌ | ✅ |
| | 重要度による色分け | ❌ | ✅ |
| | タグ機能 | ❌ | ✅ |
| | 検索機能 | 基本検索 | 高度検索・フィルタ |
| **通知・アラート** | 期限アラート | ❌ | ✅ |
| | リマインダー | ❌ | ✅ |
| | フォーカス追従 | ❌ | ✅ |
| **プレビュー** | メモプレビュー | ❌ | ✅ |
| | ホバー詳細表示 | ❌ | ✅ |
| **エクスポート** | データバックアップ | ❌ | ✅ |
| | インポート/エクスポート | ❌ | ✅ |
| **テクニカル** | クラウド同期（将来） | ❌ | ✅ |
| | API連携（将来） | ❌ | ✅ |
| **サポート** | コミュニティサポート | ✅ | ✅ |
| | 優先サポート | ❌ | ✅ |
| | アップデート | ✅ | ✅ |

## 価値提案

### 無料版の価値
- **「試してみる」体験**: 基本機能でアプリの価値を実感（10個まで）
- **軽量利用者対応**: 最小限のメモ利用者には十分
- **アプリ体験**: 核となる機能を制限付きで体験
- **ブランド認知**: 口コミによる自然な拡散

### 有料版の価値
- **生産性向上**: ホットキー・トレイ常駐による効率化
- **プロフェッショナル機能**: 高度な整理・管理機能
- **無制限利用**: メモ数制限なしでストレスフリー
- **カスタマイズ自由度**: 個人の好みに合わせた細かな調整

## ライセンス認証システム

### 認証方式
- **オフラインファースト**: インターネット不要で動作
- **定期オンライン認証**: 7日に1回の軽微な認証チェック
- **グレースピリオド**: ネットワーク接続不可時30日間の猶予期間

### ライセンスキー形式
```
RMEMO-XXXXX-XXXXX-XXXXX-XXXXX
```
- 20文字の英数字（ハイフン区切り）
- チェックサム付きで偽造防止
- 1ライセンス = 1デバイス（個人用）

### 認証フロー
1. **購入**: Webサイトまたはアプリストア
2. **ライセンス送付**: メールでライセンスキー配布
3. **アプリ内認証**: 設定画面でキー入力
4. **オンライン確認**: サーバーでキー検証
5. **ローカル保存**: 暗号化してローカル保存
6. **定期再認証**: 7日おきに軽微チェック

## 技術実装

### ライセンス管理データベース

```sql
-- ライセンステーブル
CREATE TABLE IF NOT EXISTS license (
    id INTEGER PRIMARY KEY,
    license_key TEXT UNIQUE NOT NULL,
    license_type TEXT NOT NULL CHECK (license_type IN ('free', 'standard', 'student', 'enterprise')),
    activation_date TEXT,
    last_verification TEXT,
    grace_period_start TEXT,
    device_id TEXT,
    user_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- ライセンス機能制限テーブル
CREATE TABLE IF NOT EXISTS license_limits (
    license_type TEXT PRIMARY KEY,
    max_memos INTEGER,
    max_concurrent_memos INTEGER,
    features_enabled TEXT, -- JSON array of enabled features
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- 初期データ
INSERT OR REPLACE INTO license_limits VALUES 
('free', 50, 20, '["basic_memo", "drag_drop", "light_dark_mode", "basic_search"]'),
('standard', -1, -1, '["all_features"]'),
('student', -1, -1, '["all_features"]'),
('enterprise', -1, -1, '["all_features", "priority_support"]');
```

### TypeScript型定義

```typescript
// ライセンス関連型定義
export type LicenseType = 'free' | 'standard' | 'student' | 'enterprise';

export interface License {
  licenseKey: string | null;
  licenseType: LicenseType;
  activationDate: Date | null;
  lastVerification: Date | null;
  gracePeriodStart: Date | null;
  deviceId: string;
  isValid: boolean;
  daysUntilExpiry: number | null;
}

export interface LicenseLimits {
  maxMemos: number; // -1 = unlimited
  maxConcurrentMemos: number; // -1 = unlimited
  featuresEnabled: string[];
}

export interface LicenseValidationResult {
  isValid: boolean;
  licenseType: LicenseType;
  limits: LicenseLimits;
  error?: string;
}

// ライセンス制御されたメモストア
export interface MemoStoreState {
  memos: Memo[];
  license: License;
  
  // ライセンス制御メソッド
  canCreateMemo: () => boolean;
  canUseFeature: (feature: string) => boolean;
  getRemainingMemoSlots: () => number;
}
```

### ライセンス認証サービス

```typescript
export class LicenseService {
  private readonly API_BASE = 'https://api.random-memo-app.com';
  
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const response = await fetch(`${this.API_BASE}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          licenseKey, 
          deviceId: await this.getDeviceId() 
        })
      });
      
      return await response.json();
    } catch (error) {
      // オフライン時はローカル認証にフォールバック
      return this.validateOffline(licenseKey);
    }
  }
  
  private async getDeviceId(): Promise<string> {
    // マシン固有IDの生成（プライバシー配慮）
    const machineInfo = {
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      totalmem: os.totalmem()
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(machineInfo))
      .digest('hex')
      .substring(0, 16);
  }
}
```

### 機能制限コンポーネント

```tsx
// React コンポーネントでの機能制限
export const FeatureGate: React.FC<{
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ feature, fallback, children }) => {
  const { license } = useLicenseStore();
  
  if (!license.limits.featuresEnabled.includes(feature) && 
      !license.limits.featuresEnabled.includes('all_features')) {
    return fallback || <UpgradePrompt feature={feature} />;
  }
  
  return <>{children}</>;
};

// 使用例
<FeatureGate feature="global_hotkeys">
  <GlobalHotkeySettings />
</FeatureGate>
```

## UI/UX設計

### アップグレード促進

#### 1. 制限到達の早期通知
```tsx
const MemoLimitIndicator = () => {
  const { memoCount, maxMemos, canCreateMore } = useMemoLimits();
  
  if (maxMemos === -1) return null; // 無制限版
  
  const isNearLimit = memoCount >= maxMemos * 0.8; // 8個目（80%）で警告
  
  return (
    <div className={`text-sm mb-2 ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
      メモ: {memoCount}/{maxMemos}
      {isNearLimit && canCreateMore && (
        <span className="ml-2 text-orange-600">
          あと{maxMemos - memoCount}個で上限です
        </span>
      )}
      {!canCreateMore && (
        <UpgradeButton variant="prominent" className="ml-2">
          制限解除してもっと作成
        </UpgradeButton>
      )}
    </div>
  );
};
```

#### 2. 機能発見時のアップグレード提案
```tsx
const FeatureDiscoveryPrompt = ({ feature }: { feature: string }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <h3 className="font-semibold text-blue-900">
      💡 この機能は有料版で利用できます
    </h3>
    <p className="text-blue-700 mt-1">
      {getFeatureDescription(feature)}
    </p>
    <div className="mt-3 flex gap-2">
      <UpgradeButton>アップグレード</UpgradeButton>
      <button className="text-blue-600 underline">詳細を見る</button>
    </div>
  </div>
);
```

#### 3. 価値説明型のアップグレードページ
```tsx
const UpgradePage = () => (
  <div className="max-w-4xl mx-auto p-6">
    <h1 className="text-3xl font-bold text-center mb-8">
      Random Memo App Pro
    </h1>
    
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <FeatureCard 
        icon="⚡" 
        title="生産性向上"
        description="ホットキーとシステムトレイで瞬時アクセス"
      />
      <FeatureCard 
        icon="🎨" 
        title="完全カスタマイズ"
        description="色・透明度・フォントを自由に調整"
      />
      {/* ... */}
    </div>
    
    <PricingCard />
  </div>
);
```

## 販売・配布戦略

### 販売チャネル
1. **公式Webサイト**: 直販（マージン最大化）
2. **Microsoft Store**: Windows向け
3. **Mac App Store**: macOS向け（将来）
4. **GitHub Sponsors**: オープンソース支援として

### マーケティング戦略
1. **無料版での体験**: 機能制限を体感させて価値を実感
2. **コンテンツマーケティング**: 生産性ブログ・動画
3. **コミュニティ**: Discord/Reddit での利用者コミュニティ
4. **インフルエンサー**: 生産性系YouTuber/ブロガー連携

### ローンチ戦略
1. **Phase 1**: 無料版リリース（ユーザー獲得）
2. **Phase 2**: フィードバック収集・改善
3. **Phase 3**: 有料版機能開発
4. **Phase 4**: 有料版ローンチ・マーケティング強化

## 収益予測

### ユーザー獲得予測（メモ10個制限）
| 期間 | 無料版DL数 | 有料版購入数 | コンバージョン率 | 月間売上 |
|------|-----------|-------------|----------------|----------|
| 1-3ヶ月 | 500 | 40 | 8% | ¥119,200 |
| 4-6ヶ月 | 2,000 | 180 | 9% | ¥536,400 |
| 7-12ヶ月 | 5,000 | 450 | 9% | ¥1,341,000 |
| 1年目合計 | 7,500 | 670 | 8.9% | ¥1,996,600 |

**制限強化による効果**:
- より早期にユーザーが制限に到達
- アップグレードの必要性を強く実感
- コンバージョン率の大幅向上（6.6% → 8.9%）

### 成功指標（KPI）
- **ユーザー獲得**: 月間新規DL数
- **エンゲージメント**: DAU/MAU率
- **コンバージョン**: 無料→有料転換率
- **解約率**: 30日以内のアンインストール率 < 20%
- **NPS**: ネットプロモータースコア > 50

## リスク管理

### 海賊版対策
- **オフライン動作**: 完全な海賊版防止は不可能、利便性を優先
- **定期認証**: 重要機能は定期的なオンライン認証
- **価値提供**: 海賊版より正規版の方が価値が高い状態を維持

### 技術的リスク
- **認証サーバー障害**: グレースピリオドとローカル認証
- **ライセンス紛失**: メール再送・サポート対応
- **デバイス変更**: 簡単な移行手順の提供

### 市場リスク
- **競合参入**: 機能差別化と継続的改善
- **需要変化**: ユーザーフィードバックに基づく機能調整
- **プラットフォーム変更**: 複数プラットフォーム対応

この設計により、ユーザーにとって公正で価値ある体験を提供しつつ、持続可能なビジネスモデルを構築します。