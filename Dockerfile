# Estágio 1: Construção (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte e realizar o build
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx (Produção)
FROM nginx:alpine

# Limpar arquivos default do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar os artefatos estáticos do Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx para suportar React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
