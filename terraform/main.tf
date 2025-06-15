terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "terraformstate3026"
    container_name       = "tfstate"
    key                  = "chromatic-staff-dev.tfstate"
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-chromatic-staff-dev"
  location = "West Europe"
}

resource "azurerm_static_web_app" "main" {
  name                = "chromatic-staff-dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

output "static_web_app_url" {
  value = azurerm_static_web_app.main.default_host_name
  description = "The URL of the deployed static web app"
}

output "static_web_app_token" {
  value = azurerm_static_web_app.main.api_key
  description = "Deployment token for GitHub Actions"
  sensitive = true
}