# Immagine base
FROM node:14-alpine

# Cartella di lavoro
WORKDIR /frontend

# Copia dei file
COPY package*.json ./
COPY endpoint.js ./
COPY public ./public
COPY views ./views

# Installazione delle dipendenze
RUN npm install

# Esposizione della porta
EXPOSE 8001

# Comando di avvio
CMD [ "node", "endpoint.js" ]