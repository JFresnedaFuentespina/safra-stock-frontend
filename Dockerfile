########################
# 1) BUILD STAGE
########################
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build en modo prod
RUN npx ng build --configuration production

########################
# 2) RUNTIME STAGE
########################
FROM nginx:alpine
# ⚠️ Copia el CONTENIDO de la carpeta browser
COPY --from=build /app/dist/safra-stock-angular/browser/ /usr/share/nginx/html
# (opcional) copia también archivos sueltos como prerendered-routes.json
COPY --from=build /app/dist/safra-stock-angular/prerendered-routes.json /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
