FROM node:24-alpine
WORKDIR /app
RUN apk --no-cache add curl
ENV NODE_ENV=production
COPY package*.json **package-lock.json** ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .
EXPOSE 3000
CMD [ "node", "index.js" ]

