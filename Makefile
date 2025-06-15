.PHONY: help dev clean test build deploy terraform-init terraform-plan terraform-apply terraform-destroy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start local development server
	@echo "Starting local development server..."
	python3 -m http.server 8000

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf dist/

test: ## Run tests (placeholder for future)
	@echo "Running tests..."
	@echo "No tests configured yet"

build: ## Build for production (copy files to dist)
	@echo "Building for production..."
	mkdir -p dist
	cp index.html dist/
	cp script.js dist/
	cp styles.css dist/
	cp -r docs dist/ 2>/dev/null || true

terraform-init: ## Initialize Terraform
	@echo "Initializing Terraform..."
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	@echo "Planning Terraform changes..."
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	@echo "Applying Terraform changes..."
	cd terraform && terraform apply -auto-approve

terraform-destroy: ## Destroy Terraform resources
	@echo "Destroying Terraform resources..."
	cd terraform && terraform destroy

deploy: build ## Build and deploy to Azure
	@echo "Deploying to Azure..."
	@echo "Deployment will be handled by GitHub Actions"