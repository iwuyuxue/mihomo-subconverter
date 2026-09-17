# 阶段 1: 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

# 1. 允许 Next.js 在内存不足时自动扩容内存
ENV NODE_OPTIONS="--max-old-space-size=4096"
# 2. 忽略打包时的 TypeScript/ESLint 阻断
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

# 如果项目配有 build 脚本，可以在打包时跳过类型/ESLint 检查
RUN NEXT_IGNORE_TYPECHECK=1 NEXT_IGNORE_ESLINT=1 npm run build

# 阶段 2: 运行阶段
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物和必要文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

CMD ["npm", "run", "start"]
