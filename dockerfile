FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
# Instalação específica do debug para resolver o problema
RUN npm install debug@4.3.4 --save-exact
COPY . .
EXPOSE 3000
CMD ["npm", "start"]