# ==================== Hetzner Cloud Variables ====================

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "hcloud_server_name" {
  description = "Name of the Hetzner Cloud Server"
  type        = string
  default     = "job-processor-server"
}

variable "hcloud_server_type" {
  description = "Hetzner Cloud Server type (CPX11, CPX21, CPX31, etc.)"
  type        = string
  default     = "cpx11"
}

variable "hcloud_server_image" {
  description = "Hetzner Cloud Server image (Ubuntu, Debian, etc.)"
  type        = string
  default     = "ubuntu-22.04"
}

variable "hcloud_location" {
  description = "Hetzner Cloud location (nbg1, fsn1, ash, etc.)"
  type        = string
  default     = "nbg1"
}

variable "hcloud_network_zone" {
  description = "Hetzner Cloud network zone"
  type        = string
  default     = "eu-central"
}

variable "allow_ssh_from_ips" {
  description = "List of IPs allowed to SSH to the server"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

# ==================== Azure Variables ====================

variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "azure_client_id" {
  description = "Azure Service Principal Client ID"
  type        = string
  sensitive   = true
}

variable "azure_client_secret" {
  description = "Azure Service Principal Client Secret"
  type        = string
  sensitive   = true
}

variable "azure_tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  sensitive   = true
}

variable "azure_location" {
  description = "Azure region for resources (eastus, westus, etc.)"
  type        = string
  default     = "eastus"
}

variable "azure_openai_sku" {
  description = "Azure OpenAI Service SKU (S0)"
  type        = string
  default     = "S0"
}

variable "azure_openai_model" {
  description = "Azure OpenAI model name (gpt-4, gpt-3.5-turbo, etc.)"
  type        = string
  default     = "gpt-35-turbo"
}

variable "azure_openai_model_version" {
  description = "Azure OpenAI model version"
  type        = string
  default     = "0613"
}

variable "azure_openai_capacity" {
  description = "Azure OpenAI deployment capacity (tokens per minute)"
  type        = number
  default     = 30
}

# ==================== Common Variables ====================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
