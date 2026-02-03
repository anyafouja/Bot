FROM node:20

WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg python3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --force

COPY . .
CMD ["node", "index.js"]
