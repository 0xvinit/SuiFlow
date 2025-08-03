#!/bin/bash

# Sui Cross-Chain Escrow Contract Deployment Script
# This script deploys the main cross_chain_escrow contract

set -e

echo "🚀 Starting deployment of Cross-Chain Escrow Contract..."

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Error: sui CLI is not installed or not in PATH"
    echo "Please install Sui CLI: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo "❌ Error: Move.toml not found. Please run this script from the contract root directory."
    exit 1
fi

echo "📝 Building the contract..."

# Build the contract
sui move build

if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

echo "🔗 Deploying to Sui network..."

# Deploy the contract
# Note: This will deploy to the network configured in your Sui CLI
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000)

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo "📄 Deployment details:"
    echo "$DEPLOY_OUTPUT"
    
    # Extract package ID from deployment output
    PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | grep -o '"0x[a-fA-F0-9]\{64\}"' | head -1 | tr -d '"')
    
    if [ ! -z "$PACKAGE_ID" ]; then
        echo ""
        echo "📦 Package ID: $PACKAGE_ID"
        echo "💾 Saving deployment info..."
        
        # Create deployment info file
        cat > deployment_info.json << EOF
{
  "package_id": "$PACKAGE_ID",
  "deployment_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$(sui client active-env)",
  "contract_name": "cross_chain_escrow"
}
EOF
        
        echo "✅ Deployment info saved to deployment_info.json"
        echo ""
        echo "🎉 Deployment completed successfully!"
        echo "📋 Next steps:"
        echo "   1. Use the Package ID above to interact with your contract"
        echo "   2. The ConsumedProofRegistry object has been created and shared"
        echo "   3. You can now create atomic swap vaults using the deployed contract"
    else
        echo "⚠️  Warning: Could not extract Package ID from deployment output"
    fi
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi