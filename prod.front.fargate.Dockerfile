FROM node:alpine3.18 as base
FROM base as deps
WORKDIR /app
COPY /frontend/package*.json ./
COPY /frontend/server.js ./
RUN npm install
FROM deps AS builder
WORKDIR /app
COPY /frontend .
RUN npm run build
FROM deps AS prod-deps
WORKDIR /app
RUN npm install --production
FROM base as runner
WORKDIR /app
RUN addgroup --system --gid 1001 remix
RUN adduser --system --uid 1001 remix
USER remix
COPY --from=prod-deps --chown=remix:remix /app/package*.json ./
COPY --from=prod-deps --chown=remix:remix /app/server.js ./
COPY --from=prod-deps --chown=remix:remix /app/node_modules ./node_modules
COPY --from=builder --chown=remix:remix /app/build ./build
COPY --from=builder --chown=remix:remix /app/public ./public
CMD ["npm", "run", "start"]
