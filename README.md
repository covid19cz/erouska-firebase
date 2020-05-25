# erouska-firebase
Firebase serverless backend for eRouška

### Local execution
```bash
export GOOGLE_APPLICATION_CREDENTIALS=<path to service account JSON>
export GCP_PROJECT=<project name>
export FIREBASE_BUCKET=<Firebase Storage bucket>

cd functions
npm run build && node lib/index.js
```

## exposure-notifications-server
[Exposure notifications server](https://github.com/google/exposure-notifications-server) is deployed via terraform to our dev GCP project `covid19cz`

### admin-console
The admin-console is a local webserver used for administrative configuration of the live database,
it uses cloud_sql_proxy as a TLS proxy to CloudSQL PostgreSQL database.

You'll need google-cloud-sdk, terraform, access to GCP project `covid19cz`, golang (>1.14), git

to run the console locally, execute the following:
```
cd infra/dev/
terraform init

gcloud auth login && gcloud auth application-default login
export DB_CONN=$(terraform output db_conn)
export DB_USER=$(terraform output db_user)
export DB_PASSWORD="secret://$(terraform output db_pass_secret)"
export DB_PORT=5400
export DB_NAME=$(terraform output db_name)
cloud_sql_proxy -instances=$DB_CONN=tcp:$DB_PORT &

# TODO: this can be removed later on, see https://github.com/google/exposure-notifications-server/issues/432
export DB_SSLMODE=disable

git clone git@github.com:google/exposure-notifications-server.git
cd exposure-notifications-server
go run ./tools/admin-console
```
More info in the [official guide](https://github.com/google/exposure-notifications-server/blob/master/docs/deploying.md)
