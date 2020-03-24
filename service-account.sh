export PROJECT_ID=...
export BUCKET=gs://$PROJECT_ID.appspot.com

# enable DB export for cloud service account
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com --role roles/datastore.importExportAdmin

# enable bucket write for cloud service account
gsutil iam ch serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com:admin $BUCKET
