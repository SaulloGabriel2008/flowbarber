# 🏗️ Documentação da Arquitetura

## Visão Geral

Flow Barber é um **SaaS escalável para barbearias** com suporte a multi-barbeiros, assinaturas, temas customizáveis e administração completa.

### Stack Tecnológico

```
Frontend: Next.js 14 + React 18
Styling: Tailwind CSS + CSS Variables
Backend: Firebase (Auth + Firestore + Storage)
Database: Firestore (NoSQL)
Hosting: Vercel (recomendado)
```

---

## 🗄️ Estrutura do Firestore Detalhada

### 1. Collection: `settings`

**Propósito**: Configurações globais do sistema

```
settings/
  └─ globalConfig (documento único)
     ├─ features
     │  ├─ multiBarbers: boolean
     │  ├─ subscriptions: boolean
     │  └─ maintenanceMode: boolean
     ├─ theme
     │  ├─ currentTheme: "gold" | "blue"
     │  └─ availableThemes: ["gold", "blue"]
     ├─ company
     │  ├─ name: string
     │  ├─ phone: string
     │  └─ businessHours: {...}
     └─ masterAdmin: string (email)
```

**Acesso**: Apenas admins lêem, apenas master admin escreve.

---

### 2. Collection: `users`

**Propósito**: Dados dos usuários (admin, client, barber)

```
users/
  └─ {userId} (Auth UID)
     ├─ email: string
     ├─ displayName: string
     ├─ phone: string
     ├─ role: "admin" | "client" | "barber"
     ├─ isMasterAdmin: boolean
     ├─ status: "active" | "inactive"
     ├─ avatar: string (Storage URL)
     ├─ preferences
     │  ├─ theme: "gold" | "blue"
     │  ├─ notifications: boolean
     │  └─ language: "pt-BR"
     ├─ createdAt: Timestamp
     ├─ updatedAt: Timestamp
     └─ subscriptions/ (Subcollection)
        └─ {subscriptionId}
           ├─ planId: string
           ├─ status: "active" | "cancelled"
           ├─ startDate: Timestamp
           ├─ endDate: Timestamp
           ├─ autoRenew: boolean
           └─ paymentMethod: string
```

**Acesso**: Leitura própria ou admin, escrita própria.

---

### 3. Collection: `barbers` (Multi-Barbeiros ⭐)

**Propósito**: Dados dos barbeiros e seus agendamentos

```
barbers/
  └─ {barberId} (documento do barbeiro)
     ├─ name: string
     ├─ email: string
     ├─ phone: string
     ├─ bio: string
     ├─ avatar: string (Storage URL)
     ├─ active: boolean
     ├─ rating: number (0-5)
     ├─ totalReviews: number
     ├─ createdAt: Timestamp
     ├─ updatedAt: Timestamp
     │
     ├─ schedule/ (Subcollection - Horários)
     │  └─ {scheduleId}
     │     ├─ dayOfWeek: 0-6
     │     ├─ startTime: "HH:MM"
     │     ├─ endTime: "HH:MM"
     │     ├─ breakStartTime: "HH:MM"
     │     ├─ breakEndTime: "HH:MM"
     │     └─ isWorkingDay: boolean
     │
     ├─ services/ (Subcollection - Serviços)
     │  └─ {serviceId}
     │     ├─ name: string
     │     ├─ description: string
     │     ├─ price: number
     │     ├─ duration: number (minutos)
     │     ├─ category: string
     │     ├─ image: string
     │     ├─ active: boolean
     │     └─ createdAt: Timestamp
     │
     └─ appointments/ (Subcollection ⭐ - Agendamentos)
        └─ {appointmentId}
           ├─ clientId: string
           ├─ serviceId: string
           ├─ date: Timestamp
           ├─ startTime: "HH:MM"
           ├─ endTime: "HH:MM"
           ├─ serviceName: string
           ├─ status: "pending" | "confirmed" | "completed" | "cancelled"
           ├─ clientNotes: string
           ├─ barberNotes: string
           ├─ price: number
           ├─ paymentStatus: "pending" | "paid" | "refunded"
           ├─ paymentMethod: "cash" | "card" | "subscription"
           ├─ rating: number (1-5)
           ├─ review: string
           ├─ createdAt: Timestamp
           └─ updatedAt: Timestamp
```

**Acesso**: Leitura pública (lista), escrita restrita ao barbeiro/admin.

---

### 4. Collection: `clients` (Espelho de usuários)

**Propósito**: Dados complementares do cliente

```
clients/
  └─ {clientId}
     ├─ userId: string (referência)
     ├─ email: string
     ├─ displayName: string
     ├─ phone: string
     ├─ avatar: string
     ├─ address: string
     ├─ preferredBarber: string (barberId ou null)
     ├─ totalAppointments: number
     ├─ totalSpent: number
     ├─ status: "active" | "inactive"
     ├─ createdAt: Timestamp
     └─ appointments/ (Subcollection - Espelho)
        └─ {appointmentId} (mesmos dados que barbers/{barberId}/appointments)
```

**Por que duplicar agendamentos?**
- Cliente precisa acessar rapidamente seus agendamentos
- Evita query complexa com referência cruzada
- Segurança: cada usuário vê apenas seus agendamentos

---

### 5. Collection: `financials`

**Propósito**: Receitas e despesas da barbearia

```
financials/
  └─ {financialId}
     ├─ type: "income" | "expense"
     ├─ category: string
     ├─ amount: number
     ├─ description: string
     ├─ date: Timestamp
     ├─ paymentMethod: string
     ├─ appointmentId: string (se for renda)
     ├─ createdBy: string (userId)
     └─ createdAt: Timestamp
```

---

### 6. Collection: `plans` (Assinaturas)

**Propósito**: Planos disponíveis para clientes

```
plans/
  └─ {planId}
     ├─ name: string
     ├─ description: string
     ├─ price: number
     ├─ billingCycle: "monthly" | "yearly"
     ├─ features: [string, ...]
     ├─ appointmentsPerMonth: number
     ├─ discountPercentage: number
     ├─ active: boolean
     └─ createdAt: Timestamp
```

---

## 🔐 Regras de Segurança

Veja [lib/firebase/firestore.rules](./lib/firebase/firestore.rules)

**Princípios**:
1. Clientes veem apenas seus dados
2. Barbeiros gerenciam seus agendamentos
3. Admins veem tudo
4. Master admin pode alterar configurações globais

---

## 🔄 Fluxo de Dados: Agendamento

```
Cliente escolhe barbeiro
       ↓
Cliente escolhe serviço
       ↓
Sistema carrega horários disponíveis
  - Query: barbers/{barberId}/schedule
  - Query: barbers/{barberId}/appointments
  - Calcula slots livres
       ↓
Cliente escolhe data/hora
       ↓
Cliente confirma agendamento
  - CREATE barbers/{barberId}/appointments/{appointmentId}
  - CREATE clients/{clientId}/appointments/{appointmentId} (espelho)
  - UPDATE clients/{clientId} (aumenta totalAppointments)
  - NOTIFY barbeiro
       ↓
Agendamento criado ✅
```

---

## 🎨 Sistema de Temas

### Implementação

**Variáveis CSS** em [styles/globals.css](./styles/globals.css):

```css
[data-theme="gold"] {
  --color-primary: #D4AF37;
  --bg-primary: #0F0F0F;
  /* ... */
}

[data-theme="blue"] {
  --color-primary: #137FEC;
  --bg-primary: #F6F7F8;
  /* ... */
}
```

**Aplicação no DOM**:
```javascript
document.documentElement.setAttribute('data-theme', 'gold');
```

**Persistência**:
- Tema global em `settings/globalConfig`
- Tema do usuário em `users/{userId}/preferences/theme`

---

## 🚀 Feature Flags

**Localização**: `settings/globalConfig`

```json
{
  "features": {
    "multiBarbers": true,
    "subscriptions": true,
    "maintenanceMode": false
  }
}
```

**Uso no código**:
```javascript
const { multiBarbers, subscriptions } = useFeatureFlags();

if (multiBarbers) {
  // Mostrar seletor de barbeiros
}
```

**Benefícios**:
- Ativar/desativar features sem deploy
- A/B testing
- Controle gradual de rollout

---

## 📱 Estrutura de Pastas

```
app/
  ├─ (auth)/              # Layout para login/register
  ├─ (admin)/             # Layout com sidebar
  │  └─ admin/
  │     ├─ dashboard/     # Dashboard admin
  │     ├─ appointments/  # Gerenciar agendamentos
  │     ├─ clients/       # Lista de clientes
  │     ├─ barbers/       # Gerenciar barbeiros
  │     ├─ financials/    # Finanças
  │     ├─ subscriptions/ # Planos
  │     └─ settings/      # Configurações globais
  │
  ├─ (client)/            # Layout com bottom nav
  │  └─ client/
  │     ├─ index/         # Página inicial
  │     ├─ book/          # Agendar
  │     ├─ appointments/  # Meus agendamentos
  │     ├─ subscriptions/ # Seus planos
  │     └─ profile/       # Perfil
  │
  ├─ layout.jsx           # Layout raiz
  └─ page.jsx             # Landing page

components/
  ├─ admin/               # Componentes do admin
  ├─ client/              # Componentes do cliente
  ├─ forms/               # Formulários
  └─ shared/              # Componentes compartilhados

lib/
  ├─ firebase/
  │  ├─ config.js         # Inicialização Firebase
  │  ├─ hooks/            # Hooks (useAuth, useUser, etc)
  │  └─ services/         # CRUD operations
  │
  ├─ contexts/            # Contextos globais
  └─ utils/               # Funções utilitárias

styles/
  └─ globals.css          # Temas e variáveis CSS
```

---

## 🔄 Fluxos Principais

### 1. Autenticação
```
1. Usuário acessa /login
2. Firebase Auth valida credenciais
3. Se sucesso:
   - Query users/{uid}
   - Carrega dados do usuário
   - Redireciona baseado em role
```

### 2. Agendamento (Multi-Barbeiros Ativo)
```
1. Cliente acessa /client/book
2. getActiveBarbers() → lista barbeiros
3. getBarberServices(barberId) → serviços
4. getAvailableSlots(barberId, date) → slots livres
5. createAppointment() → salva em ambos os locais
6. Redireciona para /client/appointments
```

### 3. Configurações (Admin Master Only)
```
1. Admin acessa /admin/settings
2. Verifica: isMasterAdmin?
3. Se sim: permite editar feature flags
4. updateFeatureFlags() → atualiza globalConfig
5. Sistema recarrega com novas flags
```

---

## 📊 Estrutura de Índices Firestore Necessários

Crie esses índices para otimizar queries:

**1. Agendamentos por data**
- Collection: `barbers/{barberId}/appointments`
- Índice: `date` (Ascending), `status` (Ascending)

**2. Agendamentos do cliente**
- Collection: `clients/{clientId}/appointments`
- Índice: `date` (Descending), `status` (Ascending)

**3. Finanças por período**
- Collection: `financials`
- Índice: `date` (Ascending), `type` (Ascending)

**4. Barbeiros ativos**
- Collection: `barbers`
- Índice: `active` (Ascending), `rating` (Descending)

Firestore suggere automaticamente quando você faz a query 😊

---

## 🚀 Próximos Passos (Roadmap)

### Fase 1: MVP (Já Implementado ✅)
- [x] Autenticação
- [x] Agendamentos multi-barbeiros
- [x] Painel admin básico
- [x] Temas customizáveis
- [x] Feature flags

### Fase 2: Aprimoramentos
- [ ] Pagamento integrado (Stripe)
- [ ] SMS/Email notifications
- [ ] Dashboard de analytics
- [ ] Relatórios PDF
- [ ] Backup automático

### Fase 3: Avançado
- [ ] APP mobile (React Native)
- [ ] Integração com redes sociais
- [ ] IA para recomendações
- [ ] Localização geográfica
- [ ] Multi-unidade

---

## 📈 Performance

### Otimizações Implementadas

1. **Code Splitting**: Next.js faz automaticamente
2. **Image Optimization**: `next/image`
3. **Firebase Indexes**: Queries rápidas
4. **Real-time Listeners**: Em vez de polls
5. **CSS-in-JS Minimal**: Variáveis CSS nativas
6. **Bundle Analysis**: Configure com `ANALYZE=true npm run build`

---

## 🔍 Monitoramento

### Onde Monitorar

1. **Firebase Console**
   - Firestore: Reads, Writes, Deletes
   - Storage: Upload/Download
   - Authentication: Logins

2. **Vercel Analytics**
   - Performance
   - Page Views
   - Errors

3. **Custom Logs**
   - Implementar CloudLogging futuramente

---

## 📞 Suporte Técnico

**Documentação Referenciada**:
- [README.md](./README.md) - Visão geral
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup inicial
- [FIRESTORE_QUERIES.md](./FIRESTORE_QUERIES.md) - Exemplos de queries
- [lib/firebase/firestore.rules](./lib/firebase/firestore.rules) - Regras de segurança

---

Desenvolvido com ❤️ para Flow Barber
