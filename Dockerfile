FROM node:20.17.0 AS base_img
WORKDIR /usr/app

# server

FROM base_img AS base_server
COPY ./server/package*.json .
RUN --mount=type=cache,target=./.npm npm install
COPY ./server .

FROM base_server AS dev_server
CMD [ "npm", "run", "dev" ]

FROM base_server AS build_server
RUN [ "npm", "run", "build" ]

# client

FROM base_img AS base_client
COPY ./client/package*.json .
RUN --mount=type=cache,target=./.npm npm install
COPY ./client .

FROM base_client AS dev_client
CMD ["npm", "run", "dev"]

FROM base_client AS build_client
RUN ["npm", "run", "build"]

# prod - TODO add webpack to server
FROM build_server AS prod
COPY --from=build_client /usr/app/build /usr/app/build
EXPOSE 8080
CMD [ "npm", "run", "start" ]
