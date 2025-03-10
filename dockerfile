FROM node:18

# Definir diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos package.json e package-lock.json para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todos os arquivos do projeto para o container
COPY . .

# Expor a porta em que o aplicativo será executado
EXPOSE 3000

# Comando para rodar o aplicativo
CMD ["npm", "start"]
