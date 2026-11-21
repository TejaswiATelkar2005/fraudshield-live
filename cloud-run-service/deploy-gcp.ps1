# Google Cloud Platform Deployment Script for FraudShield Live (Phase 3)
# Project: fraud-transaction-9b87a
param(
  [string]$ProjectId = "fraud-transaction-9b87a",
  [string]$Region = "us-central1"
)

Write-Host "==> Configuring GCP Project: $ProjectId in Region: $Region"
gcloud config set project $ProjectId

Write-Host "==> 1. Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com `
                       pubsub.googleapis.com `
                       aiplatform.googleapis.com `
                       bigquery.googleapis.com `
                       cloudbuild.googleapis.com

Write-Host "==> 2. Creating Cloud Pub/Sub Topic and Subscription..."
gcloud pubsub topics create banking-transactions --project=$ProjectId
gcloud pubsub subscriptions create scoring-worker-sub --topic=banking-transactions --project=$ProjectId

Write-Host "==> 3. Creating BigQuery Dataset for compliance audit log..."
bq --location=US mk --dataset "${ProjectId}:banking_fraud_audit"

Write-Host "==> 4. Building and Deploying Scoring Microservice to Cloud Run..."
cd cloud-run-service
gcloud builds submit --tag "gcr.io/${ProjectId}/fraudshield-scorer:latest"
gcloud run deploy fraudshield-scorer `
  --image "gcr.io/${ProjectId}/fraudshield-scorer:latest" `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${ProjectId},VERTEX_LOCATION=${Region}"

Write-Host "==> 5. Linking Pub/Sub Push Subscription to Cloud Run Endpoint..."
$SERVICE_URL = (gcloud run services describe fraudshield-scorer --platform managed --region $Region --format 'value(status.url)')
gcloud pubsub subscriptions create pubsub-to-cloudrun `
  --topic=banking-transactions `
  --push-endpoint="${SERVICE_URL}/pubsub/push" `
  --ack-deadline=30

Write-Host "==> GCP Phase 3 Pipeline Deployed Successfully!"
Write-Host "Cloud Run Endpoint: $SERVICE_URL"
