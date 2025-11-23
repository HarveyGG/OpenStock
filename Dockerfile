FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile || pnpm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

EXPOSE 3000

CMD ["node", "scripts/start-all.mjs"]
