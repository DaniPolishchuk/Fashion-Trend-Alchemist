FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/approuter/package.json .

# Install dependencies
RUN npm install --production

# Copy configuration
COPY apps/approuter/xs-app.json .

# Approuter runs on port 5000 by default
ENV PORT=5000

EXPOSE 5000

# Start approuter
CMD ["npm", "start"]