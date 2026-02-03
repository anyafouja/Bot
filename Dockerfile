FROM node:20-alpine
WORKDIR /app
COPY p]ackage*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"
