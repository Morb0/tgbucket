FROM node:16 as build
WORKDIR /app
COPY nest-cli.json \
  tsconfig.* \
  package.json \
  pnpm-lock.yaml \
  mikro-orm.config.ts \
  types \
  ./
COPY ./migrations/ ./migrations/
COPY ./src/ ./src/
RUN npm i -g pnpm
RUN pnpm install
RUN pnpm build

FROM node:16-alpine
WORKDIR /app
COPY --from=build /app/dist/ ./
COPY --from=build /app/node_modules/ ./node_modules/
EXPOSE 3000
CMD ["node", "src/main.js"]