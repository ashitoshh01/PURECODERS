# ==============================================================================
# Stage 1: Build the React 19 Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies first for Docker layer caching
COPY frontend/package*.json ./
RUN npm install

# Copy source and build static bundle
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python Backend & Production Runtime
# ==============================================================================
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Install git for repository scanning capabilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into frontend/dist
# FastAPI automatically mounts and serves this directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

WORKDIR /app/backend

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
