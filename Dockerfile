FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Build the Nuxt application
RUN npm run build

# Copy data files to the output directory
RUN cp -r data .output/data

# Rebuild native modules for the container architecture
RUN cd .output/server && npm rebuild better-sqlite3

# Expose the port
EXPOSE 4001

# Start the application
CMD ["npm", "run", "preview"]
