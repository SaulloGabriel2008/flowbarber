# Flow Barber - SaaS para Barbearias

Sistema completo de agendamentos para barbearias com Firebase, suportando múltiplos barbeiros e assinaturas.

## 🚀 Características

- ✅ **Autenticação Firebase** - Segura com email e senha
- ✅ **Multi-Barbeiros** - Gerencie vários barbeiros simultaneamente
- ✅ **Assinaturas** - Sistema de planos para clientes
- ✅ **Temas Dinâmicos** - Alterne entre Dourado (luxo) e Azul (moderno)
- ✅ **Painel Admin** - Dashboard completo para administradores
- ✅ **Área Cliente** - Interface mobile-first para agendamentos
- ✅ **Segurança** - Regras Firestore por perfil de usuário
- ✅ **Escalável** - Arquitetura preparada para crescimento

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase (já configurada)

## 🔧 Instalação

```bash
# Clonar repositório
git clone <seu-repo>
cd flow-barber

# Instalar dependências
npm install

# Criar arquivo .env.local
cp .env.example .env.local
```

## ⚙️ Configuração

Seu `.env.local` já vem com a configuração Firebase pré-carregada:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBGytekm0NYSlM3Cq2oMV0ipuF_1bP1ads
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=multibarbeir.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=multibarbeir
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=multibarbeir.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=318079209487
NEXT_PUBLIC_FIREBASE_APP_ID=1:318079209487:web:79fdc7aeee4a539375537a
```

## 🚀 Iniciar Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
app/
├── (auth)/          # Páginas de login/registro
├── (admin)/         # Dashboard do administrador
├── (client)/        # Área do cliente
└── api/             # Rotas API

lib/
├── firebase/        # Configuração Firebase
│   ├── hooks/      # Hooks customizados
│   └── services/   # Serviços Firebase
└── contexts/       # Contextos globais

components/
├── admin/          # Componentes admin
├── client/         # Componentes cliente
├── forms/          # Formulários
└── shared/         # Componentes compartilhados

styles/
└── globals.css     # Variáveis CSS e temas
```

## 🔐 Usuários de Teste

### Admin Master
- Email: `saullinho2008@gmail.com`
- Role: Acesso total ao sistema
- Pode: Ativar/desativar features, gerenciar temas

### Cliente Teste
Crie uma nova conta via página de registro

## 🎨 Sistema de Temas

### Tema Dourado (Gold) - Padrão
- Cores: Dourado (#D4AF37)
- Estilo: Luxuoso, premium
- Background: Preto (#0F0F0F)

### Tema Azul (Blue)
- Cores: Azul (#137FEC)
- Estilo: Moderno, clean
- Background: Branco (#F6F7F8)

**Mude o tema:** Clique no ícone de tema no admin ou na página de configurações.

## 🔄 Feature Flags

Ative/desative features no Firestore:

```firestore
settings/globalConfig
├── features
│   ├── multiBarbers: true/false
│   └── subscriptions: true/false
```

## 📊 Estrutura Firestore

### Collections Principais

```
users/                       # Usuarios do sistema
├── {userId}
│   └── subscriptions/       # Assinaturas do user

barbers/                     # Barbeiros
├── {barberId}
│   ├── schedule/           # Agenda do barbeiro
│   ├── services/           # Serviços oferecidos
│   └── appointments/       # Agendamentos

clients/                     # Clientes
├── {clientId}
│   └── appointments/       # Agendamentos do cliente

settings/
└── globalConfig            # Configurações globais
```

## 🔐 Regras de Segurança

As regras Firebase estão configuradas para:

- ✅ Clientes só veem seus próprios dados
- ✅ Barbeiros só gerenciam seus agendamentos
- ✅ Admin pode acessar tudo
- ✅ Master Admin pode alterar configurações globais

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm start            # Inicia servidor de produção
npm run lint         # Verifica problemas de código
```

## 📱 Responsividade

- ✅ Mobile-first design
- ✅ Suporta tablets
- ✅ Desktop completo
- ✅ Modo escuro automático

## 🚀 Deploy

### Vercel (Recomendado para Next.js)

```bash
npm install -g vercel
vercel
```

### Firebase Hosting

```bash
firebase deploy
```

## 🐛 Troubleshooting

### Erro de autenticação
- Verifique se as variáveis `.env.local` estão corretas
- Certifique de que está usando as credenciais Firebase certos

### Agendamentos não aparecem
- Verifique as regras de segurança Firestore
- Certifique que o usuário é um cliente (role: 'client')

### Tema não muda
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique se JavaScript está ativado

## 📚 Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📝 Licença

MIT

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ por Flow Barber Team

---

**Precisa de ajuda?** Entre em contato conosco!
