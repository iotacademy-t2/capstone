FROM node:21-alpine

ENV PORT 3100
ENV USER postgres
ENV PASSWORD academy2024!

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

RUN npm install typescript

RUN npm install

COPY --chown=node:node . .

RUN npm run build

CMD [ "npm", "start" ]