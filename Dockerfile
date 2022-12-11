FROM node:16

WORKDIR /app

COPY todo.js package.json ./

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]
