# Multi-stage build for go-date-web-app.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json tsconfig.json ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build && pnpm prune --prod

FROM gcr.io/distroless/nodejs22-debian12 AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
# tsconfig rootDir is ".", so src/index.ts compiles to dist/src/index.js.
CMD ["dist/src/index.js"]
