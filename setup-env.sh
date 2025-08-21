#!/bin/bash

echo " Setting up environment variables for ScholarLink..."
echo ""

# Check if .env files already exist
if [ -f "server/.env" ]; then
    echo "⚠️  server/.env already exists. Skipping server setup."
else
    echo "📝 Setting up server environment..."
    if [ -f "server/env.example" ]; then
        cp server/env.example server/.env
        echo "✅ Created server/.env from template"
        echo "   Please edit server/.env with your Supabase credentials"
    else
        echo "❌ server/env.example not found"
    fi
fi

echo ""

if [ -f "client/.env.local" ]; then
    echo "⚠️  client/.env.local already exists. Skipping client setup."
else
    echo " Setting up client environment..."
    if [ -f "client/env.example" ]; then
        cp client/env.example client/.env.local
        echo "✅ Created client/.env.local from template"
        echo "   Please edit client/.env.local with your API configuration"
    else
        echo "❌ client/env.example not found"
    fi
fi

echo ""
echo " Next steps:"
echo "1. Edit server/.env with your Supabase credentials"
echo "2. Edit client/.env.local with your API configuration"
echo "3. Run 'npm run dev' to start the application"
echo ""
echo " For more information, see the README.md file"

