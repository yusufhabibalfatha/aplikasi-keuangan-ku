import React, { useState, useEffect, useRef } from 'react';
import '../style/ExpenseTracker.css';

// Theme configuration
const themes = {
  neoBrutalism: {
    name: 'Neo Brutalism',
    className: 'theme-neo-brutalism',
    icon: '🟥'
  },
  glassmorphism: {
    name: 'Glassmorphism',
    className: 'theme-glassmorphism',
    icon: '🪟'
  },
  darkMode: {
    name: 'Dark Mode',
    className: 'theme-dark-mode',
    icon: '🌙'
  },
  material: {
    name: 'Material Design',
    className: 'theme-material',
    icon: '🎨'
  }
};

// Utility functions untuk theme management
const ThemeManager = {
  // Save theme to localStorage
  saveTheme: (themeKey) => {
    try {
      localStorage.setItem('expenseTrackerTheme', themeKey);
      return true;
    } catch (error) {
      console.error('Failed to save theme:', error);
      return false;
    }
  },
  
  // Load theme from localStorage
  loadTheme: () => {
    try {
      const theme = localStorage.getItem('expenseTrackerTheme');
      return theme && themes[theme] ? theme : 'neoBrutalism';
    } catch (error) {
      console.error('Failed to load theme:', error);
      return 'neoBrutalism';
    }
  }
};

const ExpenseTracker = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthlyTotals, setMonthlyTotals] = useState({});
    const [monthlyStats, setMonthlyStats] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // ✅ FIX: Ambil tema dari localStorage saat initial render
    const [currentTheme, setCurrentTheme] = useState(() => {
      return ThemeManager.loadTheme();
    });
    
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const themeSelectorRef = useRef(null);

    // State untuk form input
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
    });

    // Close theme selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target)) {
                setShowThemeSelector(false);
            }
        };

        if (showThemeSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showThemeSelector]);

    // ✅ FIX: Simpan tema ke localStorage setiap kali currentTheme berubah
    useEffect(() => {
      ThemeManager.saveTheme(currentTheme);
      console.log('💾 Tema disimpan:', currentTheme);
    }, [currentTheme]);

    // Format currency ke Rupiah
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Format tanggal ke Indonesia (tanpa tahun 2025)
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const currentYear = today.getFullYear();
        const expenseYear = date.getFullYear();
        
        if (expenseYear === currentYear) {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long'
            });
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    // Format bulan ke Indonesia
    const formatMonth = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
        });
    };

    // Ambil data dari API
    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wp-json/expenses/v1/all`);
            
            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }
            
            const data = await response.json();

            console.log('data ', data)
            
            if (data.success) {
                setExpenses(data.data);
                calculateMonthlyTotals(data.data);
                calculateMonthlyStats(data.data);
            } else {
                throw new Error('Data tidak berhasil diambil');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Hitung total per bulan
    const calculateMonthlyTotals = (expensesData) => {
        const monthlyData = {};
        
        expensesData.forEach(expense => {
            const date = new Date(expense.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = formatMonth(expense.date);
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    monthName: monthName,
                    total: 0,
                    expenses: []
                };
            }
            
            monthlyData[monthYear].total += parseInt(expense.amount);
            monthlyData[monthYear].expenses.push(expense);
        });
        
        setMonthlyTotals(monthlyData);
    };

    // Hitung statistik hemat per bulan
    const calculateMonthlyStats = (expensesData) => {
        const stats = {};
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        expensesData.forEach(expense => {
            const date = new Date(expense.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!stats[monthYear]) {
                const month = date.getMonth();
                const year = date.getFullYear();
                
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                const effectiveDays = (month === currentMonth && year === currentYear) 
                    ? today.getDate() 
                    : daysInMonth;
                
                stats[monthYear] = {
                    daysInMonth: daysInMonth,
                    effectiveDays: effectiveDays,
                    totalExpenses: 0,
                    dailyAverage: 0,
                    budgetPerDay: 65000,
                    overBudgetDays: 0
                };
            }
            
            stats[monthYear].totalExpenses += parseInt(expense.amount);
        });
        
        Object.keys(stats).forEach(monthKey => {
            const stat = stats[monthKey];
            stat.dailyAverage = stat.totalExpenses / stat.effectiveDays;
            stat.overBudgetDays = Math.ceil(Math.max(0, stat.totalExpenses - (stat.budgetPerDay * stat.effectiveDays)) / stat.budgetPerDay);
        });
        
        setMonthlyStats(stats);
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle submit form tambah data baru
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.amount || !formData.description) {
            alert('Amount dan deskripsi harus diisi!');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wp-json/expenses/v1/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: formData.date,
                    amount: parseInt(formData.amount),
                    description: formData.description
                })
            });

            const result = await response.json();

            if (result.success) {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    description: ''
                });
                setShowAddModal(false);
                fetchExpenses();
            } else {
                throw new Error('Gagal menambah data');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    // Handle edit expense
    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setShowEditModal(true);
    };

    // Handle update expense
    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        
        if (!editingExpense.amount || !editingExpense.description) {
            alert('Amount dan deskripsi harus diisi!');
            return;
        }

        setSaving(true);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wp-json/expenses/v1/update/${editingExpense.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: editingExpense.date,
                    amount: parseInt(editingExpense.amount),
                    description: editingExpense.description
                })
            });

            const result = await response.json();

            if (result.success) {
                setShowEditModal(false);
                setEditingExpense(null);
                fetchExpenses();
            } else {
                throw new Error('Gagal mengupdate data');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle delete expense
    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;

        setDeletingId(expenseToDelete.id);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wp-json/expenses/v1/delete/${expenseToDelete.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                fetchExpenses();
            } else {
                throw new Error('Gagal menghapus data');
            }

        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(false);
            setExpenseToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setExpenseToDelete(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingExpense(null);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            amount: '',
            description: ''
        });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingExpense(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ FIX: Theme handlers dengan localStorage
    const handleThemeChange = (themeKey) => {
        console.log('🔄 Mengganti tema ke:', themeKey);
        setCurrentTheme(themeKey);
        setShowThemeSelector(false);
    };

    const toggleThemeSelector = () => {
        setShowThemeSelector(!showThemeSelector);
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    if (loading) {
        return (
            <div className={`expense-tracker ${themes[currentTheme].className}`}>
                <div className="loading">🔄 MEMUAT DATA...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`expense-tracker ${themes[currentTheme].className}`}>
                <div className="error">
                    ⚡ ERROR: {error}
                    <button onClick={fetchExpenses} className="retry-btn">
                        COBA LAGI
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`expense-tracker ${themes[currentTheme].className}`}>
            {/* Header dengan Theme Selector */}
            <header className="header">
                <div className="header-left">
                    <h1>💸 TRACKER UANG V1</h1>
                    <div className="theme-indicator">{themes[currentTheme].icon} {themes[currentTheme].name}</div>
                </div>
                <div className="header-right">
                    <button 
                        className="theme-toggle-btn"
                        onClick={toggleThemeSelector}
                        title="Ganti Tema"
                    >
                        🎨
                    </button>
                    <button 
                        className="add-floating-btn"
                        onClick={() => setShowAddModal(true)}
                        title="Tambah Data Baru"
                    >
                        +
                    </button>
                </div>
            </header>

            {/* Theme Selector Dropdown */}
            {showThemeSelector && (
                <div className="theme-selector-overlay">
                    <div ref={themeSelectorRef} className="theme-selector">
                        <div className="theme-selector-header">
                            <h3>PILIH TEMA</h3>
                            <button className="close-theme-btn" onClick={() => setShowThemeSelector(false)}>×</button>
                        </div>
                        <div className="theme-options">
                            {Object.entries(themes).map(([key, theme]) => (
                                <button
                                    key={key}
                                    className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                                    onClick={() => handleThemeChange(key)}
                                >
                                    <span className="theme-icon">{theme.icon}</span>
                                    <span className="theme-name">{theme.name}</span>
                                    {currentTheme === key && <span className="theme-check">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* List Expenses */}
            <main className="expense-list-container">
                <div className="expenses-scrollable">
                    {Object.keys(monthlyTotals)
                        .sort((a, b) => b.localeCompare(a))
                        .map(monthKey => (
                            <div key={monthKey} className="month-section">
                                <div className="month-header">
                                    <div className="month-title">
                                        <h3 className="month-name">📅 {monthlyTotals[monthKey].monthName.toUpperCase()}</h3>
                                        <div className="month-total">
                                            {formatCurrency(monthlyTotals[monthKey].total)}
                                        </div>
                                    </div>
                                    {monthlyStats[monthKey] && (
                                        <div className="month-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">RATA-RATA/HARI:</span>
                                                <span className="stat-value">{formatCurrency(monthlyStats[monthKey].dailyAverage)}</span>
                                            </div>
                                            <div className={`stat-item ${monthlyStats[monthKey].overBudgetDays > 0 ? 'over-budget' : 'under-budget'}`}>
                                                <span className="stat-label">STATUS BUDGET:</span>
                                                <span className="stat-value">
                                                    {monthlyStats[monthKey].overBudgetDays > 0 
                                                        ? `🚨 ${monthlyStats[monthKey].overBudgetDays} HARI BERHEMAT`
                                                        : '✅ AMAN'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="expenses-list">
                                    {monthlyTotals[monthKey].expenses
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((expense, index, array) => {
                                            const currentDate = expense.date.split('T')[0];
                                            const prevDate = index > 0 ? array[index - 1].date.split('T')[0] : null;
                                            const showDateSeparator = currentDate !== prevDate;
                                            
                                            return (
                                                <React.Fragment key={expense.id}>
                                                    {showDateSeparator && index > 0 && (
                                                        <div className="date-separator">⚡ {formatDate(expense.date).toUpperCase()} ⚡</div>
                                                    )}
                                                    {index === 0 && (
                                                        <div className="date-separator">⚡ {formatDate(expense.date).toUpperCase()} ⚡</div>
                                                    )}
                                                    <ExpenseItem 
                                                        expense={expense}
                                                        onEdit={handleEditClick}
                                                        onDelete={handleDeleteClick}
                                                        isDeleting={deletingId === expense.id}
                                                        formatDate={formatDate}
                                                        formatCurrency={formatCurrency}
                                                    />
                                                </React.Fragment>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        ))
                    }
                    
                    {Object.keys(monthlyTotals).length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">💸</div>
                            <p>BELUM ADA CATATAN PENGELUARAN</p>
                            <button 
                                className="add-first-btn"
                                onClick={() => setShowAddModal(true)}
                            >
                                + TAMBAH DATA PERTAMA
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Data Modal */}
            {showAddModal && (
                <AddModal 
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={closeAddModal}
                    formatCurrency={formatCurrency}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && expenseToDelete && (
                <DeleteConfirmation 
                    expense={expenseToDelete}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingExpense && (
                <EditModal 
                    expense={editingExpense}
                    onSave={handleUpdateExpense}
                    onCancel={closeEditModal}
                    onInputChange={handleEditInputChange}
                    saving={saving}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
};

// Komponen Expense Item
const ExpenseItem = ({ expense, onEdit, onDelete, isDeleting, formatDate, formatCurrency }) => {
    return (
        <div className={`expense-item ${isDeleting ? 'deleting' : ''}`}>
            <div 
                className="expense-left clickable"
                onClick={() => onEdit(expense)}
            >
                <div className="expense-desc">📝 {expense.description}</div>
                <div className="expense-date">🕒 {formatDate(expense.date)}</div>
            </div>
            <div className="expense-right">
                <div 
                    className="expense-amount clickable"
                    onClick={() => onEdit(expense)}
                >
                    {formatCurrency(parseInt(expense.amount))}
                </div>
                <button 
                    className="delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(expense);
                    }}
                    disabled={isDeleting}
                    title="Hapus"
                >
                    {isDeleting ? '⚡' : '🗑️'}
                </button>
            </div>
        </div>
    );
};

// Komponen Add Modal Baru
const AddModal = ({ formData, onInputChange, onSubmit, onCancel, formatCurrency }) => {
    return (
        <div className="modal-overlay">
            <div className="add-modal">
                <div className="add-header">
                    <h2>➕ TAMBAH DATA BARU</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                
                <form onSubmit={onSubmit} className="add-form">
                    <div className="form-group">
                        <label>📅 TANGGAL</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={onInputChange}
                            className="form-input"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>💰 JUMLAH PENGELUARAN</label>
                        <div className="amount-input-container">
                            <span className="currency-symbol">Rp</span>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={onInputChange}
                                className="form-input amount-input-large"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="amount-preview">
                            {formatCurrency(parseInt(formData.amount) || 0)}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>📝 DESKRIPSI</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={onInputChange}
                            className="form-input"
                            placeholder="Deskripsi pengeluaran"
                            required
                        />
                    </div>
                    
                    <div className="add-actions">
                        <button 
                            type="button" 
                            className="cancel-add-btn"
                            onClick={onCancel}
                        >
                            BATAL
                        </button>
                        <button 
                            type="submit" 
                            className="submit-add-btn"
                        >
                            💾 SIMPAN DATA
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Komponen Konfirmasi Hapus
const DeleteConfirmation = ({ expense, onConfirm, onCancel, formatDate, formatCurrency }) => {
    return (
        <div className="modal-overlay">
            <div className="delete-confirmation">
                <h3>🚨 HAPUS PENGELUARAN?</h3>
                <div className="delete-details">
                    <div className="delete-desc">{expense.description}</div>
                    <div className="delete-date">{formatDate(expense.date)}</div>
                    <div className="delete-amount">{formatCurrency(parseInt(expense.amount))}</div>
                </div>
                <p className="delete-warning">⚠️ DATA YANG DIHAPUS TIDAK DAPAT DIKEMBALIKAN</p>
                <div className="delete-actions">
                    <button className="cancel-btn" onClick={onCancel}>
                        BATAL
                    </button>
                    <button className="confirm-delete-btn" onClick={onConfirm}>
                        💥 HAPUS
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponen Modal Edit
const EditModal = ({ expense, onSave, onCancel, onInputChange, saving, formatCurrency }) => {
    return (
        <div className="modal-overlay">
            <div className="edit-modal">
                <div className="edit-header">
                    <h2>✏️ EDIT PENGELUARAN</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                
                <form onSubmit={onSave} className="edit-form">
                    <div className="form-group">
                        <label>📅 TANGGAL</label>
                        <input
                            type="date"
                            name="date"
                            value={expense.date}
                            onChange={onInputChange}
                            className="form-input"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>💰 JUMLAH PENGELUARAN</label>
                        <div className="amount-input-container">
                            <span className="currency-symbol">Rp</span>
                            <input
                                type="number"
                                name="amount"
                                value={expense.amount}
                                onChange={onInputChange}
                                className="form-input amount-input-large"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="amount-preview">
                            {formatCurrency(parseInt(expense.amount) || 0)}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>📝 DESKRIPSI</label>
                        <input
                            type="text"
                            name="description"
                            value={expense.description}
                            onChange={onInputChange}
                            className="form-input"
                            placeholder="Deskripsi pengeluaran"
                            required
                        />
                    </div>
                    
                    <div className="edit-actions">
                        <button 
                            type="button" 
                            className="cancel-edit-btn"
                            onClick={onCancel}
                            disabled={saving}
                        >
                            BATAL
                        </button>
                        <button 
                            type="submit" 
                            className="save-btn"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    MENYIMPAN...
                                </>
                            ) : (
                                '💾 SIMPAN PERUBAHAN'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseTracker;