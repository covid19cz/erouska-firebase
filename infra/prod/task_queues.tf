resource "google_cloud_tasks_queue" "upload-removal" {
  name     = "upload-removal"
  location = "europe-west3"

  rate_limits {
    max_concurrent_dispatches = 100
  }
  retry_config {
    max_attempts = 3
    min_backoff  = "5s"
  }
}
