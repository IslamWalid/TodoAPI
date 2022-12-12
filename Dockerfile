FROM node:16

WORKDIR /app

COPY todo.js model.js controller.js package.json ./

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]
