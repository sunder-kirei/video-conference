FROM node:20.17.0

WORKDIR /usr/app
COPY . /usr/app/
RUN ["npm", "ci"]
RUN ["npm", "run" ,"build"]
EXPOSE 443
CMD ["npm", "run", "start"]