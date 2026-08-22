# Multi-language execution container for Render deployment
FROM node:20-bookworm-slim

# Install OpenJDK (javac + java), Python3, GCC, G++, and essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk \
    python3 \
    python3-pip \
    gcc \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install npm dependencies (production)
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Set environment defaults
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
