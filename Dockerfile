FROM mcr.microsoft.com/playwright:v1.61.1-jammy
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js payback-app.html ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
