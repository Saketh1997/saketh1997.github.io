FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/Saketh1997/saketh1997.github.io
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]