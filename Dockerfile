FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy remaining files
COPY . .

# Create a .env file with environment variables
RUN echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config to use non-standard port (7890)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 7890

CMD ["nginx", "-g", "daemon off;"]
