FROM node:20-bullseye-slim

WORKDIR /app

# Install FFmpeg langsung dari sistem Debian
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
