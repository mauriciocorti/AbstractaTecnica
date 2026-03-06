FROM nginx:alpine

# Instalamos envsubst (incluido en gettext)
RUN apk add --no-cache gettext

# Copiamos la config de nginx
COPY default.conf /etc/nginx/conf.d/default.conf

# Copiamos el HTML como template (con variables $APP_NAME)
COPY index.html /usr/share/nginx/html/index.html.template

# Script de arranque: reemplaza variables y luego lanza nginx
CMD ["/bin/sh", "-c", \
  "envsubst '${APP_NAME}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html && nginx -g 'daemon off;'"]

EXPOSE 80
