#Sample Dockerfile for NodeJS Apps

FROM node:18.14.2

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

EXPOSE 8080

CMD [ "node", "app.js" ]