# ========================================
# FRONTEND DOCKERFILE - React Application Container
# ========================================
# This file defines how to build a Docker image for our React frontend
# Similar to backend Dockerfile but configured for Vite development server

# BASE IMAGE - Node.js runtime environment
# Same base image as backend for consistency
# node:18-alpine = Node.js 18 on lightweight Alpine Linux
FROM node:18-alpine

# SET WORKING DIRECTORY
# All commands will execute from /app directory inside container
WORKDIR /app

# COPY PACKAGE FILES FOR DEPENDENCY INSTALLATION
# package*.json includes package.json and package-lock.json
# Copied separately for Docker layer caching optimization
COPY package*.json ./

# INSTALL FRONTEND DEPENDENCIES
# Installs React, Vite, axios, and all other npm packages
# Creates /app/node_modules inside the container
RUN npm install

# COPY APPLICATION SOURCE CODE
# Copies all frontend files: src/, public/, index.html, vite.config.js, etc.
# This happens after npm install for better Docker layer caching
COPY . .

# EXPOSE PORT FOR VITE DEV SERVER
# Vite development server runs on port 3000 by default
# This is documentation - actual port mapping happens in docker-compose.yml
EXPOSE 3000

# START VITE DEVELOPMENT SERVER
# CMD runs when container starts
# "npm run dev" = starts Vite dev server with hot-reloading
# "--" separates npm arguments from script arguments
# "--host 0.0.0.0" makes Vite accept connections from outside container
# Without this, Vite only accepts localhost connections (won't work in Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ========================================
# HOST BINDING EXPLANATION
# ========================================
# By default, Vite binds to localhost (127.0.0.1) inside container
# Docker containers have their own network namespace
# "--host 0.0.0.0" tells Vite to accept connections from any IP
# This allows Docker port mapping to work properly
# Host computer → Docker → Container (0.0.0.0:3000)

# ========================================
# DEVELOPMENT VS PRODUCTION
# ========================================
# This Dockerfile is optimized for development:
# - Uses "npm run dev" (development server with hot-reloading)
# - Mounts source code as volume for live updates
# 
# For production, you would:
# - Use "npm run build" to create optimized static files
# - Serve with nginx or similar web server
# - Remove development dependencies

# ========================================
# VITE SPECIFIC CONFIGURATION
# ========================================
# Vite is a modern build tool that's faster than Create React App
# Features:
# - Lightning fast hot module replacement (HMR)
# - Native ES modules support
# - Optimized build process with Rollup
# - Built-in TypeScript support