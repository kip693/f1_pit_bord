# Cloud Run デプロイメントガイド

GitHub Actionsを使用して、`main` ブランチへのマージをトリガーにバックエンドをGoogle Cloud Runへ自動デプロイする手順です。

## 1. 前提条件 (GCP側での準備)

デプロイを行う前に、Google Cloud Platform (GCP) 側で以下の準備が必要です。

1.  **プロジェクトの作成**: GCPプロジェクトを作成（または既存を選択）。
2.  **APIの有効化**:
    *   Cloud Run Admin API
    *   Artifact Registry API (または Container Registry API)
    *   Cloud Build API (オプション)
3.  **Artifact Registry リポジトリの作成**:
    *   形式: Docker
    *   リージョン: `asia-northeast1` (推奨)
    *   名前: `f1-dashboard` (例)
    
    **作成コマンド**:
    ```bash
    gcloud artifacts repositories create f1-dashboard \
      --repository-format=docker \
      --location=asia-northeast1 \
      --description="F1 Dashboard Docker images" \
      --project="${PROJECT_ID}"
    ```
4.  **サービスアカウント (WIF) の作成**:
    *   GitHub ActionsからGCPに認証するための「Workload Identity Federation」を設定することを強く推奨します（Service Account Key JSONはセキュリティリスクがあるため）。
    *   必要なロール:
        *   Cloud Run Admin
        *   Service Account User
        *   Artifact Registry Writer

### 1.1 Workload Identity Federation (WIF) セットアップ手順

以下のコマンドをローカルのターミナル（gcloud CLIインストール済み）で実行して設定します。

```bash
# 変数設定
export PROJECT_ID="YOUR_PROJECT_ID"
export SERVICE_ACCOUNT_NAME="github-actions-sa"
export POOL_NAME="github-actions-pool"
export PROVIDER_NAME="github-actions-provider"
export REPO="kip693/f1_pit_bord"  # GitHubリポジトリ名 (ユーザー名/リポジトリ名)

# 1. サービスアカウント作成
gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
  --project "${PROJECT_ID}" \
  --display-name "GitHub Actions Service Account"

# 2. 必要なロールの付与
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role "roles/artifactregistry.writer"

# 3. Workload Identity Pool 作成
gcloud iam workload-identity-pools create "${POOL_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 4. Provider 作成
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_NAME}" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="attribute.repository.startsWith('kip693/f1_pit_bord')" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 5. サービスアカウントとPoolの紐付け（リポジトリ制限）
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPO}"

# 6. 設定値の確認（GitHub Secretsに登録する値）
echo "GCP_PROJECT_ID: ${PROJECT_ID}"
echo "GCP_SA_EMAIL: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "GCP_WIF_PROVIDER: projects/$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
```

## 2. GitHub Secrets の設定

GitHubリポジトリの `Settings > Secrets and variables > Actions` に以下のSecretを設定してください。

| Secret Name | 説明 | 例 |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | GCPのプロジェクトID | `my-f1-project-123` |
| `GCP_WIF_PROVIDER` | Workload Identity Providerのリソース名 | `projects/123/locations/global/workloadIdentityPools/...` |
| `GCP_SA_EMAIL` | サービスアカウントのメールアドレス | `github-action@my-project.iam.gserviceaccount.com` |

## 3. GitHub Actions ワークフロー

`.github/workflows/deploy-backend.yml` がデプロイ定義ファイルです。
`backend/` ディレクトリ配下に変更があった場合のみトリガーされます。

## 4. デプロイ後の確認

1.  GitHub Actionsの「Actions」タブでワークフローが成功したか確認。
2.  GCPコンソールのCloud Runセクションで、新しいリビジョンがデプロイされているか確認。
3.  Cloud RunのURLにアクセスし、`/health` エンドポイント (`https://.../health`) が `{"status": "healthy"}` を返すか確認。

## 5. トラブルシューティング

*   **認証エラー**: `GCP_WIF_PROVIDER` や `GCP_SA_EMAIL` が正しいか、WIFの設定がGitHubリポジトリと紐付いているか確認してください。
*   **ビルドエラー**: `backend/Dockerfile` や `requirements.txt` に誤りがないか確認してください。
*   **デプロイエラー**: Cloud Runのログを確認してください（メモリ不足、起動タイムアウトなど）。
