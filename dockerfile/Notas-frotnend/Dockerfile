FROM nginx:alpine

# Copy app
COPY index.html /usr/share/nginx/html/index.html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
