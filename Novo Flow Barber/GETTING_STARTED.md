# 🚀 Guia de Inicialização

## Passos para Rodar o Projeto

### 1. Preparação

```bash
# Clonar o repositório
git clone <repo-url>
cd flow-barber

# Instalar dependências
npm install
```

### 2. Configurar Firebase

Já vem pré-configurado em `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBGytekm0NYSlM3Cq2oMV0ipuF_1bP1ads
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=multibarbeir.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=multibarbeir
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=multibarbeir.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=318079209487
NEXT_PUBLIC_FIREBASE_APP_ID=1:318079209487:web:79fdc7aeee4a539375537a
```

### 3. Inicializar Estrutura Firestore

Você precisa criar a estrutura base no Firestore. Aqui estão os dados que devem existir:

#### A. Coleção `settings/globalConfig`

```json
{
  "masterAdmin": "saullinho2008@gmail.com",
  "features": {
    "multiBarbers": true,
    "subscriptions": true,
    "maintenanceMode": false
  },
  "theme": {
    "currentTheme": "gold",
    "availableThemes": ["blue", "gold"]
  },
  "company": {
    "name": "Flow Barber",
    "phone": "+55 11 99999-9999",
    "businessHours": {
      "monday": { "start": "09:00", "end": "18:00" },
      "tuesday": { "start": "09:00", "end": "18:00" },
      "wednesday": { "start": "09:00", "end": "18:00" },
      "thursday": { "start": "09:00", "end": "18:00" },
      "friday": { "start": "09:00", "end": "20:00" },
      "saturday": { "start": "09:00", "end": "16:00" },
      "sunday": null
    }
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Como criar:**
1. Abra [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `multibarbeir`
3. Vá para Firestore Database
4. Clique em "+ Iniciar coleção"
5. Nome: `settings`
6. Primeiro documento ID: `globalConfig`
7. Adicione os campos acima

#### B. Criar Usuário Admin Master

```bash
npm run dev
# Acesse http://localhost:3000/register
# Email: saullinho2008@gmail.com
# Senha: (escolha uma forte)
# Nome: Administrador
```

Ou crie via Firebase Console em Authentication > Users

#### C. Criar Perfil do Admin no Firestore

Na collection `users`, crie um documento com ID = `{uid do usuário}`:

```json
{
  "email": "saullinho2008@gmail.com",
  "displayName": "Administrador",
  "phone": "+55 11 99999-9999",
  "role": "admin",
  "isMasterAdmin": true,
  "status": "active",
  "preferences": {
    "theme": "gold",
    "notifications": true,
    "language": "pt-BR"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4. Criar Dados de Exemplo (Barbeiros)

No Firestore, crie um documento em `barbers/{barberId}`:

```json
{
  "name": "Carlos Silva",
  "email": "carlos@flowbarber.com",
  "phone": "(11) 99999-1111",
  "bio": "Barbeiro com 10 anos de experiência",
  "active": true,
  "rating": 4.8,
  "totalReviews": 32,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Adicionar Horários do Barbeiro

Em `barbers/{barberId}/schedule`, crie documentos para cada dia:

```json
{
  "dayOfWeek": 0,
  "startTime": "09:00",
  "endTime": "18:00",
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "isWorkingDay": false
}
```

(dayOfWeek: 0=domingo, 1=segunda, ..., 6=sábado)

#### Adicionar Serviços do Barbeiro

Em `barbers/{barberId}/services`:

```json
{
  "name": "Corte de Cabelo",
  "description": "Corte moderno com máquina e tesoura",
  "price": 45,
  "duration": 30,
  "category": "hair",
  "active": true,
  "createdAt": "timestamp"
}
```

### 5. Rodar o Projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

### 6. Testar as Funcionalidades

#### Login Admin
- URL: http://localhost:3000/login
- Email: `saullinho2008@gmail.com`
- Acesso a: `/admin/dashboard`

#### Cadastrar Cliente
- URL: http://localhost:3000/register
- Criar nova conta
- Acesso a: `/client/index`

### 7. Deploy

#### Vercel (Recomendado)

```bash
npm install -g vercel
vercel login
vercel
```

#### Firebase Hosting

```bash
firebase login
firebase deploy
```

---

## 📋 Checklist

- [ ] Instalar dependências
- [ ] Configurar `.env.local`
- [ ] Criar documento `settings/globalConfig`
- [ ] Registrar Admin Master
- [ ] Criar perfil do Admin no Firestore
- [ ] Criar dados de exemplo (barbeiros)
- [ ] Executar `npm run dev`
- [ ] Testar login
- [ ] Testar register
- [ ] Testar agendamento

---

## 🐛 Troubleshooting

### "Erro ao conectar Firebase"
- Verifique as variáveis em `.env.local`
- Certifique que está na lista de domínios permitidos em Firebase Settings

### "Usuário não encontrado após login"
- Vá ao Firestore e crie o documento em `users/{uid}`
- Copie o UID da Authentication

### "Erro 403 ao ler Firestore"
- Verifique as Security Rules
- Deploy: `firebase deploy --only firestore:rules`

---

## 📞 Suporte

Para dúvidas, consulte:
- README.md
- FIRESTORE_QUERIES.md
- Documentação oficial do Firebase
