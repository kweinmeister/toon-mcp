# Builder stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Prune development dependencies for a smaller production image
RUN npm prune --production

# Runner stage
FROM node:24-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Copy all necessary files from the builder, including pruned node_modules
COPY --from=builder --chown=appuser:appgroup /app .
USER appuser

ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
