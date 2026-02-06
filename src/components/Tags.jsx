import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import ReactDOMServer from 'react-dom/server';

const Tags = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [tagData, setTagData] = useState({
    orderId: '',
    customerName: '',
    serviceType: '',
    deliveryDate: '',
    pickupDate: ''
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    mobile: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);

  // NEW: State for cloth item selection
  const [selectedClothItem, setSelectedClothItem] = useState('all');
  const [tagGenerationType, setTagGenerationType] = useState('all'); // 'all' or 'single'

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'company');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanyInfo({
            name: data.businessName || 'LaundryPro',
            mobile: data.phoneNumber || ''
          });
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  const [items, setItems] = useState({});
  const [tagPreview, setTagPreview] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, 'Bookings'));
      const orderList = [];
      snapshot.forEach(docSnap => {
        orderList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      orderList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      setOrders(orderList);
      if (orderList.length > 0) {
        setSelectedOrderId(orderList[0].id);
        setSearchTerm(orderList[0].id);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;

    const fetchOrderDetails = async () => {
      const docRef = doc(db, 'Bookings', selectedOrderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTagData({
          orderId: selectedOrderId,
          customerName: data.customerName || '',
          serviceType: data.serviceType || '',
          deliveryDate: data.deliveryDate || '',
          pickupDate: data.pickupDate || ''
        });
        setItems(data.items || {});
        setTagPreview([]);
        setSelectedClothItem('all'); // Reset cloth selection when order changes
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId]);

  const handleOrderChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    setSearchTerm(orderId);
    setShowDropdown(false);
  };

  // Function to get full service name
  const getFullServiceName = (serviceType) => {
    const serviceNames = {
      'stain-removal': 'Stain Removal',
      'ironing': 'Ironing',
      'wash-and-iron': 'Wash & Iron',
      'wash-and-fold': 'Wash & Fold',
      'starch-and-iron': 'Starch & Iron'
    };
    return serviceNames[serviceType] || serviceType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get cloth item display name
  const getClothDisplayName = (itemKey) => {
    return itemMapping[itemKey] || itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
  };

  // Get available cloth items from the order (items with quantity > 0)
  const getAvailableClothItems = () => {
    return Object.entries(items)
      .filter(([_, itemData]) => itemData.quantity > 0)
      .map(([itemName, itemData]) => ({
        key: itemName,
        name: getClothDisplayName(itemName),
        quantity: itemData.quantity
      }));
  };

  const generateTag = () => {
    const previews = [];

    // Determine which items to generate tags for
    let itemsToGenerate = {};
    
    if (tagGenerationType === 'all' || selectedClothItem === 'all') {
      itemsToGenerate = items;
    } else {
      // Only generate for selected cloth item
      if (items[selectedClothItem]) {
        itemsToGenerate = { [selectedClothItem]: items[selectedClothItem] };
      }
    }

    // Calculate total tokens based on generation type
    let totalTokens;
    let currentToken = 0;

    if (tagGenerationType === 'all' || selectedClothItem === 'all') {
      // Total tokens for all items
      totalTokens = Object.values(items).reduce((sum, itemData) => sum + (itemData.quantity || 0), 0);
    } else {
      // Total tokens for selected item only
      totalTokens = items[selectedClothItem]?.quantity || 0;
    }

    // For per-item generation, we need to track the starting token number
    let startingToken = 0;
    if (tagGenerationType === 'single' && selectedClothItem !== 'all') {
      // Calculate starting token for this item
      const orderedItems = Object.keys(items);
      for (const itemName of orderedItems) {
        if (itemName === selectedClothItem) break;
        startingToken += items[itemName]?.quantity || 0;
      }
    }

    Object.entries(itemsToGenerate).forEach(([itemName, itemData]) => {
      const totalQty = itemData.quantity || 0;
      for (let i = 0; i < totalQty; i++) {
        currentToken++;
        
        // Calculate display token based on generation type
        let displayToken;
        let displayTotal;
        
        if (tagGenerationType === 'all' || selectedClothItem === 'all') {
          // For all items, show absolute position
          displayToken = startingToken + currentToken;
          displayTotal = Object.values(items).reduce((sum, item) => sum + (item.quantity || 0), 0);
        } else {
          // For single item, show position within that item
          displayToken = currentToken;
          displayTotal = totalTokens;
        }

        previews.push(
          <div 
            key={`${itemName}-${i}`} 
            className="tag"
            style={{
              width: '80mm',
              height: '50mm',
              minWidth: '80mm',
              maxWidth: '80mm',
              minHeight: '50mm',
              maxHeight: '50mm',
              border: '2px solid #333',
              borderRadius: '5px',
              margin: '0',
              padding: '0',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              overflow: 'hidden',
              flexShrink: 0,
              flexGrow: 0
            }}
          >
            <div 
              className="tag-content" 
              style={{
                border: '2px solid #333',
                borderRadius: '4px',
                padding: '3.5mm 3mm',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0'
              }}
            >
              {/* Order ID - Bold, Big, Center */}
              <div style={{ 
                fontWeight: '900', 
                fontSize: '1.8rem', 
                textAlign: 'center',
                letterSpacing: '0.5px',
                color: '#000',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.1'
              }}>
                {tagData.orderId}
              </div>

              {/* Customer Name - Center */}
              <div style={{ 
                fontSize: '1.1rem', 
                textAlign: 'center',
                fontWeight: '700',
                color: '#222',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '1.1'
              }}>
                {tagData.customerName}
              </div>

              {/* Service Type (Centered) & Token Number (Right) */}
              <div style={{ 
                width: '100%',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.05rem',
                fontWeight: '800',
                color: '#333',
                lineHeight: '1.1',
                padding: '0 1mm'
              }}>
                {/* Service Name - Centered */}
                <span style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  paddingRight: '2mm'
                }}>
                  {getFullServiceName(tagData.serviceType)}
                </span>
                
                {/* Token - Absolute Right */}
                <span style={{ 
                  position: 'absolute',
                  right: '1mm',
                  whiteSpace: 'nowrap',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}>
                  {displayToken}/{displayTotal}
                </span>
              </div>

              {/* Receiving Date (Pickup Date) - Centered */}
              <div style={{ 
                fontSize: '0.95rem',
                width: '100%',
                textAlign: 'center',
                color: '#444',
                fontWeight: '700',
                lineHeight: '1.1'
              }}>
                {formatDate(tagData.pickupDate)}
              </div>

              {/* Garment Name - Centered */}
              <div style={{ 
                width: '100%',
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: '800',
                color: '#333',
                lineHeight: '1.1'
              }}>
                {getClothDisplayName(itemName)}
              </div>

              {/* Delivery Date - Centered */}
              <div style={{ 
                fontSize: '0.95rem',
                width: '100%',
                textAlign: 'center',
                color: '#444',
                fontWeight: '700',
                lineHeight: '1.1'
              }}>
                {formatDate(tagData.deliveryDate)}
              </div>
            </div>
          </div>
        );
      }
    });

    setTagPreview(previews);
  };

  const printTag = () => {
    const printWindow = window.open('', '_blank');

    const tempContainer = document.createElement('div');
    tagPreview.forEach(tag => {
      const div = document.createElement('div');
      div.innerHTML = ReactDOMServer.renderToStaticMarkup(tag);
      tempContainer.appendChild(div);
    });

    const tagStyles = `
      @page {
        size: 80mm 50mm;
        margin: 0;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .tag {
        width: 80mm;
        height: 50mm;
        min-width: 80mm;
        max-width: 80mm;
        min-height: 50mm;
        max-height: 50mm;
        border: 2px solid #333;
        border-radius: 5px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        page-break-inside: avoid;
        background-color: white;
        overflow: hidden;
      }
      .tag:last-child {
        page-break-after: auto;
      }
      .tag-content {
        width: 100%;
        height: 100%;
        padding: 3.5mm 3mm;
        box-sizing: border-box;
        border: 2px solid #333;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        background-color: #ffffff;
        gap: 0;
      }
      .tag-content > div {
        line-height: 1.1;
      }
      .tag:nth-child(even) .tag-content {
        background-color: #fafafa;
      }
      .tag:nth-child(odd) .tag-content {
        background-color: #ffffff;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        .tag {
          page-break-inside: avoid !important;
        }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Tags</title>
          <style>${tagStyles}</style>
        </head>
        <body>
          ${tempContainer.innerHTML}
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

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableClothItems = getAvailableClothItems();

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        padding: '2rem',
        border: '1px solid var(--gray-200)'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--gray-800)',
          marginBottom: '1.5rem'
        }}>Tag Generator</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: '500',
              color: 'var(--gray-800)',
              marginBottom: '1rem'
            }}>Tag Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 500 }}>Order ID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleOrderChange}
                    onFocus={() => setShowDropdown(true)}
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  {showDropdown && searchTerm && filteredOrders.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => handleOrderSelect(order.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-300)',
                            backgroundColor: order.id === selectedOrderId ? 'var(--gray-100)' : 'white'
                          }}
                        >
                          {order.id} - {order.customerName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 500 }}>Customer Name</label>
                <input
                  type="text"
                  value={tagData.customerName}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 500 }}>Service Type</label>
                <input
                  type="text"
                  value={getFullServiceName(tagData.serviceType)}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{ fontWeight: 500 }}>PickUp Date</label>
                  <input
                    type="date"
                    value={tagData.pickupDate}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 500 }}>Delivery Date</label>
                  <input
                    type="date"
                    value={tagData.deliveryDate}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                </div>
              </div>

              {/* NEW: Tag Generation Type Selection */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '0.5rem',
                border: '1px solid #bae6fd'
              }}>
                <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block', color: '#0369a1' }}>
                  🏷️ Tag Generation Options
                </label>
                
                {/* Radio buttons for generation type */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: tagGenerationType === 'all' ? '#dbeafe' : 'white',
                    border: tagGenerationType === 'all' ? '2px solid #3b82f6' : '1px solid #d1d5db'
                  }}>
                    <input
                      type="radio"
                      name="generationType"
                      value="all"
                      checked={tagGenerationType === 'all'}
                      onChange={() => {
                        setTagGenerationType('all');
                        setSelectedClothItem('all');
                      }}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontWeight: 500 }}>All Items</span>
                  </label>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: tagGenerationType === 'single' ? '#dbeafe' : 'white',
                    border: tagGenerationType === 'single' ? '2px solid #3b82f6' : '1px solid #d1d5db'
                  }}>
                    <input
                      type="radio"
                      name="generationType"
                      value="single"
                      checked={tagGenerationType === 'single'}
                      onChange={() => setTagGenerationType('single')}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontWeight: 500 }}>Per Cloth Item</span>
                  </label>
                </div>

                {/* Cloth item dropdown (shown only when 'single' is selected) */}
                {tagGenerationType === 'single' && (
                  <div>
                    <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                      Select Cloth Item
                    </label>
                    <select
                      value={selectedClothItem}
                      onChange={(e) => setSelectedClothItem(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="all">-- Select a cloth item --</option>
                      {availableClothItems.map(item => (
                        <option key={item.key} value={item.key}>
                          {item.name} (Qty: {item.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Items summary */}
                {availableClothItems.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Order Items Summary:
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem' 
                    }}>
                      {availableClothItems.map(item => (
                        <span 
                          key={item.key}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: selectedClothItem === item.key ? '#3b82f6' : '#e5e7eb',
                            color: selectedClothItem === item.key ? 'white' : '#374151',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: tagGenerationType === 'single' ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (tagGenerationType === 'single') {
                              setSelectedClothItem(item.key);
                            }
                          }}
                        >
                          {item.name}: {item.quantity}
                        </span>
                      ))}
                    </div>
                    <p style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      Total Tags: {
                        tagGenerationType === 'all' || selectedClothItem === 'all'
                          ? availableClothItems.reduce((sum, item) => sum + item.quantity, 0)
                          : (items[selectedClothItem]?.quantity || 0)
                      }
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={generateTag}
                disabled={availableClothItems.length === 0 || (tagGenerationType === 'single' && selectedClothItem === 'all')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: (availableClothItems.length === 0 || (tagGenerationType === 'single' && selectedClothItem === 'all')) 
                    ? 'var(--gray-300)' 
                    : 'var(--primary, #3b82f6)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: (availableClothItems.length === 0 || (tagGenerationType === 'single' && selectedClothItem === 'all')) 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  fontWeight: 600
                }}
              >
                {tagGenerationType === 'all' 
                  ? `Generate All Tags (${availableClothItems.reduce((sum, item) => sum + item.quantity, 0)})` 
                  : selectedClothItem !== 'all' 
                    ? `Generate ${getClothDisplayName(selectedClothItem)} Tags (${items[selectedClothItem]?.quantity || 0})`
                    : 'Select a Cloth Item'
                }
              </button>
            </div>
          </div>

          <div>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: '500',
              color: 'var(--gray-800)',
              marginBottom: '1rem'
            }}>Tag Preview (80mm × 50mm)</h4>

            <div style={{
              border: '2px dashed var(--gray-300)',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              minHeight: '400px',
              maxHeight: '600px',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: tagPreview.length ? 'flex-start' : 'center',
              backgroundColor: '#fafafa'
            }}>
              {tagPreview.length > 0 ? (
                <>
                  {tagPreview.map((tag, index) => (
                    <div 
                      key={index}
                      style={{
                        transform: 'scale(0.7)',
                        transformOrigin: 'center center',
                        marginBottom: '-30px'
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: 'var(--gray-500)', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.5rem' }}>Select an order and click "Generate Tag"</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    You can generate tags for all items or specific cloth items
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={printTag}
              disabled={!tagPreview.length}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: tagPreview.length ? 'var(--green-600, #16a34a)' : 'var(--gray-300)',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: tagPreview.length ? 'pointer' : 'not-allowed',
                fontSize: '0.875rem',
                marginTop: '1rem',
                fontWeight: 600
              }}
            >
              🖨️ Print {tagPreview.length} Tag{tagPreview.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tags;