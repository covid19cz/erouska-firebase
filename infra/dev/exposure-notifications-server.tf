# app_engine is used because of cloud scheduler
# we had to import it as we are already using it in this gcp project
# terraform import module.exposure-notifications-server.google_app_engine_application.app covid19cz

module "exposure-notifications-server" {
  source                = "github.com/google/exposure-notifications-server/terraform"
  project               = var.project
  region                = var.region
  appengine_location    = var.appengine_location
  cloudsql_tier         = "db-custom-1-3840"
  cloudsql_disk_size_gb = 16
}

output "db_conn" {
  value = module.exposure-notifications-server.db_conn
}

output "db_name" {
  value = module.exposure-notifications-server.db_name
}

output "db_user" {
  value = module.exposure-notifications-server.db_user
}

output "db_pass_secret" {
  value = module.exposure-notifications-server.db_pass_secret
}

output "region" {
  value = var.region
}

output "project" {
  value = var.project
}