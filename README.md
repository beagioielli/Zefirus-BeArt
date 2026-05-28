# Zefirus - E-commerce de Arte Exclusiva (Beatriz Gioielli)

Bem-vindo ao repositório principal do Zefirus. Este projeto é a plataforma oficial que conecta a arte profunda de Beatriz Gioielli a apreciadores, unindo um Backend robusto à um Frontend moderno e interativo, onde exclusividade e segurança são palavras-chave.

## 🏗 Arquitetura do Projeto

O projeto é dividido em dois subdiretórios principais:
- `/backend`: API REST construída em Laravel 11.
- `/frontend`: SPA (Single Page Application) construída em React + Vite + TypeScript.

---

## 🚀 Setup e Instalação

### Pré-requisitos
- PHP 8.2+
- Composer
- Node.js 18+ e NPM
- Banco de Dados (MySQL)
- Extensões PHP obrigatórias: `gd` ou `imagick` (para uso com a Spatie MediaLibrary / Intervention Image para marca d'água e redimensionamento).

### 🛠 Backend (Laravel API)

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   composer install
   ```
3. Configure as variáveis de ambiente baseando-se no `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Atualize o `.env` com suas credenciais do Banco de Dados:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=zefirus
   DB_USERNAME=root
   DB_PASSWORD=
   ```
5. Gere a chave de aplicação:
   ```bash
   php artisan key:generate
   ```
6. Link o storage de mídias públicas:
   ```bash
   php artisan storage:link
   ```
7. Rode as migrations e os seeders (para popular os perfis de `Admin` e conteúdos de exemplo):
   ```bash
   php artisan migrate:fresh --seed
   ```
8. Inicie o servidor em desenvolvimento (por padrão, porta 8000):
   ```bash
   php artisan serve
   ```

### 🎨 Frontend (React SPA)

1. Em um novo terminal, vá para a pasta frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências Node:
   ```bash
   npm install
   ```
3. Inicie o servidor frontend com o Vite:
   ```bash
   npm run dev
   ```
4. A aplicação estará rodando tipicamente em `http://localhost:5173`. Você pode testar e navegar por todas as rotas (Home, Catálogos, Obras, Blogs e Agendas).

---

## 🔒 Variáveis de Ambiente Necessárias (Produção / Continuação)

### Mercado Pago

A integração de checkout com o Mercado Pago está stubbed (criada, porém inativa) até que as credenciais sejam adicionadas. Para reativar, você precisará editar o `.env` do Backend com:
```env
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_WEBHOOK_SECRET=sua_chave_hmac_para_webhook
```
_Nota: No ambiente local, você deve utilizar o [ngrok](https://ngrok.com/) para escutar os webhooks (ex: `ngrok http 8000`) e configurar essa URL (`<NGROK_URL>/api/webhooks/mercadopago`) no painel de desenvolvedor do Mercado Pago._

### Frontend Base URLs
Se precisar configurar a API para modo produção, é recomendável adicionar um `.env` na pasta frontend com:
```env
VITE_API_URL=https://api.seudominio.com.br/api
```
*(Atualmente está via código hardcoded para localhost na instância Axios `api.ts`)*

---

## 🧩 Elementos Exclusivos (O diferencial Zefirus)

- **Spatie Media Library:** Cada obra enviada processa automaticamente miniaturas em WebP. A variação `gallery` (1200px) aplica automaticamente um Watermark customizável ("© Beatriz Gioielli").
- **Geração de Certificados de Autenticidade (PDF):** A API gera automaticamente usando o DomPDF um atestado único com Hash ao confirmar a compra ou criação da `AcquiredExperience`.
- **A Experiência (Framer Motion + QRCode):** A rota estática gerada após uma aquisição e guardada em UUID garante um ambiente protegido, belíssimo, para o proprietário viver as histórias mais ricas da sua nova obra.

## 👥 Permissões (RBAC)

- Foi semeado (via `RoleSeeder`) o papel primário de Admin e Customer usando o Spatie Permissions. Verifique as rotas admin no arquivo `api.php`. Middleware `role:admin` protege contra acesso indevido.

---
_A Arte liberta, a Tecnologia documenta e eterniza._
