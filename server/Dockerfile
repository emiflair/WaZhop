# Backend Dockerfile
FROM node:20.18-alpine3.20

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Ensure non-root user runs the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
	&& chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 5001

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
