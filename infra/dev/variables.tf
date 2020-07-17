variable "region" {} # The gcp region we want to be working with
variable "env" {}    # This is a "prefix" which we will add to the name of everything tag to everything
variable "project" {}

variable "appengine_location" {
  type    = string
  default = "us-central"
}
