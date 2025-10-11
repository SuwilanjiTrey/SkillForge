// src/components/admin/AdminTreasury.jsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, setDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  Filter,
  AlertCircle,
  Plus,
  Check
} from "lucide-react";
import '../Styles/admin.css';

const AdminTreasury = () => {
  const [treasuryData, setTreasuryData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [treasuryExists, setTreasuryExists] = useState(false);
  
  const db = getFirestore();
  const auth = getAuth(); // Added this line

  // Initialize treasury if it doesn't exist
  const initializeTreasury = async () => {
    setInitializing(true);
    try {
      // Create treasury document with comprehensive schema
      const defaultRoleAmounts = {
        member: 50,
        tutor: 150,
        admin: 300
      };
      
      await setDoc(doc(db, 'treasury', 'main'), {
        balance: 0,
        currency: 'K',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleAmounts: defaultRoleAmounts,
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        createdBy: auth.currentUser.uid, // Fixed: Added auth.currentUser.uid
        lastUpdatedBy: auth.currentUser.uid, // Fixed: Added auth.currentUser.uid
        status: 'active'
      }, { merge: true });
      
      // Create initial transaction
      await addDoc(collection(db, 'transactions'), {
        userId: 'system',
        userEmail: 'system@example.com',
        type: 'initialization',
        role: 'system',
        amount: 0,
        currency: 'K',
        date: new Date(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        description: 'Treasury initialization',
        category: 'system',
        referenceId: 'main',
        createdBy: auth.currentUser.uid, // Fixed: Added auth.currentUser.uid
        status: 'completed',
        notes: 'Initial treasury setup'
      });
      
      setMessage({ text: 'Treasury initialized successfully', type: 'success' });
      setTreasuryData({ // Fixed: Added setTreasuryData
        balance: 0,
        currency: 'K',
        createdAt: new Date(),
        updatedAt: new Date(),
        roleAmounts: defaultRoleAmounts,
        totalTransactions: 1,
        totalIncome: 0,
        totalExpenses: 0,
        status: 'active'
      });
      setTreasuryExists(true);
      
      // Fetch transactions again
      fetchTransactions(); // Fixed: Added fetchTransactions call
    } catch (error) {
      console.error("Error initializing treasury:", error);
      setMessage({ text: `Error initializing treasury: ${error.message}`, type: 'error' });
    } finally {
      setInitializing(false);
      setLoading(false);
    }
  };

  // Function to fetch transactions
  const fetchTransactions = async () => {
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(transactionsQuery);
      const transactionsData = [];
      
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setMessage({ text: `Error fetching transactions: ${error.message}`, type: 'error' });
    }
  };

  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        // Try to fetch treasury balance
        const treasuryDoc = await getDoc(doc(db, 'treasury', 'main'));
        
        if (treasuryDoc.exists()) {
          const data = treasuryDoc.data();
          setTreasuryData(data);
          setTreasuryExists(true);
          
          // Fetch transactions
          fetchTransactions();
          setLoading(false);
        } else {
          // Treasury doesn't exist, show initialization option
          setTreasuryExists(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching treasury data:", error);
        setMessage({ text: `Error fetching treasury data: ${error.message}`, type: 'error' });
        setLoading(false);
      }
    };
    
    fetchTreasuryData();
  }, [db]);

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = transaction.date.toDate();
    return transactionDate.getMonth() === filterMonth && transactionDate.getFullYear() === filterYear;
  });

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'User', 'Type', 'Role', 'Amount', 'Description'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date.toDate().toLocaleDateString(),
        t.userEmail,
        t.type,
        t.role,
        t.amount,
        `"${t.description}"`
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${getMonthName(filterMonth)}_${filterYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="loading">Loading treasury data...</div>;
  }

  return (
    <div className="treasury-management">
      <div className="treasury-header">
        <h2>Treasury Management</h2>
        <p>Monitor financial transactions and treasury balance</p>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}
      
      {!treasuryExists && (
        <div className="initialization-card">
          <div className="initialization-content">
            <AlertCircle size={24} className="initialization-icon" />
            <h3>Treasury Not Initialized</h3>
            <p>The treasury system has not been set up yet. Click the button below to initialize it.</p>
            <button 
              className="initialize-button"
              onClick={initializeTreasury}
              disabled={initializing}
            >
              {initializing ? 'Initializing...' : 'Initialize Treasury'}
            </button>
          </div>
        </div>
      )}
      
      {treasuryExists && treasuryData && ( // Fixed: Added treasuryData check
        <>
          <div className="treasury-overview">
            <div className="treasury-balance-card">
              <div className="balance-header">
                <h3>Current Balance</h3>
                <DollarSign size={24} className="balance-icon" />
              </div>
              <div className="balance-amount">
                {treasuryData.currency}{treasuryData.balance.toFixed(2)} {/* Fixed: Added treasuryData.currency */}
              </div>
              <div className="balance-change">
                <TrendingUp size={16} />
                <span>+{treasuryData.currency}{(treasuryData.balance * 0.05).toFixed(2)} this month</span> {/* Fixed: Added treasuryData.currency */}
              </div>
              <div className="balance-details">
                <div className="balance-detail">
                  <span className="detail-label">Total Transactions:</span>
                  <span className="detail-value">{treasuryData.totalTransactions || 0}</span> {/* Fixed: Added treasuryData.totalTransactions */}
                </div>
                <div className="balance-detail">
                  <span className="detail-label">Total Income:</span>
                  <span className="detail-value">{treasuryData.currency}{(treasuryData.totalIncome || 0).toFixed(2)}</span> {/* Fixed: Added treasuryData.currency and treasuryData.totalIncome */}
                </div>
              </div>
            </div>
            
            <div className="treasury-stats">
              <div className="stat-card">
                <div className="stat-value">
                  {filteredTransactions.length}
                </div>
                <div className="stat-label">
                  Transactions this month
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">
                  {treasuryData.currency}{filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} {/* Fixed: Added treasuryData.currency */}
                </div>
                <div className="stat-label">
                  Total this month
                </div>
              </div>
            </div>
          </div>
          
          <div className="transactions-section">
            <div className="section-header">
              <h3>Transactions</h3>
              <div className="transactions-actions">
                <div className="filter-container">
                  <Calendar size={18} className="filter-icon" />
                  <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    className="filter-select"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="filter-select"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
                
                <button 
                  className="export-button"
                  onClick={exportTransactions}
                  disabled={filteredTransactions.length === 0}
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
            
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.date.toDate().toLocaleDateString()}</td>
                        <td>{transaction.userEmail}</td>
                        <td>
                          <span className={`transaction-type ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.role}</td>
                        <td className="transaction-amount">
                          {transaction.currency}{transaction.amount.toFixed(2)} {/* Fixed: Added transaction.currency */}
                        </td>
                        <td>{transaction.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-transactions">
                        No transactions found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTreasury;
