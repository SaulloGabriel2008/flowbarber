import { 
  collection,
  addDoc, 
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Obter saldo financeiro total
 */
export const getTotalBalance = async () => {
  try {
    const financialsSnapshot = await getDocs(collection(db, 'financials'));
    
    let totalIncome = 0;
    let totalExpense = 0;

    financialsSnapshot.forEach(doc => {
      const financial = doc.data();
      if (financial.type === 'income') {
        totalIncome += financial.amount;
      } else {
        totalExpense += financial.amount;
      }
    });

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
    };
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    throw error;
  }
};

/**
 * Obter receita mensal
 */
export const getMonthlyRevenue = async (year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'financials'),
        where('type', '==', 'income'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
    );

    let total = 0;
    querySnapshot.forEach(doc => {
      total += doc.data().amount;
    });

    return total;
  } catch (error) {
    console.error('Erro ao obter receita mensal:', error);
    throw error;
  }
};

/**
 * Adicionar despesa
 */
export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(collection(db, 'financials'), {
      ...expenseData,
      type: 'expense',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar despesa:', error);
    throw error;
  }
};

/**
 * Adicionar renda (do agendamento)
 */
export const addIncome = async (incomeData) => {
  try {
    const docRef = await addDoc(collection(db, 'financials'), {
      ...incomeData,
      type: 'income',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar renda:', error);
    throw error;
  }
};

/**
 * Obter histórico financeiro por período
 */
export const getFinancialHistory = async (startDate, endDate, type = null) => {
  try {
    const queryConstraints = [
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
    ];

    if (type) {
      queryConstraints.push(where('type', '==', type));
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'financials'), ...queryConstraints)
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter histórico financeiro:', error);
    throw error;
  }
};

/**
 * Obter despesas por categoria
 */
export const getExpensesByCategory = async (year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'financials'),
        where('type', '==', 'expense'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
    );

    const expensesByCategory = {};

    querySnapshot.forEach(doc => {
      const { category, amount } = doc.data();
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += amount;
    });

    return expensesByCategory;
  } catch (error) {
    console.error('Erro ao obter despesas por categoria:', error);
    throw error;
  }
};
