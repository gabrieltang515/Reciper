#!/bin/bash

echo "🍳 Starting Reciper Development Environment..."
echo "=============================================="

# Start both servers concurrently
concurrently \
  --names "backend,frontend" \
  --prefix-colors "blue,green" \
  --kill-others \
  "cd backend && npm start" \
  "cd frontend && npm start"

echo "✅ Both servers started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:4000" 