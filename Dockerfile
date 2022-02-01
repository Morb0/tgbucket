FROM node:16 as base

WORKDIR /app
COPY package.json \
  pnpm-lock.yaml \
  ./
RUN npm i -g pnpm
RUN pnpm i --prod

FROM base AS dev
COPY nest-cli.json \
  tsconfig.* \
  ./
# bring in src from context
COPY ./src/ ./src/
# get custom types
COPY ./types/ ./types/
RUN pnpm i
RUN pnpm build

# use one of the smallest images possible
FROM node:16-alpine
# get package.json from base
COPY --from=base /app/package.json ./
# get the dist back
COPY --from=dev /app/dist/ ./dist/
# get the node_modules from the intial cache
COPY --from=base /app/node_modules/ ./node_modules/
# expose application port
EXPOSE 3000
# start
CMD ["node", "dist/main.js"]