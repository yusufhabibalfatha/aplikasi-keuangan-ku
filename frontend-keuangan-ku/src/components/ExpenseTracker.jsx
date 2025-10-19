import React, { useState, useEffect } from 'react';
import '../style/ExpenseTracker.css';

const ExpenseTracker = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthlyTotals, setMonthlyTotals] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // State untuk form input
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
    });

    // Format currency ke Rupiah
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Format tanggal ke Indonesia
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
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

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingExpense(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    if (loading) {
        return (
            <div className="expense-tracker">
                <div className="loading">Memuat data...</div>
                <FormInput 
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    disabled={true}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="expense-tracker">
                <div className="error">
                    Error: {error}
                    <button onClick={fetchExpenses} className="retry-btn">
                        Coba Lagi
                    </button>
                </div>
                <FormInput 
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    disabled={true}
                />
            </div>
        );
    }

    return (
        <div className="expense-tracker">
            {/* Header Simple */}
            <header className="simple-header">
                <h1>💰 Catatan Keuangan</h1>
            </header>

            {/* List Expenses - Scrollable */}
            <main className="expense-list-container">
                <div className="expenses-scrollable">
                    {Object.keys(monthlyTotals)
                        .sort((a, b) => b.localeCompare(a))
                        .map(monthKey => (
                            <div key={monthKey} className="month-section">
                                <div className="month-header">
                                    <h3>{monthlyTotals[monthKey].monthName}</h3>
                                    <div className="month-total">
                                        {formatCurrency(monthlyTotals[monthKey].total)}
                                    </div>
                                </div>
                                
                                <div className="expenses-list">
                                    {monthlyTotals[monthKey].expenses
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(expense => (
                                            <ExpenseItem 
                                                key={expense.id}
                                                expense={expense}
                                                onEdit={handleEditClick}
                                                onDelete={handleDeleteClick}
                                                isDeleting={deletingId === expense.id}
                                                formatDate={formatDate}
                                                formatCurrency={formatCurrency}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    }
                    
                    {Object.keys(monthlyTotals).length === 0 && (
                        <div className="empty-state">
                            <p>Belum ada catatan pengeluaran</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Form Input - Sticky di bawah */}
            <FormInput 
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                disabled={false}
            />

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

// Komponen Expense Item dengan Edit dan Delete Button
const ExpenseItem = ({ expense, onEdit, onDelete, isDeleting, formatDate, formatCurrency }) => {
    return (
        <div className={`expense-item-simple ${isDeleting ? 'deleting' : ''}`}>
            <div 
                className="expense-left clickable"
                onClick={() => onEdit(expense)}
            >
                <div className="expense-desc">{expense.description}</div>
                <div className="expense-date">{formatDate(expense.date)}</div>
            </div>
            <div className="expense-right">
                <div 
                    className="expense-amount-simple clickable"
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
                    {isDeleting ? '⋯' : '🗑️'}
                </button>
            </div>
        </div>
    );
};

// Komponen Form Input yang Sticky
const FormInput = ({ formData, onInputChange, onSubmit, disabled }) => {
    return (
        <footer className="form-container">
            <form onSubmit={onSubmit} className="expense-form">
                <div className="form-row">
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={onInputChange}
                        className="form-input date-input"
                        disabled={disabled}
                    />
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={onInputChange}
                        placeholder="Jumlah"
                        className="form-input amount-input"
                        disabled={disabled}
                    />
                </div>
                <div className="form-row">
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={onInputChange}
                        placeholder="Deskripsi pengeluaran"
                        className="form-input desc-input"
                        disabled={disabled}
                    />
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={disabled}
                    >
                        ✓
                    </button>
                </div>
            </form>
        </footer>
    );
};

// Komponen Konfirmasi Hapus
const DeleteConfirmation = ({ expense, onConfirm, onCancel, formatDate, formatCurrency }) => {
    return (
        <div className="modal-overlay">
            <div className="delete-confirmation">
                <h3>Hapus Pengeluaran?</h3>
                <div className="delete-details">
                    <div className="delete-desc">{expense.description}</div>
                    <div className="delete-date">{formatDate(expense.date)}</div>
                    <div className="delete-amount">{formatCurrency(parseInt(expense.amount))}</div>
                </div>
                <p className="delete-warning">Data yang dihapus tidak dapat dikembalikan</p>
                <div className="delete-actions">
                    <button className="cancel-btn" onClick={onCancel}>
                        Batal
                    </button>
                    <button className="confirm-delete-btn" onClick={onConfirm}>
                        Ya, Hapus
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
                    <h2>✏️ Edit Pengeluaran</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                
                <form onSubmit={onSave} className="edit-form">
                    <div className="form-group">
                        <label>Tanggal</label>
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
                        <label>Jumlah Pengeluaran</label>
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
                        <label>Deskripsi</label>
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
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            className="save-btn"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                '💾 Simpan Perubahan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseTracker;