#!/bin/sh

cd /app/backend
/opt/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &

cd /app/frontend
npm run start -- -p 7860 -H 0.0.0.0