# ========================================
# BACKEND DOCKERFILE - Node.js API Container
# ========================================
# This file defines how to build a Docker image for our backend API
# Docker images are like templates for creating containers (isolated environments)

# BASE IMAGE - Starting point for our container
# node:18-alpine = Node.js version 18 on Alpine Linux (lightweight)
# Alpine Linux is tiny (~5MB) compared to regular Ubuntu (~180MB)
FROM node:18-alpine

# SET WORKING DIRECTORY
# All subsequent commands will run from this directory inside the container
# Like doing "cd /app" before running commands
WORKDIR /app

# COPY PACKAGE FILES FIRST
# package*.json includes both package.json and package-lock.json
# We copy these first for Docker layer caching optimization
# If dependencies don't change, Docker can reuse this layer
COPY package*.json ./

# INSTALL DEPENDENCIES
# This runs inside the container and installs all npm packages
# Dependencies are installed in /app/node_modules inside container
RUN npm install

# COPY APPLICATION CODE
# Copy all remaining files from local ./backend directory to /app in container
# This includes: server.js, routes/, models/, middleware/, config/, etc.
COPY . .

# EXPOSE PORT
# Documents that this container will listen on port 5000
# This is metadata - doesn't actually publish the port
# docker-compose.yml maps host port to container port
EXPOSE 5000

# COMMAND TO START APPLICATION
# CMD defines the default command when container starts
# Uses npm script defined in package.json: "dev": "nodemon server.js"
# Nodemon automatically restarts server when code changes (for development)
CMD ["npm", "run", "dev"]

# ========================================
# DOCKERFILE LAYER EXPLANATION
# ========================================
# Docker builds images in layers for efficiency:
# Layer 1: Base Node.js image
# Layer 2: Working directory setup
# Layer 3: Package files copied
# Layer 4: Dependencies installed (cached if package*.json unchanged)
# Layer 5: Application code copied
# Layer 6: Port exposure metadata
# Layer 7: Start command defined

# ========================================
# BUILD AND RUN COMMANDS
# ========================================
# To build image manually:
# docker build -t mern-backend ./backend

# To run container manually:
# docker run -p 5000:5000 mern-backend

# Better: Use docker-compose up (handles networking, volumes, dependencies)