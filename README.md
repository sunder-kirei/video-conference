# Video Conference App

A scalable, real-time video conferencing application built using **Node.js** and **Express** for the backend, with a **React** frontend. This project leverages **TypeScript**, **Docker**, **MongoDB Atlas**, **Single Forwarding Unit (SFU)**, and **WebRTC** to provide a seamless, high-quality video conferencing experience.

## Architecture

![sfu-architecture](./readme-assets/sfu.avif)

## Features

- **Real-Time Video Conferencing**: Powered by WebRTC for low-latency media communication.
- **Scalable Backend**: Built with Node.js and Express, ensuring efficient handling of multiple connections.
- **Single Forwarding Unit (SFU)**: Improves media stream efficiency by forwarding streams to multiple clients.
- **TypeScript**: Ensures type safety across the project, both in the backend and frontend.
- **Dockerized Deployment**: Easy setup with Docker Compose for streamlined development and production environments.
- **Database**: Uses MongoDB Atlas for secure and scalable data storage.

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **WebRTC**: For real-time communication
- **Docker**: Containerization
- **Single Forwarding Unit (SFU)**: Media distribution

## Prerequisites

Before running the project, ensure you have the following installed:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Installation

1. **Clone the Repository**:
   ```bash
    git clone https://github.com/sunder-kirei/video-conference.git
    cd video-conference
   ```
2. **Set Environment Variables**:

- Create a `.env` file in the root directory.
- Add the following keys, also mentioned in

  ```bash
    ./server/environment.d.ts
  ```

  ```bash
    PORT=<your-port-number>
    FRONTEND_ORIGIN=<your-frontend-url>
    CLIENT_ID=<your-client-id>
    CLIENT_SECRET=<your-client-secret>
    REDIRECT_URL=<your-redirect-url>
    DATABASE_URL=<your-mongodb-atlas-url>
    ACCESS_TOKEN_PRIVATE=<your-access-token-private-key>
    REFRESH_TOKEN_PRIVATE=<your-refresh-token-private-key>
    ACCESS_TOKEN_PUBLIC=<your-access-token-public-key>
    REFRESH_TOKEN_PUBLIC=<your-refresh-token-public-key>
    ACCESS_TOKEN_TTL=<access-token-time-to-live>
    REFRESH_TOKEN_TTL=<refresh-token-time-to-live>
  ```

3. **Run the App using Docker Compose**:

   ```docker
    docker-compose up
   ```

## Usage

Once the containers are running, access the application in your browser at:

> > https://localhost:443

You can create a new room or join an existing one to start a video conference. The app supports multiple participants, with audio and video streams managed through WebRTC.

## Contributing

We welcome contributions! Please fork this repository and create a pull request with your changes. Ensure all new code is properly documented and tested before submitting.
