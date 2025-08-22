#!/bin/bash

echo "🧹 Cleaning old build files..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Running production build..."
NODE_ENV=production npm run build

echo "📊 Checking build size..."
echo "Main bundle size:"
ls -lh .next/static/chunks/main-*.js 2>/dev/null || echo "No main chunk found"

echo "📈 Total build size:"
du -sh .next

echo "✅ Build complete!"