#!/bin/bash
PROJECT=REDACTED_FIREBASE_PROJECT_ID
BACKEND=van-vert-app

secrets=(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "NEXT_PUBLIC_FIREBASE_APP_ID"
  "RESEND_API_KEY"
)

for secret in "${secrets[@]}"; do
  echo "Granting access to $secret..."
  firebase apphosting:secrets:grantaccess "$secret" --backend "$BACKEND" --project "$PROJECT"
done

echo "All secrets granted successfully!"
