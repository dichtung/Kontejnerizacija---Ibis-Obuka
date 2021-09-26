# Definisanje baznog Image-a
FROM mongo:5.0.2
# Kopiramo inicijalizacione parametre u initdb folder
COPY ./init_scripts/db_initialization.js /docker-entrypoint-initdb.d/
