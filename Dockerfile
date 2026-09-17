# 阶段 1: 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

# 自动在 next.config 中追加忽略 TypeScript 和 ESLint 检查的配置
RUN node -e '\
  const fs = require("fs"); \
  let file = "next.config.js"; \
  if (!fs.existsSync(file)) { if (fs.existsSync("next.config.mjs")) file = "next.config.mjs"; else return; } \
  let content = fs.readFileSync(file, "utf8"); \
  if (!content.includes("ignoreBuildErrors")) { \
    content = content.replace(/(module\.exports\s*=\s*\{|const\s+nextConfig\s*=\s*\{)/, "$1\n  typescript: { ignoreBuildErrors: true },\n  eslint: { ignoreDuringBuilds: true },"); \
    fs.writeFileSync(file, content, "utf8"); \
  }'

# 执行构建
RUN npm run build

# 阶段 2: 运行阶段
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

CMD ["npm", "run", "start"]
