# Stage 1: Build
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY apt-bot.json ./

# Install dependencies
RUN npm install
RUN npm install -g nodemon

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy only the build artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# COPY --from=builder /app/apt-bot.json ./
# COPY --from=builder /app/apt-bot.json ../apt-bot.json
COPY --from=builder /app/apt-bot.json ./dist/apt-bot.json

COPY ./apt-bot.json ./dist/apt-bot.json

# Install only production dependencies
RUN npm install --only=production

# Install nodemon globally
RUN npm install -g nodemon

# Expose application port (optional, adjust as needed)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
