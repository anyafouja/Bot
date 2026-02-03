FROM node:20

WORKDIR /app

# Install FFmpeg dan Python3 (YTDLP butuh ini)
RUN apt-get update && apt-get install -y ffmpeg python3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
