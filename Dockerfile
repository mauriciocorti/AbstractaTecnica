FROM nginx:alpine

# Copiamos el HTML estático a la imagen
COPY index.html /usr/share/nginx/html/index.html

# nginx.conf se monta desde el ConfigMap en runtime
# así podemos cambiar la config sin rebuildar la imagen

EXPOSE 80