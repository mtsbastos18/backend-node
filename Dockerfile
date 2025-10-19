# 1. Use uma imagem base oficial do Node.js (use a versão que seu projeto utiliza)
FROM node:20-alpine

# 2. Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# 3. Copie o package.json e package-lock.json
# (Fazemos isso separado para aproveitar o cache do Docker)
COPY package*.json ./

# 4. Instale as dependências
RUN npm install

# 5. Copie o resto dos arquivos do seu projeto
COPY . .

# 6. Exponha a porta que sua aplicação usa (o Cloud Run usará a variável PORT)
EXPOSE 8080 

# 7. O comando para iniciar sua aplicação
CMD [ "npm", "start" ]