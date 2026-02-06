import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import sareeimg from '../assets/saree.png';
import coat from '../assets/coat.png';
import dbed from '../assets/dbedsheet.png';
import sbed from '../assets/sbedsheet.png';
import dhotar from '../assets/dhotar.png';
import sherwani from '../assets/sherwani.png';
import shirt from '../assets/shirt.png';
import tshirt from '../assets/tshirt.png';
import starch from '../assets/starch.png';
import sweater from '../assets/sweter.png';
import pant from '../assets/pants.png';
import blouse from '../assets/blouse.png';
import punjabi from '../assets/Punjabi.png';
import shalu from '../assets/shalu.png';
import onepiece from '../assets/lehenga.png';
import shoes from '../assets/shoes.png';
import helmet from '../assets/helmet.png';
import clothsperkg from '../assets/clothsperkg.png';

// Toast Notification Component
const Toast = ({ message, type, onClose, details }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, type === 'success' ? 4000 : 5000);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconBg: '#16a34a' };
      case 'error':
        return { bg: '#fef2f2', border: '#fecaca', icon: '!', iconBg: '#dc2626' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fde68a', icon: '⚠', iconBg: '#f59e0b' };
      default:
        return { bg: '#eff6ff', border: '#bfdbfe', icon: 'i', iconBg: '#3b82f6' };
    }
  };

  const styles = getStyles();

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 99999,
      animation: 'slideIn 0.3s ease-out',
      maxWidth: '400px',
      width: '100%'
    }}>
      <div style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: styles.iconBg,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '700',
            flexShrink: 0
          }}>
            {styles.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-800)' }}>{message}</p>
            {details && details.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', padding: '0 0 0 1rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                {details.map((detail, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '1.25rem', padding: '0', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ height: '3px', backgroundColor: styles.iconBg, animation: `shrink ${type === 'success' ? '4s' : '5s'} linear forwards` }}></div>
      </div>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

// Success Modal Component with Tag Generation
const SuccessModal = ({ 
  bookingId, 
  customerName, 
  grandTotal, 
  totalPaid, 
  balanceDue, 
  paymentMethod, 
  onClose,
  formData,
  selectedItems,
  formatDate,
  getFullServiceName,
  getClothDisplayName
}) => {
  const [showTagSection, setShowTagSection] = useState(false);
  const [selectedTagItems, setSelectedTagItems] = useState(selectedItems.map(i => i.id));

  const toggleTagItem = (itemId) => {
    setSelectedTagItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handlePrintTags = () => {
    const selectedItemsData = selectedItems.filter(item => selectedTagItems.includes(item.id));
    if (selectedItemsData.length === 0) return;
    
    const totalTokens = selectedItemsData.reduce((sum, item) => sum + Math.ceil(item.quantity), 0);
    let currentToken = 0;
    let tagsHTML = '';
    
    selectedItemsData.forEach((item) => {
      const itemQty = Math.ceil(item.quantity);
      for (let i = 0; i < itemQty; i++) {
        currentToken++;
        tagsHTML += `
          <div class="tag">
            <div class="tag-content">
              <div class="order-id">#${bookingId}</div>
              <div class="customer-name">${customerName}</div>
              <div class="service-row">
                <span class="service-name">${getFullServiceName(formData.serviceType)}</span>
                <span class="token-number">${currentToken}/${totalTokens}</span>
              </div>
              <div class="pickup-date">${formatDate(formData.pickupDate)}</div>
              <div class="garment-name">${getClothDisplayName(item.id)}</div>
              <div class="delivery-date">${formatDate(formData.deliveryDate)}</div>
              ${formData.urgentDelivery ? '<div class="urgent-badge">🚀 URGENT</div>' : ''}
            </div>
          </div>
        `;
      }
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Order #${bookingId} Tags</title>
          <style>
            @page { size: 80mm 50mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            .tag { width: 80mm; height: 50mm; border: 2px solid #333; border-radius: 5px; display: flex; align-items: center; justify-content: center; page-break-after: always; background-color: white; }
            .tag:last-child { page-break-after: auto; }
            .tag-content { width: 100%; height: 100%; padding: 3.5mm 3mm; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
            .order-id { font-weight: 900; font-size: 1.8rem; text-align: center; }
            .customer-name { font-size: 1.1rem; font-weight: 700; }
            .service-row { width: 100%; display: flex; justify-content: center; align-items: center; font-size: 1.05rem; font-weight: 800; position: relative; }
            .token-number { position: absolute; right: 1mm; font-size: 0.9rem; }
            .pickup-date, .delivery-date { font-size: 0.95rem; font-weight: 700; color: #444; }
            .garment-name { font-size: 1rem; font-weight: 800; }
            .urgent-badge { color: #dc2626; font-weight: 900; font-size: 0.9rem; }
          </style>
        </head>
        <body>${tagsHTML}<script>setTimeout(()=>{window.print();setTimeout(()=>window.close(),500);},300);</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'scaleIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!showTagSection ? (
          <>
            <div style={{ backgroundColor: '#f0fdf4', padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#16a34a',
                margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'checkmark 0.5s ease-out 0.2s both'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 style={{ margin: '1rem 0 0.25rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-800)' }}>Booking Created!</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>Order has been successfully placed</p>
            </div>
            <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
              <div style={{ backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--gray-300)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Order ID</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace' }}>#{bookingId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Customer</span>
                  <span style={{ fontWeight: '500', color: 'var(--gray-800)' }}>{customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Total Amount</span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Paid</span>
                  <span style={{ fontWeight: '500', color: '#16a34a' }}>₹{totalPaid.toFixed(2)}</span>
                </div>
                {balanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Balance Due</span>
                    <span style={{ fontWeight: '500', color: '#dc2626' }}>₹{balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: totalPaid >= grandTotal ? '#dcfce7' : totalPaid > 0 ? '#fef9c3' : '#fef2f2',
                  color: totalPaid >= grandTotal ? '#16a34a' : totalPaid > 0 ? '#ca8a04' : '#dc2626'
                }}>
                  {totalPaid >= grandTotal ? '✓ Fully Paid' : totalPaid > 0 ? '◐ Partial Payment' : '○ Payment Pending'}
                  {paymentMethod !== 'pending' && ` • ${paymentMethod === 'split' ? 'Cash + Online' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => setShowTagSection(true)} 
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🏷️ Print Tags
                </button>
                <button 
                  onClick={onClose} 
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tag Generation Section */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              backgroundColor: 'var(--gray-50)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                  🏷️ Print Tags
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Order #{bookingId}
                </p>
              </div>
              <button
                onClick={() => setShowTagSection(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  fontSize: '1.25rem',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Select items to print tags (80mm × 50mm format):
              </p>
              
              <div style={{
                maxHeight: '250px',
                overflowY: 'auto',
                border: '1px solid var(--gray-200)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                backgroundColor: 'white'
              }}>
                {selectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderBottom: index < selectedItems.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      backgroundColor: selectedTagItems.includes(item.id) ? 'var(--secondary)' : 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => toggleTagItem(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagItems.includes(item.id)}
                      onChange={() => toggleTagItem(item.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        Qty: {item.quantity} → {Math.ceil(item.quantity)} tag(s)
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'var(--gray-100)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--gray-600)'
                    }}>
                      {Math.ceil(item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setSelectedTagItems(selectedItems.map(i => i.id))}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    backgroundColor: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedTagItems([])}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    backgroundColor: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--gray-200)',
              backgroundColor: 'var(--gray-50)',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowTagSection(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)'
                }}
              >
                ← Back
              </button>
              {selectedTagItems.length > 0 && (
                <button
                  onClick={handlePrintTags}
                  style={{
                    flex: 1.5,
                    padding: '0.75rem',
                    backgroundColor: 'var(--gray-800)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  🖨️ Print {selectedItems.filter(item => selectedTagItems.includes(item.id)).reduce((sum, item) => sum + Math.ceil(item.quantity), 0)} Tags
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes checkmark { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

// Checkout Modal Component with Tabs and Real-time Updates
const CheckoutModal = ({
  isOpen,
  onClose,
  formData,
  totalItems,
  totalCost,
  gstConfig,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  cashAmount,
  setCashAmount,
  onlineAmount,
  setOnlineAmount,
  onConfirm,
  isSubmitting
}) => {
  const [activeTab, setActiveTab] = useState('discount');
  
  if (!isOpen) return null;

  // Real-time calculations
  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = totalCost * (discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, totalCost);
    }
  }
  const afterDiscount = totalCost - discountAmount;
  let sgst = 0, cgst = 0, grandTotal = afterDiscount;
  if (gstConfig.enabled) {
    sgst = afterDiscount * (gstConfig.sgstPercentage / 100);
    cgst = afterDiscount * (gstConfig.cgstPercentage / 100);
    grandTotal = afterDiscount + sgst + cgst;
  }
  const totalPaid = cashAmount + onlineAmount;
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const handleClose = () => {
    setActiveTab('discount');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99998,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'scaleIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          backgroundColor: 'var(--gray-50)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                Checkout
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {formData.customerName} • {totalItems} items
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)',
                fontSize: '1.5rem',
                padding: '0.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Real-time Summary Banner */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f0fdf4',
          borderBottom: '1px solid #86efac',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
              Grand Total
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
              ₹{grandTotal.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {discountAmount > 0 && (
              <div style={{
                backgroundColor: '#dcfce7',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#16a34a',
                marginBottom: '0.25rem'
              }}>
                Save ₹{discountAmount.toFixed(2)}
              </div>
            )}
            {totalPaid > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                Paid: ₹{totalPaid.toFixed(2)} | Due: ₹{balanceDue.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--gray-200)',
          backgroundColor: 'white'
        }}>
          {[
            { id: 'discount', label: '🏷️ Discount' },
            { id: 'payment', label: '💳 Payment' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.875rem 0.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-500)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          
          {/* Discount Tab */}
          {activeTab === 'discount' && (
            <div>
              {/* Subtotal Display */}
              <div style={{
                backgroundColor: 'var(--gray-50)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Subtotal ({totalItems} items)</span>
                  <span style={{ fontWeight: '600' }}>₹{totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Type Toggle */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Discount Type
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('percentage'); setDiscountValue(0); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      border: `2px solid ${discountType === 'percentage' ? 'var(--primary)' : 'var(--gray-200)'}`,
                      backgroundColor: discountType === 'percentage' ? 'var(--secondary)' : 'white',
                      color: discountType === 'percentage' ? 'var(--primary)' : 'var(--gray-600)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('fixed'); setDiscountValue(0); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      border: `2px solid ${discountType === 'fixed' ? 'var(--primary)' : 'var(--gray-200)'}`,
                      backgroundColor: discountType === 'fixed' ? 'var(--secondary)' : 'white',
                      color: discountType === 'fixed' ? 'var(--primary)' : 'var(--gray-600)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    ₹ Fixed Amount
                  </button>
                </div>
              </div>

              {/* Discount Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                </label>
                <div style={{ position: 'relative' }}>
                  {discountType === 'fixed' && (
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                      fontSize: '1.125rem',
                      fontWeight: '500'
                    }}>₹</span>
                  )}
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value) || 0;
                      if (discountType === 'percentage') val = Math.min(100, Math.max(0, val));
                      else val = Math.min(totalCost, Math.max(0, val));
                      setDiscountValue(val);
                    }}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      paddingLeft: discountType === 'fixed' ? '2.25rem' : '1rem',
                      paddingRight: discountType === 'percentage' ? '2.5rem' : '1rem',
                      border: '2px solid var(--gray-200)',
                      borderRadius: '0.5rem',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      outline: 'none',
                      textAlign: 'center',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                    min="0"
                  />
                  {discountType === 'percentage' && (
                    <span style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                      fontSize: '1.125rem',
                      fontWeight: '500'
                    }}>%</span>
                  )}
                </div>
              </div>

              {/* Live Price Breakdown */}
              <div style={{
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Subtotal</span>
                  <span>₹{totalCost.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#16a34a' }}>
                    <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                    <span>- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {gstConfig.enabled && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      <span>SGST ({gstConfig.sgstPercentage}%)</span>
                      <span>₹{sgst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      <span>CGST ({gstConfig.cgstPercentage}%)</span>
                      <span>₹{cgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid var(--gray-300)',
                  fontSize: '1.125rem',
                  fontWeight: '700'
                }}>
                  <span style={{ color: 'var(--gray-800)' }}>Grand Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div>
              {/* Amount to Collect */}
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}>
                <span style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount to Collect</span>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#92400e', marginTop: '0.25rem' }}>
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Payment Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    💵 Cash
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                      fontSize: '1rem'
                    }}>₹</span>
                    <input
                      type="number"
                      value={cashAmount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setCashAmount(Math.min(val, grandTotal - onlineAmount));
                      }}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingLeft: '2rem',
                        border: '2px solid var(--gray-200)',
                        borderRadius: '0.5rem',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    📱 Online
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                      fontSize: '1rem'
                    }}>₹</span>
                    <input
                      type="number"
                      value={onlineAmount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setOnlineAmount(Math.min(val, grandTotal - cashAmount));
                      }}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingLeft: '2rem',
                        border: '2px solid var(--gray-200)',
                        borderRadius: '0.5rem',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Payment Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setCashAmount(grandTotal); setOnlineAmount(0); }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: `2px solid ${cashAmount === grandTotal && onlineAmount === 0 ? '#16a34a' : 'var(--gray-200)'}`,
                    backgroundColor: cashAmount === grandTotal && onlineAmount === 0 ? '#f0fdf4' : 'white',
                    color: cashAmount === grandTotal && onlineAmount === 0 ? '#16a34a' : 'var(--gray-600)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  💵 Full Cash
                </button>
                <button
                  type="button"
                  onClick={() => { setOnlineAmount(grandTotal); setCashAmount(0); }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: `2px solid ${onlineAmount === grandTotal && cashAmount === 0 ? '#2563eb' : 'var(--gray-200)'}`,
                    backgroundColor: onlineAmount === grandTotal && cashAmount === 0 ? '#eff6ff' : 'white',
                    color: onlineAmount === grandTotal && cashAmount === 0 ? '#2563eb' : 'var(--gray-600)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  📱 Full Online
                </button>
                <button
                  type="button"
                  onClick={() => { setCashAmount(0); setOnlineAmount(0); }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: `2px solid ${cashAmount === 0 && onlineAmount === 0 ? '#dc2626' : 'var(--gray-200)'}`,
                    backgroundColor: cashAmount === 0 && onlineAmount === 0 ? '#fef2f2' : 'white',
                    color: cashAmount === 0 && onlineAmount === 0 ? '#dc2626' : 'var(--gray-600)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  ⏳ Pay Later
                </button>
              </div>

              {/* Live Payment Summary */}
              <div style={{
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '1px solid var(--gray-200)'
              }}>
                {cashAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--gray-600)' }}>💵 Cash Received</span>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>₹{cashAmount.toFixed(2)}</span>
                  </div>
                )}
                {onlineAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--gray-600)' }}>📱 Online Received</span>
                    <span style={{ color: '#2563eb', fontWeight: '600' }}>₹{onlineAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  marginTop: '0.25rem',
                  borderTop: '2px solid var(--gray-300)',
                  fontSize: '1rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Total Paid</span>
                  <span style={{ fontWeight: '700', color: '#16a34a' }}>₹{totalPaid.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  fontSize: '1rem',
                  padding: '0.625rem',
                  backgroundColor: balanceDue > 0 ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '0.375rem'
                }}>
                  <span style={{ fontWeight: '600', color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>Balance Due</span>
                  <span style={{ fontWeight: '700', color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>₹{balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--gray-200)',
          backgroundColor: 'var(--gray-50)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              border: '1px solid var(--gray-300)',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: 'var(--gray-700)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{
              flex: 1.5,
              padding: '0.875rem',
              backgroundColor: isSubmitting ? 'var(--gray-400)' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            {isSubmitting ? 'Creating...' : '✓ Confirm Booking'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

const Booking = () => {
  const imageMap = {
    shirt, tshirt, pant, starch, saree: sareeimg, blouse, panjabi: punjabi,
    dhotar, shalu, coat, shervani: sherwani, sweater, onepiece, 
    bedsheet: sbed, blanket: dbed, shoes, helmet, clothsPerKg: clothsperkg
  };

  const itemMapping = {
    shirt: 'Shirt',
    tshirt: 'T-Shirt',
    pant: 'Pant',
    starch: 'Starch Cloth',
    saree: 'Saree',
    blouse: 'Blouse',
    panjabi: 'Panjabi Suit',
    dhotar: 'Dhotar',
    shalu: 'Shalu / Paithani',
    coat: 'Coat / Blazer',
    shervani: 'Shervani',
    sweater: 'Sweater / Jerkin',
    onepiece: 'One Piece Ghagara',
    bedsheet: 'Bedsheet (Single/Double)',
    blanket: 'Blanket / Rajai',
    shoes: 'Shoes Washing',
    helmet: 'Helmet Washing',
    clothsPerKg: 'Cloths Per Kg'
  };

  const defaultIcon = shirt;

  const [toast, setToast] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState(false);

  const showToast = (message, type = 'info', details = []) => {
    setToast({ message, type, details });
  };

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    serviceType: '',
    urgentDelivery: false,
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    instructions: '',
    items: {}
  });

  const [servicePrices, setServicePrices] = useState({});
  const [clothingItems, setClothingItems] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [gstConfig, setGstConfig] = useState({
    enabled: true,
    sgstPercentage: 9,
    cgstPercentage: 9
  });
  const [loading, setLoading] = useState(true);

  const [allCustomers, setAllCustomers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);

  // Store form data for success modal
  const [lastBookingFormData, setLastBookingFormData] = useState(null);
  const [lastBookingSelectedItems, setLastBookingSelectedItems] = useState([]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = days[date.getDay()];
    return `${day} ${month} ${year} ${dayOfWeek}`;
  };

  const getFullServiceName = (serviceType) => {
    const serviceNames = {
      'stain-removal': 'Stain Removal',
      'ironing': 'Ironing',
      'wash-and-iron': 'Wash & Iron',
      'wash-and-fold': 'Wash & Fold',
      'starch-and-iron': 'Starch & Iron'
    };
    return serviceNames[serviceType] || serviceType?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || '';
  };

  const getClothDisplayName = (itemKey) => {
    return itemMapping[itemKey] || itemKey?.charAt(0).toUpperCase() + itemKey?.slice(1) || '';
  };

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const customers = [];
        customersSnapshot.forEach(doc => {
          customers.push({ id: doc.id, ...doc.data() });
        });
        setAllCustomers(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchAllCustomers();
  }, []);

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const gstDoc = await getDoc(doc(db, "settings", "gstConfig"));
        if (gstDoc.exists()) {
          setGstConfig(gstDoc.data());
        }

        const serviceDoc = await getDoc(doc(db, "settings", "serviceConfig"));
        let services = {};
        let serviceList = [];

        if (serviceDoc.exists()) {
          const data = serviceDoc.data();
          services = data.prices || {};
          serviceList = data.serviceTypes || [];
        } else {
          services = {
            "stain-removal": { shirt: 100, tshirt: 100, pant: 100, starch: 120, saree: 250, blouse: 80, panjabi: 250, dhotar: 200, shalu: 350, coat: 400, shervani: 400, sweater: 180, onepiece: 250, bedsheet: 180, blanket: 450, shoes: 250, helmet: 250, clothsPerKg: 120 },
            "ironing": { shirt: 12, tshirt: 12, pant: 12, starch: 30, saree: 80, blouse: 12, panjabi: 36, dhotar: 80, shalu: 120, coat: 150, shervani: 120, sweater: 50, onepiece: 60, bedsheet: 60, blanket: 0, shoes: 0, helmet: 0, clothsPerKg: 0 },
            "wash-and-iron": { shirt: 70, tshirt: 70, pant: 70, starch: 80, saree: 200, blouse: 70, panjabi: 210, dhotar: 180, shalu: 280, coat: 300, shervani: 320, sweater: 150, onepiece: 200, bedsheet: 150, blanket: 400, shoes: 200, helmet: 200, clothsPerKg: 99 },
            "wash-and-fold": { shirt: 60, tshirt: 60, pant: 60, starch: 70, saree: 180, blouse: 60, panjabi: 190, dhotar: 160, shalu: 250, coat: 280, shervani: 300, sweater: 130, onepiece: 180, bedsheet: 130, blanket: 350, shoes: 0, helmet: 0, clothsPerKg: 89 },
            "starch-and-iron": { shirt: 80, tshirt: 80, pant: 80, starch: 90, saree: 220, blouse: 80, panjabi: 230, dhotar: 200, shalu: 300, coat: 320, shervani: 340, sweater: 170, onepiece: 220, bedsheet: 170, blanket: 420, shoes: 0, helmet: 0, clothsPerKg: 0 }
          };

          serviceList = [
            { id: "stain-removal", name: "Stain Removal Treatment", enabled: true },
            { id: "ironing", name: "Ironing", enabled: true },
            { id: "wash-and-iron", name: "Wash & Iron", enabled: true },
            { id: "wash-and-fold", name: "Wash & Fold", enabled: true },
            { id: "starch-and-iron", name: "Starch & Iron", enabled: true }
          ];

          await setDoc(doc(db, "settings", "serviceConfig"), { prices: services, serviceTypes: serviceList });
        }

        setServicePrices(services);
        setAvailableServices(serviceList.filter(s => s.enabled));

        const clothDoc = await getDoc(doc(db, "settings", "clothConfig"));
        let clothTypes = [];

        if (clothDoc.exists()) {
          clothTypes = clothDoc.data().items || [];
        } else {
          clothTypes = [
            { id: 'shirt', name: 'Shirt', icon: 'shirt', iconUrl: '', enabled: true },
            { id: 'tshirt', name: 'T-Shirt', icon: 'tshirt', iconUrl: '', enabled: true },
            { id: 'pant', name: 'Pant', icon: 'pant', iconUrl: '', enabled: true },
            { id: 'starch', name: 'Starch Cloth', icon: 'starch', iconUrl: '', enabled: true },
            { id: 'saree', name: 'Saree', icon: 'saree', iconUrl: '', enabled: true },
            { id: 'blouse', name: 'Blouse', icon: 'blouse', iconUrl: '', enabled: true },
            { id: 'panjabi', name: 'Panjabi Suit', icon: 'panjabi', iconUrl: '', enabled: true },
            { id: 'dhotar', name: 'Dhotar', icon: 'dhotar', iconUrl: '', enabled: true },
            { id: 'shalu', name: 'Shalu / Paithani', icon: 'shalu', iconUrl: '', enabled: true },
            { id: 'coat', name: 'Coat / Blazer', icon: 'coat', iconUrl: '', enabled: true },
            { id: 'shervani', name: 'Shervani', icon: 'shervani', iconUrl: '', enabled: true },
            { id: 'sweater', name: 'Sweater / Jerkin', icon: 'sweater', iconUrl: '', enabled: true },
            { id: 'onepiece', name: 'One Piece Ghagara', icon: 'onepiece', iconUrl: '', enabled: true },
            { id: 'bedsheet', name: 'Bedsheet (Single/Double)', icon: 'bedsheet', iconUrl: '', enabled: true },
            { id: 'blanket', name: 'Blanket / Rajai', icon: 'blanket', iconUrl: '', enabled: true },
            { id: 'shoes', name: 'Shoes Washing', icon: 'shoes', iconUrl: '', enabled: true },
            { id: 'helmet', name: 'Helmet Washing', icon: 'helmet', iconUrl: '', enabled: true },
            { id: 'clothsPerKg', name: 'Cloths Per Kg', icon: 'clothsPerKg', iconUrl: '', enabled: true }
          ];

          await setDoc(doc(db, "settings", "clothConfig"), { items: clothTypes });
        }

        const enabledClothTypes = clothTypes.filter(item => item.enabled);
        setClothingItems(enabledClothTypes);

        const initialItems = {};
        enabledClothTypes.forEach(item => {
          initialItems[item.id] = { quantity: 0, price: 0 };
        });
        setFormData(prev => ({ ...prev, items: initialItems }));

      } catch (error) {
        console.error("Error fetching configuration: ", error);
        showToast('Failed to load configuration', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, []);

  const getClothIcon = (item) => {
    if (item.iconUrl && item.iconUrl.trim() !== '') return item.iconUrl;
    if (item.icon && imageMap[item.icon]) return imageMap[item.icon];
    if (imageMap[item.id]) return imageMap[item.id];
    return defaultIcon;
  };

  const getClothName = (itemId) => {
    const item = clothingItems.find(c => c.id === itemId);
    return item ? item.name : itemId;
  };

  const searchByPhone = (phone) => {
    if (!phone || phone.length < 1) { setSearchResults([]); setShowPhoneDropdown(false); return; }
    const results = allCustomers.filter(customer => {
      const customerPhone = customer.phone || customer.id || '';
      return customerPhone.includes(phone);
    }).slice(0, 8);
    setSearchResults(results);
    setShowPhoneDropdown(results.length > 0);
  };

  const searchByName = (name) => {
    if (!name || name.length < 1) { setSearchResults([]); setShowNameDropdown(false); return; }
    const results = allCustomers.filter(customer => customer.name && customer.name.toLowerCase().includes(name.toLowerCase())).slice(0, 8);
    setSearchResults(results);
    setShowNameDropdown(results.length > 0);
  };

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({ ...prev, customerName: customer.name || '', phone: customer.phone || customer.id || '' }));
    setShowPhoneDropdown(false);
    setShowNameDropdown(false);
    setSearchResults([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (name === 'serviceType') {
      const updatedItems = Object.keys(formData.items).reduce((acc, item) => {
        acc[item] = { ...formData.items[item], price: servicePrices[value]?.[item] || 0 };
        return acc;
      }, {});
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handlePhoneChange = (e) => {
    const phoneNumber = e.target.value;
    setFormData(prev => ({ ...prev, phone: phoneNumber }));
    searchByPhone(phoneNumber);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, customerName: name }));
    searchByName(name);
  };

  const handleItemChange = (item, value) => {
    const floatValue = parseFloat(value);
    const finalValue = isNaN(floatValue) ? 0 : Math.max(0, floatValue);
    setFormData(prev => ({ ...prev, items: { ...prev.items, [item]: { ...prev.items[item], quantity: finalValue } } }));
  };

  const incrementQuantity = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...prev.items[itemId],
          quantity: itemId === 'clothsPerKg' 
            ? parseFloat((prev.items[itemId].quantity + 0.1).toFixed(1))
            : Math.round(prev.items[itemId].quantity + 1)
        }
      }
    }));
  };

  const decrementQuantity = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...prev.items[itemId],
          quantity: itemId === 'clothsPerKg'
            ? parseFloat(Math.max(0, prev.items[itemId].quantity - 0.1).toFixed(1))
            : Math.max(0, Math.round(prev.items[itemId].quantity - 1))
        }
      }
    }));
  };

  const calculateTotal = () => {
    let totalItems = 0;
    let totalCost = 0;
    Object.values(formData.items).forEach(item => {
      totalItems += item.quantity;
      totalCost += item.quantity * item.price;
    });

    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') discountAmount = totalCost * (discountValue / 100);
      else discountAmount = Math.min(discountValue, totalCost);
    }

    const afterDiscount = totalCost - discountAmount;
    let sgst = 0, cgst = 0, grandTotal = afterDiscount;
    if (gstConfig.enabled) {
      sgst = afterDiscount * (gstConfig.sgstPercentage / 100);
      cgst = afterDiscount * (gstConfig.cgstPercentage / 100);
      grandTotal = afterDiscount + sgst + cgst;
    }

    const totalPaid = cashAmount + onlineAmount;
    const balanceDue = Math.max(0, grandTotal - totalPaid);
    return { totalItems, totalCost, discountAmount, afterDiscount, sgst, cgst, grandTotal, totalPaid, balanceDue };
  };

  const { totalItems, totalCost, discountAmount, afterDiscount, sgst, cgst, grandTotal, totalPaid, balanceDue } = calculateTotal();

  const getSelectedItems = () => {
    return Object.entries(formData.items)
      .filter(([_, item]) => item.quantity > 0)
      .map(([id, item]) => ({ id, name: getClothName(id), quantity: item.quantity, price: item.price }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.phone || formData.phone.trim() === '') errors.push('Phone number is required');
    else if (formData.phone.length !== 10) errors.push('Phone number must be 10 digits');
    if (!formData.customerName || formData.customerName.trim() === '') errors.push('Customer name is required');
    if (!formData.serviceType || formData.serviceType === '') errors.push('Please select a service type');
    if (totalItems === 0) errors.push('Please select at least one clothing item');
    if (!formData.pickupDate) errors.push('Pickup date is required');
    if (!formData.deliveryDate) errors.push('Delivery date is required');
    return errors;
  };

  const handleProceedToCheckout = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      showToast('Please complete all required fields', 'error', errors);
      return;
    }
    setDiscountType('percentage');
    setDiscountValue(0);
    setCashAmount(0);
    setOnlineAmount(0);
    setCheckoutModal(true);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const selectedItems = Object.fromEntries(
        Object.entries(formData.items).filter(([_, item]) => item.quantity > 0)
      );

      const snapshot = await getDocs(collection(db, "Bookings"));
      let maxBookingNum = 0;
      snapshot.forEach(docSnap => {
        const id = docSnap.id;
        const match = id.match(/^(\d{4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxBookingNum) maxBookingNum = num;
        }
      });

      const generatedBookingId = String(maxBookingNum + 1).padStart(4, '0');

      await setDoc(doc(db, "customers", formData.phone), {
        name: formData.customerName,
        phone: formData.phone,
        createdAt: new Date()
      }, { merge: true });

      const existingIndex = allCustomers.findIndex(c => c.phone === formData.phone || c.id === formData.phone);
      if (existingIndex === -1) {
        setAllCustomers(prev => [...prev, { id: formData.phone, name: formData.customerName, phone: formData.phone }]);
      }

      let paymentStatus = 'unpaid', paymentMethod = 'pending';
      if (totalPaid >= grandTotal) paymentStatus = 'paid';
      else if (totalPaid > 0) paymentStatus = 'partial';
      if (cashAmount > 0 && onlineAmount > 0) paymentMethod = 'split';
      else if (cashAmount > 0) paymentMethod = 'cash';
      else if (onlineAmount > 0) paymentMethod = 'online';

      await setDoc(doc(db, "Bookings", generatedBookingId), {
        customerName: formData.customerName,
        phone: formData.phone,
        serviceType: formData.serviceType,
        urgentDelivery: formData.urgentDelivery,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        instructions: formData.instructions,
        items: selectedItems,
        totalItems: parseFloat(Object.values(selectedItems).reduce((sum, item) => sum + item.quantity, 0).toFixed(1)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        discountType,
        discountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        afterDiscount: parseFloat(afterDiscount.toFixed(2)),
        gstEnabled: gstConfig.enabled,
        sgstPercentage: gstConfig.enabled ? gstConfig.sgstPercentage : 0,
        cgstPercentage: gstConfig.enabled ? gstConfig.cgstPercentage : 0,
        sgst: parseFloat(sgst.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        paymentMethod,
        paymentStatus,
        cashAmount: parseFloat(cashAmount.toFixed(2)),
        onlineAmount: parseFloat(onlineAmount.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        balanceDue: parseFloat(balanceDue.toFixed(2)),
        status: 'in-progress',
        createdAt: new Date()
      });

      // Store form data and selected items for success modal
      setLastBookingFormData({ ...formData });
      setLastBookingSelectedItems(getSelectedItems());

      setCheckoutModal(false);
      setSuccessModal({ 
        bookingId: generatedBookingId, 
        customerName: formData.customerName, 
        grandTotal, 
        totalPaid, 
        balanceDue, 
        paymentMethod 
      });

      // Reset form
      const resetItems = Object.keys(formData.items).reduce((acc, item) => {
        acc[item] = { quantity: 0, price: 0 };
        return acc;
      }, {});
      
      setFormData({
        customerName: '',
        phone: '',
        serviceType: '',
        urgentDelivery: false,
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        instructions: '',
        items: resetItems
      });

      setDiscountType('percentage');
      setDiscountValue(0);
      setCashAmount(0);
      setOnlineAmount(0);

    } catch (error) {
      console.error("Error creating booking: ", error);
      showToast('Error creating booking. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-field-container')) {
        setShowPhoneDropdown(false);
        setShowNameDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '2rem', border: '1px solid var(--gray-200)' }}>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid var(--gray-300)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '2px'
  };

  const dropdownItemStyle = {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid var(--gray-100)',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem' }}>
      {toast && <Toast message={toast.message} type={toast.type} details={toast.details} onClose={() => setToast(null)} />}
      
      {successModal && (
        <SuccessModal 
          bookingId={successModal.bookingId} 
          customerName={successModal.customerName} 
          grandTotal={successModal.grandTotal} 
          totalPaid={successModal.totalPaid} 
          balanceDue={successModal.balanceDue} 
          paymentMethod={successModal.paymentMethod} 
          onClose={() => setSuccessModal(null)}
          formData={lastBookingFormData}
          selectedItems={lastBookingSelectedItems}
          formatDate={formatDate}
          getFullServiceName={getFullServiceName}
          getClothDisplayName={getClothDisplayName}
        />
      )}
      
      <CheckoutModal
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        formData={formData}
        totalItems={totalItems}
        totalCost={totalCost}
        gstConfig={gstConfig}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        onlineAmount={onlineAmount}
        setOnlineAmount={setOnlineAmount}
        onConfirm={handleConfirmBooking}
        isSubmitting={isSubmitting}
      />

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '2rem', border: '1px solid var(--gray-200)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '1.5rem' }}>Create New Booking</h3>
        
        <form onSubmit={handleProceedToCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.2rem' }}>
            <div className="search-field-container" style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} onFocus={() => formData.phone.length >= 1 && searchByPhone(formData.phone)} style={{ width: '90%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} placeholder="Enter 10-digit phone number" maxLength="10" required />
              {showPhoneDropdown && searchResults.length > 0 && (
                <div style={dropdownStyle}>
                  {searchResults.map((customer, index) => (
                    <div key={customer.id || index} onClick={() => handleSelectCustomer(customer)} style={{ ...dropdownItemStyle, borderBottom: index < searchResults.length - 1 ? '1px solid var(--gray-100)' : 'none' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                      <div style={{ fontWeight: '500', color: 'var(--gray-800)', fontSize: '0.875rem' }}>{customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>📞 {customer.phone || customer.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="search-field-container" style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleNameChange} onFocus={() => formData.customerName.length >= 1 && searchByName(formData.customerName)} style={{ width: '90%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} placeholder="Enter customer name" required />
              {showNameDropdown && searchResults.length > 0 && (
                <div style={dropdownStyle}>
                  {searchResults.map((customer, index) => (
                    <div key={customer.id || index} onClick={() => handleSelectCustomer(customer)} style={{ ...dropdownItemStyle, borderBottom: index < searchResults.length - 1 ? '1px solid var(--gray-100)' : 'none' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                      <div style={{ fontWeight: '500', color: 'var(--gray-800)', fontSize: '0.875rem' }}>{customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>📞 {customer.phone || customer.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Service Type</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} required>
              <option value="">Select service</option>
              {availableServices.map(service => (<option key={service.id} value={service.id}>{service.name}</option>))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: formData.urgentDelivery ? '#fff3cd' : 'var(--gray-50)', border: formData.urgentDelivery ? '2px solid #ff6b35' : '1px solid var(--gray-200)', borderRadius: '0.5rem', transition: 'all 0.3s ease' }}>
            <input type="checkbox" id="urgentDelivery" name="urgentDelivery" checked={formData.urgentDelivery} onChange={handleInputChange} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff6b35' }} />
            <label htmlFor="urgentDelivery" style={{ fontSize: '0.95rem', fontWeight: '500', color: formData.urgentDelivery ? '#ff6b35' : 'var(--gray-700)', cursor: 'pointer' }}>Urgent Delivery</label>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '1rem' }}>Select Clothing Items</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {clothingItems.map(item => (
                <div key={item.id} style={{ border: `2px solid ${formData.items[item.id]?.quantity > 0 ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: '0.5rem', padding: '1rem', cursor: 'pointer', backgroundColor: formData.items[item.id]?.quantity > 0 ? 'var(--secondary)' : 'transparent', transition: 'all 0.2s', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <img src={getClothIcon(item)} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                  </div>    
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: '0 0 0.25rem 0' }}>{item.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: '0 0 0.75rem 0' }}>₹ {formData.items[item.id]?.price || 0}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white' }}>
                      <button type="button" onClick={() => decrementQuantity(item.id)} style={{ width: '48px', height: '38px', padding: '0', margin: '0', border: '0', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', boxShadow: 'none' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>−</button>
                      <input type="number" value={item.id === 'clothsPerKg' ? formData.items[item.id]?.quantity.toFixed(1) || '0.0' : Math.round(formData.items[item.id]?.quantity) || '0'} onChange={(e) => handleItemChange(item.id, e.target.value)} style={{ width: '50px', height: '38px', padding: '0', margin: '0', border: '0', outline: 'none', textAlign: 'center', fontSize: '0.875rem', backgroundColor: 'white', MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none', boxShadow: 'none' }} step={item.id === 'clothsPerKg' ? "0.1" : "1"} min="0" />
                      <button type="button" onClick={() => incrementQuantity(item.id)} style={{ width: '48px', height: '38px', padding: '0', margin: '0', border: '0', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', boxShadow: 'none' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <style>{`input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type='number'] { -moz-appearance: textfield; }`}</style>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>Total Items:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{totalItems.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>Estimated Cost:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--primary)' }}>₹ {totalCost.toFixed(2)}</span>
              </div>
              {gstConfig.enabled && totalCost > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>+ SGST ({gstConfig.sgstPercentage}%)</span>
                    <span>₹ {(totalCost * gstConfig.sgstPercentage / 100).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>+ CGST ({gstConfig.cgstPercentage}%)</span>
                    <span>₹ {(totalCost * gstConfig.cgstPercentage / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}
              {!gstConfig.enabled && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#856404' }}>
                  Note: GST is currently disabled
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Pickup Date</label>
              <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleInputChange} style={{ width: '90%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Delivery Date</label>
              <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} style={{ width: '90%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} required />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Special Instructions</label>
            <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} rows="3" style={{ width: '95%', padding: '0.5rem 1rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} placeholder="Any special care instructions..."></textarea>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" style={{ padding: '0.5rem 1.5rem', border: '1px solid var(--gray-300)', color: 'var(--gray-700)', borderRadius: '0.5rem', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => {
              const resetItems = Object.keys(formData.items).reduce((acc, item) => { acc[item] = { quantity: 0, price: 0 }; return acc; }, {});
              setFormData({ customerName: '', phone: '', serviceType: '', urgentDelivery: false, pickupDate: new Date().toISOString().split('T')[0], deliveryDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], instructions: '', items: resetItems });
            }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', transition: 'background-color 0.2s' }} disabled={totalItems === 0 || !formData.serviceType || !formData.customerName || !formData.phone}>
              Proceed to Checkout →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;