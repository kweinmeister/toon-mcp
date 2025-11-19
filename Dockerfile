# Builder stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Runner stage
FROM node:24-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
RUN chown -R appuser:appgroup /app
USER appuser

ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
