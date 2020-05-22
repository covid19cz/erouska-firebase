module "exposure-notifications-server" {
  source                = "github.com/google/exposure-notifications-server/terraform"
  project               = var.project
  region                = var.region
  appengine_location    = var.appengine_location
  cloudsql_tier         = "db-custom-1-3840"
  cloudsql_disk_size_gb = 16
}
