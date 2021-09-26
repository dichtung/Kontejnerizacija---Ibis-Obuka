FROM nginx:latest
WORKDIR /usr/share/nginx/html/
COPY index.html .
COPY script.js .
COPY style.css .
RUN mkdir resources
COPY resources/* ./resources
COPY nginx/nginx-config.conf /etc/nginx/conf.d/
EXPOSE 5900
