# DeepResearchAgent

🤖 **AI-Powered Multi-Agent Research System with Web UI Implementation**

DeepResearchAgentは、複数のAIエージェントが連携して高度な研究・分析・コーディングタスクを実行する革新的なシステムです。直感的なWebUIを通じて、複雑な調査から実用的なアプリケーション開発まで、幅広いタスクを自動化できます。

## 🌟 主な機能

### Multi-Agent System
- **Top-Level Planning Agent**: タスクの全体計画と進行管理
- **Research Agent**: 多段階Web検索による情報収集
- **Analysis Agent**: 収集データの深度分析
- **Output Agent**: 結果の構造化と出力
- **Coding Agent**: HTML/CSS/JavaScript、Pythonコード生成・実行

### Web UI Implementation
- **React + TypeScript + Vite**: モダンなフロントエンド技術スタック
- **リアルタイム進捗表示**: エージェント間のデータフロー可視化
- **インタラクティブUI**: 直感的な操作とレスポンシブデザイン
- **プレビュー機能**: 生成されたコンテンツの即座確認
- **ファイル管理**: 生成ファイルのダウンロード・管理機能

### 技術スタック
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI Integration**: 複数LLMプロバイダー対応
- **Real-time Communication**: WebSocket対応

## 🚀 セットアップ

### 前提条件
- Node.js (v18以上)
- npm または pnpm
- Python 3.8以上

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/your-username/DeepResearchAgent.git
cd DeepResearchAgent
```

2. 依存関係をインストール
```bash
# フロントエンド
npm install
# または
pnpm install

# バックエンド（Python）
pip install -r requirements.txt
```

3. 環境変数を設定
```bash
cp .env.template .env
# .envファイルを編集してAPIキーを設定
```

### 使用方法

1. バックエンドサーバーを起動
```bash
node api/server.js
```

2. フロントエンドを起動
```bash
npm run dev
```

3. ブラウザで `http://localhost:5173` にアクセス

## 📋 使用例

- **研究タスク**: 「最新のAI技術トレンドを調査して」
- **分析タスク**: 「市場データを分析してレポートを作成して」
- **コーディング**: 「クイズアプリを作成して」
- **複合タスク**: 「競合分析を行い、結果をWebページで表示して」

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
