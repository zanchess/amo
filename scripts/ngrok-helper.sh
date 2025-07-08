#!/bin/bash

# ngrok Helper Script
# Помощник для управления ngrok туннелями

PORT=${1:-3000}
SUBDOMAIN=${2:-""}

echo "🚀 Starting ngrok tunnel for port $PORT"

if [ -n "$SUBDOMAIN" ]; then
    echo "🌐 Using subdomain: $SUBDOMAIN"
    ngrok http $PORT --subdomain=$SUBDOMAIN
else
    echo "🌐 Using random subdomain"
    ngrok http $PORT
fi

echo "✅ ngrok tunnel started!"
echo "📝 Copy the https URL from above and use it as your webhook endpoint"
echo "🔗 Example webhook URL: https://your-subdomain.ngrok.io/api/webhooks/generic" 