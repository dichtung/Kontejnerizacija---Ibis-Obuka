# Define base image for NodeJS
FROM node:14-alpine

# Create working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json in order to install libraries
COPY package*.json ./

# Initiate installation
RUN npm install

# Copy the working application code
COPY app.js .

# Set the APP_PORT environment variable to custom port (i.e. 5900)
ENV APP_PORT=5900

# Setting the DB-related environment variables
ENV DB_HOSTNAME=catsdb.ibis-solutions.rs
ENV DB_USERNAME=ibis
ENV DB_PASSWORD=ibis123
ENV DB_PORT=27017
ENV DB_AUTH=zivotinje
# Expose the port defined in previous Stanza (i.e. 5900)
EXPOSE 5900

# Run the nodejs server
CMD [ "npm", "start" ]
# CMD [ "node", "app.js"] - rade istu stvar, videti package.json scripts
