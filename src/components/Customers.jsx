import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import CustomerBookingsModal from './CustomerBookingsModal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    totalOrders: 0,
    lastOrder: new Date().toISOString().split('T')[0]
  });
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);

  // Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('all'); // 'all' or 'single'
  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showReportView, setShowReportView] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Helper function to safely get number value
  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format number
  const formatCurrency = (value) => {
    const num = safeNumber(value);
    return num.toFixed(2);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all customers
      const customerSnapshot = await getDocs(collection(db, 'customers'));
      const customerList = customerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch all bookings
      const bookingsSnapshot = await getDocs(collection(db, 'Bookings'));
      const bookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAllBookings(bookings);

      // Map to store booking data by phone
      const bookingStatsByPhone = {};

      bookings.forEach(booking => {
        const phone = booking.phone;
        const createdAt = booking.createdAt?.seconds ? new Date(booking.createdAt.seconds * 1000) : null;

        if (!phone || !createdAt) return;

        if (!bookingStatsByPhone[phone]) {
          bookingStatsByPhone[phone] = {
            totalOrders: 1,
            lastOrder: createdAt
          };
        } else {
          bookingStatsByPhone[phone].totalOrders += 1;

          if (createdAt > bookingStatsByPhone[phone].lastOrder) {
            bookingStatsByPhone[phone].lastOrder = createdAt;
          }
        }
      });

      // Combine booking stats with customers
      const updatedCustomerList = customerList.map(customer => {
        const stats = bookingStatsByPhone[customer.phone];
        return {
          ...customer,
          totalOrders: stats?.totalOrders || 0,
          lastOrder: stats?.lastOrder
            ? stats.lastOrder.toISOString().split('T')[0]
            : '—'
        };
      });

      setCustomers(updatedCustomerList);
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveCustomer = async () => {
    if (isEditMode && newCustomer.phone !== editCustomerId) {
      await deleteDoc(doc(db, 'customers', editCustomerId));
    }

    const customerRef = doc(db, 'customers', newCustomer.phone);
    await setDoc(customerRef, newCustomer);

    setCustomers(prev => {
      const withoutOld = prev.filter(c => c.phone !== editCustomerId);
      return [...withoutOld, { ...newCustomer, id: newCustomer.phone }];
    });

    resetForm();
  };

  const openModal = (phone) => {
    setSelectedPhone(phone);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhone(null);
  };

  const resetForm = () => {
    setNewCustomer({
      name: '',
      phone: ''
    });
    setShowAddForm(false);
    setIsEditMode(false);
    setEditCustomerId(null);
  };

  // Report Functions
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return { bg: '#dcfce7', color: '#16a34a' };
      case 'in-progress': return { bg: '#fef9c3', color: '#ca8a04' };
      case 'ready': return { bg: '#dbeafe', color: '#2563eb' };
      case 'cancelled': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return { bg: '#dcfce7', color: '#16a34a' };
      case 'partial': return { bg: '#fef9c3', color: '#ca8a04' };
      case 'unpaid': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const generateReport = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    let filteredBookings = allBookings.filter(booking => {
      const bookingDate = booking.createdAt?.seconds 
        ? new Date(booking.createdAt.seconds * 1000) 
        : null;
      if (!bookingDate) return false;
      return bookingDate >= fromDate && bookingDate <= toDate;
    });

    let reportCustomers = [];

    if (reportType === 'single' && selectedCustomerForReport) {
      filteredBookings = filteredBookings.filter(b => b.phone === selectedCustomerForReport);
      const customer = customers.find(c => c.phone === selectedCustomerForReport);
      if (customer) {
        reportCustomers = [customer];
      }
    } else {
      reportCustomers = customers;
    }

    // Calculate statistics with safe number handling
    const totalOrders = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + safeNumber(b.grandTotal), 0);
    const totalPaid = filteredBookings.reduce((sum, b) => sum + safeNumber(b.totalPaid), 0);
    const totalDue = filteredBookings.reduce((sum, b) => sum + safeNumber(b.balanceDue), 0);
    const totalItems = filteredBookings.reduce((sum, b) => sum + safeNumber(b.totalItems), 0);

    const ordersByStatus = {
      'in-progress': filteredBookings.filter(b => b.status === 'in-progress').length,
      'ready': filteredBookings.filter(b => b.status === 'ready').length,
      'delivered': filteredBookings.filter(b => b.status === 'delivered').length,
      'cancelled': filteredBookings.filter(b => b.status === 'cancelled').length
    };

    const paymentStats = {
      paid: filteredBookings.filter(b => b.paymentStatus === 'paid').length,
      partial: filteredBookings.filter(b => b.paymentStatus === 'partial').length,
      unpaid: filteredBookings.filter(b => b.paymentStatus === 'unpaid').length
    };

    // Service breakdown
    const serviceBreakdown = {};
    filteredBookings.forEach(booking => {
      const service = booking.serviceType || 'Unknown';
      if (!serviceBreakdown[service]) {
        serviceBreakdown[service] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[service].count += 1;
      serviceBreakdown[service].revenue += safeNumber(booking.grandTotal);
    });

    // Customer-wise breakdown (for all customers report)
    const customerBreakdown = {};
    filteredBookings.forEach(booking => {
      const phone = booking.phone;
      if (!customerBreakdown[phone]) {
        const customer = customers.find(c => c.phone === phone);
        customerBreakdown[phone] = {
          name: customer?.name || booking.customerName || 'Unknown',
          phone: phone,
          orders: 0,
          revenue: 0,
          paid: 0,
          due: 0,
          items: 0
        };
      }
      customerBreakdown[phone].orders += 1;
      customerBreakdown[phone].revenue += safeNumber(booking.grandTotal);
      customerBreakdown[phone].paid += safeNumber(booking.totalPaid);
      customerBreakdown[phone].due += safeNumber(booking.balanceDue);
      customerBreakdown[phone].items += safeNumber(booking.totalItems);
    });

    setReportData({
      type: reportType,
      dateRange: { from: dateRange.from, to: dateRange.to },
      customers: reportCustomers,
      bookings: filteredBookings.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }),
      stats: {
        totalOrders,
        totalRevenue,
        totalPaid,
        totalDue,
        totalItems,
        ordersByStatus,
        paymentStats,
        serviceBreakdown,
        customerBreakdown: Object.values(customerBreakdown).sort((a, b) => b.revenue - a.revenue)
      }
    });

    setShowReportModal(false);
    setShowReportView(true);
  };

  const printReport = () => {
    const printContent = document.getElementById('report-content');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Customer Report - ${reportData.type === 'all' ? 'All Customers' : reportData.customers[0]?.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
            .report-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
            .report-title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 5px; }
            .report-subtitle { font-size: 14px; color: #6b7280; }
            .report-date { font-size: 12px; color: #9ca3af; margin-top: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: 700; color: #1f2937; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f9fafb; padding: 10px; text-align: left; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
            .badge-green { background: #dcfce7; color: #16a34a; }
            .badge-yellow { background: #fef9c3; color: #ca8a04; }
            .badge-blue { background: #dbeafe; color: #2563eb; }
            .badge-red { background: #fef2f2; color: #dc2626; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
            @media print {
              body { padding: 10px; }
              .stats-grid { grid-template-columns: repeat(4, 1fr); }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <script>
            setTimeout(function() { 
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const getServiceDisplayName = (serviceType) => {
    const serviceNames = {
      'stain-removal': 'Stain Removal',
      'ironing': 'Ironing',
      'wash-and-iron': 'Wash & Iron',
      'wash-and-fold': 'Wash & Fold',
      'starch-and-iron': 'Starch & Iron'
    };
    return serviceNames[serviceType] || serviceType?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown';
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid var(--gray-200)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--gray-800)'
            }}>Customer Management</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowReportModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f97316',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                📊 Generate Report
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
        
        {showAddForm && (
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--gray-200)',
            backgroundColor: 'var(--gray-50)'
          }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--gray-800)',
              marginBottom: '1rem'
            }}>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.6rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleInputChange}
                  style={{
                    width: '95%',
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '95%',
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--gray-300)',
                  color: 'var(--gray-700)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveCustomer}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {isEditMode ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </div>
        )}
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ backgroundColor: 'var(--gray-50)' }}>
              <tr>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Name</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Phone</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Total Orders</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Last Order</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} style={{
                  backgroundColor: 'white',
                  borderBottom: '1px solid var(--gray-200)'
                }}>
                  <td 
                    onClick={() => openModal(customer.phone)}
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--gray-900)',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}>{customer.name}</td>
                  <td 
                    onClick={() => openModal(customer.phone)}
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--gray-900)',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}>{customer.phone}</td>
                  <td 
                    onClick={() => openModal(customer.phone)}
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--gray-900)',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}>{customer.totalOrders}</td>
                  <td 
                    onClick={() => openModal(customer.phone)}
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--gray-900)',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}>{customer.lastOrder}</td>
                  <td style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportType('single');
                        setSelectedCustomerForReport(customer.phone);
                        setShowReportModal(true);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      📄 Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Configuration Modal */}
      {showReportModal && (
        <div 
          onClick={() => setShowReportModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                Generate Report
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-400)' }}
              >×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Report Type */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>Report Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setReportType('all'); setSelectedCustomerForReport(''); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${reportType === 'all' ? 'var(--primary)' : 'var(--gray-200)'}`,
                      backgroundColor: reportType === 'all' ? 'var(--secondary)' : 'white',
                      color: reportType === 'all' ? 'var(--primary)' : 'var(--gray-600)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    👥 All Customers
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('single')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${reportType === 'single' ? 'var(--primary)' : 'var(--gray-200)'}`,
                      backgroundColor: reportType === 'single' ? 'var(--secondary)' : 'white',
                      color: reportType === 'single' ? 'var(--primary)' : 'var(--gray-600)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    👤 Single Customer
                  </button>
                </div>
              </div>

              {/* Customer Selection (for single customer report) */}
              {reportType === 'single' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: '0.5rem'
                  }}>Select Customer</label>
                  <select
                    value={selectedCustomerForReport}
                    onChange={(e) => setSelectedCustomerForReport(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.phone}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>Date Range</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>From</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>To</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setDateRange({
                      from: new Date().toISOString().split('T')[0],
                      to: new Date().toISOString().split('T')[0]
                    })}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >Today</button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      setDateRange({
                        from: weekAgo.toISOString().split('T')[0],
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >Last 7 Days</button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(today.getMonth() - 1);
                      setDateRange({
                        from: monthAgo.toISOString().split('T')[0],
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >Last 30 Days</button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const yearStart = new Date(today.getFullYear(), 0, 1);
                      setDateRange({
                        from: yearStart.toISOString().split('T')[0],
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >This Year</button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateRange({
                        from: '2020-01-01',
                        to: new Date().toISOString().split('T')[0]
                      });
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      backgroundColor: 'white',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >All Time</button>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'white',
                  color: 'var(--gray-700)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >Cancel</button>
              <button
                onClick={generateReport}
                disabled={reportType === 'single' && !selectedCustomerForReport}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: reportType === 'single' && !selectedCustomerForReport ? 'var(--gray-300)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: reportType === 'single' && !selectedCustomerForReport ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >Generate Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Report View Modal */}
      {showReportView && reportData && (
        <div 
          onClick={() => setShowReportView(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 1000,
            padding: '2rem',
            overflowY: 'auto'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '1000px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              marginBottom: '2rem'
            }}
          >
            {/* Report Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                  {reportData.type === 'all' ? 'All Customers Report' : `Customer Report: ${reportData.customers[0]?.name || 'Unknown'}`}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  {formatDate(reportData.dateRange.from)} - {formatDate(reportData.dateRange.to)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={printReport}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--gray-800)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >🖨️ Print</button>
                <button 
                  onClick={() => setShowReportView(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-400)' }}
                >×</button>
              </div>
            </div>

            {/* Report Content */}
            <div id="report-content" style={{ padding: '1.5rem' }}>
              {/* Print Header (hidden on screen, visible when printing) */}
              <div className="report-header" style={{ display: 'none' }}>
                <div className="report-title">
                  {reportData.type === 'all' ? 'All Customers Report' : `Customer Report: ${reportData.customers[0]?.name || 'Unknown'}`}
                </div>
                <div className="report-subtitle">
                  {reportData.type === 'single' && `Phone: ${reportData.customers[0]?.phone || ''}`}
                </div>
                <div className="report-date">
                  Period: {formatDate(reportData.dateRange.from)} - {formatDate(reportData.dateRange.to)}
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid var(--gray-200)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-800)' }}>
                    {reportData.stats.totalOrders}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Total Orders</div>
                </div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #86efac',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                    ₹{formatCurrency(reportData.stats.totalRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>Total Revenue</div>
                </div>
                <div style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #bfdbfe',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                    ₹{formatCurrency(reportData.stats.totalPaid)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.25rem' }}>Total Collected</div>
                </div>
                <div style={{
                  backgroundColor: safeNumber(reportData.stats.totalDue) > 0 ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: `1px solid ${safeNumber(reportData.stats.totalDue) > 0 ? '#fecaca' : '#86efac'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: safeNumber(reportData.stats.totalDue) > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{formatCurrency(reportData.stats.totalDue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: safeNumber(reportData.stats.totalDue) > 0 ? '#b91c1c' : '#15803d', marginTop: '0.25rem' }}>Balance Due</div>
                </div>
              </div>

              {/* Order Status & Payment Status */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* Order Status */}
                <div style={{
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid var(--gray-200)'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-700)' }}>Order Status</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef9c3', color: '#ca8a04', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      In Progress: {reportData.stats.ordersByStatus['in-progress'] || 0}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Ready: {reportData.stats.ordersByStatus['ready'] || 0}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Delivered: {reportData.stats.ordersByStatus['delivered'] || 0}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Cancelled: {reportData.stats.ordersByStatus['cancelled'] || 0}
                    </span>
                  </div>
                </div>

                {/* Payment Status */}
                <div style={{
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid var(--gray-200)'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-700)' }}>Payment Status</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Paid: {reportData.stats.paymentStats.paid || 0}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef9c3', color: '#ca8a04', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Partial: {reportData.stats.paymentStats.partial || 0}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                      Unpaid: {reportData.stats.paymentStats.unpaid || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Breakdown */}
              {reportData.stats.serviceBreakdown && Object.keys(reportData.stats.serviceBreakdown).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--gray-800)' }}>Service Breakdown</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Service</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Orders</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.stats.serviceBreakdown).map(([service, data]) => (
                          <tr key={service} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '0.625rem 1rem' }}>{getServiceDisplayName(service)}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>{data.count || 0}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500' }}>₹{formatCurrency(data.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Customer Breakdown (for all customers report) */}
              {reportData.type === 'all' && reportData.stats.customerBreakdown && reportData.stats.customerBreakdown.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                    Customer Breakdown (Top {Math.min(10, reportData.stats.customerBreakdown.length)})
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Customer</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Orders</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Items</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Revenue</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Paid</th>
                          <th style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.stats.customerBreakdown.slice(0, 10).map((customer, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '0.625rem 1rem' }}>
                              <div style={{ fontWeight: '500' }}>{customer.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{customer.phone || ''}</div>
                            </td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>{customer.orders || 0}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>{safeNumber(customer.items).toFixed(1)}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: '500' }}>₹{formatCurrency(customer.revenue)}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'right', color: '#16a34a' }}>₹{formatCurrency(customer.paid)}</td>
                            <td style={{ padding: '0.625rem 1rem', textAlign: 'right', color: safeNumber(customer.due) > 0 ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                              ₹{formatCurrency(customer.due)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                  Order Details ({reportData.bookings?.length || 0} orders)
                </h4>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--gray-50)' }}>
                      <tr>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Order ID</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Date</th>
                        {reportData.type === 'all' && (
                          <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Customer</th>
                        )}
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Service</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Items</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Status</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Total</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '500', color: 'var(--gray-600)', borderBottom: '1px solid var(--gray-200)' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.bookings && reportData.bookings.length > 0 ? (
                        reportData.bookings.map((booking) => {
                          const statusStyle = getStatusColor(booking.status);
                          const paymentStyle = getPaymentStatusColor(booking.paymentStatus);
                          return (
                            <tr key={booking.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                              <td style={{ padding: '0.625rem 0.75rem', fontWeight: '600', color: 'var(--primary)' }}>#{booking.id}</td>
                              <td style={{ padding: '0.625rem 0.75rem' }}>
                                {booking.createdAt?.seconds 
                                  ? formatDate(new Date(booking.createdAt.seconds * 1000).toISOString().split('T')[0])
                                  : '—'
                                }
                              </td>
                              {reportData.type === 'all' && (
                                <td style={{ padding: '0.625rem 0.75rem' }}>
                                  <div style={{ fontWeight: '500' }}>{booking.customerName || 'Unknown'}</div>
                                </td>
                              )}
                              <td style={{ padding: '0.625rem 0.75rem' }}>{getServiceDisplayName(booking.serviceType)}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{safeNumber(booking.totalItems).toFixed(1)}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: '500',
                                  textTransform: 'capitalize'
                                }}>{booking.status || 'Unknown'}</span>
                              </td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: '500' }}>₹{formatCurrency(booking.grandTotal)}</td>
                              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: paymentStyle.bg,
                                  color: paymentStyle.color,
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: '500',
                                  textTransform: 'capitalize'
                                }}>{booking.paymentStatus || 'Unknown'}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={reportData.type === 'all' ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            No orders found for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Bookings Modal */}
      {showModal && (
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '70px',
            paddingBottom: '40px',
            zIndex: 1000,
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '900px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              marginBottom: '40px',
              pointerEvents: 'auto'
            }}
          >
            <CustomerBookingsModal phone={selectedPhone} onClose={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;