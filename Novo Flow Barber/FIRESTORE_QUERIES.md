# 📚 Guia Completo de Queries Firestore

## 🔍 Exemplos de Consultas Úteis

### 1. Obter Todos os Agendamentos de um Barbeiro em uma Data

```javascript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function getBarberAppointmentsByDate(barberId, date) {
  const appointmentsRef = collection(db, 'barbers', barberId, 'appointments');
  
  const q = query(
    appointmentsRef,
    where('date', '==', date),
    where('status', '!=', 'cancelled')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 2. Obter Receita Total de um Período

```javascript
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function getRevenueByPeriod(startDate, endDate) {
  const financialsRef = collection(db, 'financials');
  
  const q = query(
    financialsRef,
    where('type', '==', 'income'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );
  
  const snapshot = await getDocs(q);
  let total = 0;
  
  snapshot.forEach(doc => {
    total += doc.data().amount;
  });
  
  return total;
}
```

### 3. Buscar Clientes por Nome ou Email (Text Search)

```javascript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function searchClients(searchTerm) {
  const usersRef = collection(db, 'users');
  
  // Note: Firestore não suporta busca de texto completa nativamente
  // Você precisa filtrar no cliente ou usar Algolia
  
  const q = query(
    usersRef,
    where('role', '==', 'client')
  );
  
  const snapshot = await getDocs(q);
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return results;
}
```

### 4. Obter Agendamentos Próximos de um Cliente

```javascript
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';

async function getClientUpcomingAppointments(clientId) {
  const appointmentsRef = collection(db, 'clients', clientId, 'appointments');
  
  const q = query(
    appointmentsRef,
    where('date', '>=', Timestamp.now()),
    where('status', '!=', 'cancelled'),
    orderBy('date', 'asc'),
    limit(5)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 5. Obter Barbeiros com Melhor Avaliação

```javascript
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function getTopRatedBarbers() {
  const barbersRef = collection(db, 'barbers');
  
  const q = query(
    barbersRef,
    where('active', '==', true),
    orderBy('rating', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 6. Listening em Tempo Real (Real-time Updates)

```javascript
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function subscribeToBarberAppointments(barberId, callback) {
  const appointmentsRef = collection(db, 'barbers', barberId, 'appointments');
  
  const q = query(
    appointmentsRef,
    where('status', '!=', 'cancelled')
  );
  
  // Listener em tempo real
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(appointments);
  }, (error) => {
    console.error('Erro ao escutar agendamentos:', error);
  });
  
  return unsubscribe; // Chame isso para desinscrever
}

// Uso:
const unsubscribe = subscribeToBarberAppointments('barberId', (appointments) => {
  console.log('Agendamentos atualizados:', appointments);
});

// Depois, quando quiser parar de ouvir:
unsubscribe();
```

### 7. Usar em Hook React

```javascript
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const useBarberAppointments = (barberId) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    const appointmentsRef = collection(db, 'barbers', barberId, 'appointments');
    const q = query(appointmentsRef, where('status', '!=', 'cancelled'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAppointments(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [barberId]);

  return { appointments, loading, error };
};

// Usar no componente:
function MyComponent() {
  const { appointments, loading, error } = useBarberAppointments('barberId123');
  
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>{apt.serviceName}</div>
      ))}
    </div>
  );
}
```

### 8. Contar Documentos (Aggregation)

```javascript
import { collection, aggregateQuerySnapshot, query, where, AggregateField } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function countClientAppointments(clientId) {
  const appointmentsRef = collection(db, 'clients', clientId, 'appointments');
  
  const q = query(
    appointmentsRef,
    where('status', '==', 'completed')
  );
  
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
```

### 9. Atualizar Múltiplos Documentos (Batch Write)

```javascript
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function cancelAppointmentInBothCollections(clientId, barberId, appointmentId) {
  const batch = writeBatch(db);

  // Atualizar em barbers/barberId/appointments
  const barberAptRef = doc(
    db,
    'barbers',
    barberId,
    'appointments',
    appointmentId
  );
  batch.update(barberAptRef, { status: 'cancelled' });

  // Atualizar em clients/clientId/appointments
  const clientAptRef = doc(
    db,
    'clients',
    clientId,
    'appointments',
    appointmentId
  );
  batch.update(clientAptRef, { status: 'cancelled' });

  // Confirmar todas as operações de uma vez
  await batch.commit();
}
```

### 10. Deletar Múltiplos Documentos

```javascript
import { writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function deleteOldAppointments(barberId, daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const appointmentsRef = collection(db, 'barbers', barberId, 'appointments');
  const q = query(
    appointmentsRef,
    where('date', '<', cutoffDate),
    where('status', '==', 'completed')
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
```

### 11. Paginação

```javascript
import { collection, getDocs, query, where, orderBy, startAt, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function getAppointmentPage(barberId, pageSize = 10, lastDoc = null) {
  const appointmentsRef = collection(db, 'barbers', barberId, 'appointments');
  
  let constraints = [
    where('status', '!=', 'cancelled'),
    orderBy('date', 'desc'),
    limit(pageSize + 1), // +1 para saber se há próxima página
  ];

  if (lastDoc) {
    constraints.push(startAt(lastDoc));
  }

  const q = query(appointmentsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;
  const nextLastDoc = docs[docs.length - 1];

  return {
    appointments: docs.map(doc => ({ id: doc.id, ...doc.data() })),
    hasMore,
    lastDoc: nextLastDoc,
  };
}
```

### 12. Verificar se Documento Existe

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function userExists(userId) {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  return snapshot.exists();
}
```

### 13. Obter Subcoleção de um Documento

```javascript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function getBarberServices(barberId) {
  const servicesRef = collection(db, 'barbers', barberId, 'services');
  const snapshot = await getDocs(servicesRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

### 14. Usar Índices para Queries Complexas

Para queries com múltiplas condições, crie um índice no Firebase Console:

```javascript
// Esta query requer um índice:
const q = query(
  appointmentsRef,
  where('barberId', '==', barberId),
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  where('status', '!=', 'cancelled'),
  orderBy('date', 'asc')
);
```

Firestore pedirá para você criar o índice automaticamente quando rodar essa query.

### 15. Transações (Operações Atômicas)

```javascript
import { runTransaction, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function moveAppointmentToNewBarber(
  clientId,
  oldBarberId,
  newBarberId,
  appointmentId,
  appointmentData
) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Ler dados atuais
      const oldAptRef = doc(db, 'barbers', oldBarberId, 'appointments', appointmentId);
      const oldAptSnap = await transaction.get(oldAptRef);

      if (!oldAptSnap.exists()) {
        throw new Error('Agendamento não encontrado');
      }

      // 2. Deletar do barbeiro antigo
      transaction.delete(oldAptRef);

      // 3. Criar em novo barbeiro
      const newAptRef = doc(db, 'barbers', newBarberId, 'appointments', appointmentId);
      transaction.set(newAptRef, appointmentData);

      // 4. Atualizar referência do cliente
      const clientAptRef = doc(db, 'clients', clientId, 'appointments', appointmentId);
      transaction.update(clientAptRef, { barberId: newBarberId });
    });

    console.log('Agendamento transferido com sucesso!');
  } catch (error) {
    console.error('Erro na transação:', error);
  }
}
```

## ⚠️ Boas Práticas

### ✅ Faça Isso

```javascript
// ✅ Usar índices para queries complexas
const q = query(collection, where(...), where(...), orderBy(...));

// ✅ Usar Batch para múltiplas escritas
const batch = writeBatch(db);
batch.set(...);
batch.update(...);
await batch.commit();

// ✅ Usar Transactions para operações relacionadas
await runTransaction(db, async (transaction) => {
  // operações
});

// ✅ Desinscrever listeners quando componente desmontar
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe();
}, []);

// ✅ Usar onSnapshot para dados em tempo real
const unsubscribe = onSnapshot(query, (snapshot) => {
  // dados atualizados
});
```

### ❌ NÃO Faça Isso

```javascript
// ❌ Queries muito complexas sem índices
const q = query(collection, where(...), where(...), where(...), orderBy(...));

// ❌ Escritas individuais em loop
for (let doc of docs) {
  await setDoc(doc.ref, doc.data()); // LENTO!
}

// ❌ Listeners não removidos
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  // Esqueceu de retornar unsubscribe()
}, []);

// ❌ Chamar query constantemente (cache não funciona)
const [appointments, setAppointments] = useState([]);
// Isso roda a cada render:
const q = query(...);
getDocs(q).then(setAppointments);

// ❌ Campos não indexados em where + orderBy
const q = query(collection, where('customField', '==', 'value'), orderBy('date'));
```

## 📊 Estrutura de Dados Recomendada

```javascript
// ✅ Para collections com muitos documentos aninhados
// Use referências em vez de arrays
users/{userId}/subscriptions/{subscriptionId}

// ✅ Para queries frequentes, duplique dados estrategicamente
// Exemplo: guardar o nome do barbeiro no agendamento
appointment: {
  barberId: '123',      // Para relação
  barberName: 'Carlos', // Para exibição sem query extra
  ...
}

// ✅ Use timestamps para ordenação fácil
createdAt: Timestamp.now()
date: Timestamp.fromDate(new Date())

// ✅ Use arrays apenas quando você vai sempre buscar tudo
equipment: ['clipper1', 'clipper2', 'razor1']
```

## 🚀 Performance Tips

1. **Limitar resultados**: Use `limit()` para evitar ler muitos docs
2. **Índices**: Crie índices para queries frequentes
3. **Subcoleções**: Use para dados relacionados que crescem frequentemente
4. **Denormalização**: Copie dados relevantes para evitar queries extras
5. **Cache local**: Use localStorage para dados que não mudam frequentemente
6. **Paginar**: Implemente paginação para listas grandes
7. **Transações**: Use para operações que devem ser atômicas

## 📚 Referências

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React + Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

**Dúvidas?** Consulte a documentação oficial ou entre em contato com o time!
