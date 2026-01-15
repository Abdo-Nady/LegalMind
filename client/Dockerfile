# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
# Run the generate-font script via prebuild/npm scripts or manually if needed
# We run install which includes devDependencies needed for build
RUN npm ci

# Copy source code
COPY . .

# Build the application
# This triggers the 'prebuild' script we added earlier (generate-font)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
