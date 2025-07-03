FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install pnpm and dependencies
RUN corepack enable pnpm && pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 