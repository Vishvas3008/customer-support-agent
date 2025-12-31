#!/bin/bash

echo "Starting AI Live Chat Support Agent..."

set -e

echo "Starting backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "App is running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"

wait
