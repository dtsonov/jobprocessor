terraform {
  required_version = ">= 1.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.40"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Hetzner Cloud Provider
provider "hcloud" {
  token = var.hcloud_token
}

# Azure Provider
provider "azurerm" {
  features {}

  subscription_id = var.azure_subscription_id
  client_id       = var.azure_client_id
  client_secret   = var.azure_client_secret
  tenant_id       = var.azure_tenant_id
}

# ==================== Hetzner Cloud Resources ====================

# Hetzner Cloud Server
resource "hcloud_server" "job_processor" {
  name        = var.hcloud_server_name
  server_type = var.hcloud_server_type
  image       = var.hcloud_server_image
  location    = var.hcloud_location
  ssh_keys    = [hcloud_ssh_key.deployer.id]

  labels = {
    environment = var.environment
    app         = "job-processor"
  }

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}

# SSH Key for Hetzner
resource "hcloud_ssh_key" "deployer" {
  name       = "${var.environment}-deployer-key"
  public_key = var.ssh_public_key
}

# Hetzner Network
resource "hcloud_network" "job_processor_network" {
  name = "${var.environment}-job-processor-net"
}

resource "hcloud_network_subnet" "job_processor_subnet" {
  network_id        = hcloud_network.job_processor_network.id
  type              = "cloud"
  network_zone      = var.hcloud_network_zone
  ip_range          = "10.0.0.0/16"
}

resource "hcloud_server_network" "job_processor_net" {
  server_id  = hcloud_server.job_processor.id
  network_id = hcloud_network.job_processor_network.id
  ip         = "10.0.0.2"
}

# Firewall for Hetzner Server
resource "hcloud_firewall" "job_processor" {
  name = "${var.environment}-job-processor-firewall"

  labels = {
    environment = var.environment
  }

  # Allow SSH (port 22)
  rule {
    direction = "in"
    port      = "22"
    protocol  = "tcp"
    source_ips = var.allow_ssh_from_ips
  }

  # Allow HTTP (port 80)
  rule {
    direction = "in"
    port      = "80"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow HTTPS (port 443)
  rule {
    direction = "in"
    port      = "443"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow Backend API (port 3000)
  rule {
    direction = "in"
    port      = "3000"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attached_resources" "job_processor" {
  firewall_id = hcloud_firewall.job_processor.id
  servers     = [hcloud_server.job_processor.id]
}

# ==================== Azure Resources ====================

# Azure Resource Group
resource "azurerm_resource_group" "job_processor" {
  name     = "${var.environment}-job-processor-rg"
  location = var.azure_location
}

# Azure Cognitive Services Account (OpenAI)
resource "azurerm_cognitive_account" "openai" {
  name                = "${var.environment}jobprocessorai"
  location            = var.azure_location
  resource_group_name = azurerm_resource_group.job_processor.name
  kind                = "OpenAI"
  sku_name            = var.azure_openai_sku

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = var.environment
    app         = "job-processor"
  }
}

# Azure OpenAI Deployment
resource "azurerm_cognitive_deployment" "gpt" {
  name                 = "${var.environment}-gpt-deployment"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model_name           = var.azure_openai_model
  model_format         = "OpenAI"
  model_version        = var.azure_openai_model_version

  sku {
    name  = "Standard"
    capacity = var.azure_openai_capacity
  }
}

# ==================== Outputs ====================

output "hcloud_server_ip" {
  description = "Public IP address of the Hetzner Cloud Server"
  value       = hcloud_server.job_processor.public_net[0].ipv4.ip
}

output "hcloud_server_ipv6" {
  description = "Public IPv6 address of the Hetzner Cloud Server"
  value       = hcloud_server.job_processor.public_net[0].ipv6.ip
}

output "azure_openai_endpoint" {
  description = "Azure OpenAI Service endpoint"
  value       = azurerm_cognitive_account.openai.endpoint
}

output "azure_openai_key" {
  description = "Azure OpenAI Service API key"
  value       = azurerm_cognitive_account.openai.primary_access_key
  sensitive   = true
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    hcloud_server_id   = hcloud_server.job_processor.id
    hcloud_location    = hcloud_server.job_processor.location
    azure_region       = azurerm_resource_group.job_processor.location
    azure_resource_group = azurerm_resource_group.job_processor.name
  }
}
