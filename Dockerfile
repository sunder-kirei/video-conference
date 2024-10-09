FROM node:20.17.0 as base_img
WORKDIR /usr/app

COPY package*.json .
COPY ./client/package*.json ./client
COPY ./server/package*.json ./server
RUN --mount=type=cache,target=./.npm npm install

COPY . .

FROM base_img as dev_server
CMD [ "npm", "run", "dev:server" ]


FROM base_img as dev_client
CMD ["npm", "run", "dev:client"]