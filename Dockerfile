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
COPY --from=builder --chown=node:node /app .
USER node

ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
