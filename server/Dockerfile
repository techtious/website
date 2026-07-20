FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=1001

EXPOSE 1001

CMD ["node", "index.js"]
