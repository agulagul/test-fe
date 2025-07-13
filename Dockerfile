# Stage 1: Build Angular app
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
