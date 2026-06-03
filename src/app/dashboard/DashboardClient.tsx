'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { placeOrderAction } from '@/app/actions/order';
import { 
  getConversionFactor, 
  formatINR, 
  formatUnit, 
  UNITS, 
  UNIT_TYPES, 
  Unit 
} from '@/lib/conversions';
import { 
  Activity, 
  LogOut, 
  Search, 
  ShoppingCart, 
  Trash2, 
  History, 
  ClipboardList, 
  Check, 
  Package, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import styles from './dashboard.module.css';

interface DashboardClientProps {
  initialProducts: any[];
  initialOrders: any[];
  user: {
    name: string;
    email: string;
    role: 'admin' | 'seller';
  };
}

interface CartItemState {
  product: any;
  quantity: string; // string to allow typing decimal dot
  unit: Unit;
}

export default function DashboardClient({ initialProducts, initialOrders, user }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItemState[]>([]);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Derive unique categories
  const categories = ['All', ...Array.from(new Set(initialProducts.map((p) => p.category)))];

  // Filter products
  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: any) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) return prev;
      return [...prev, { product, quantity: '1', unit: product.base_unit as Unit }];
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartItem = (productId: string, field: 'quantity' | 'unit', value: any) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // Live conversion readouts for cart item
  const getCartItemDetails = (item: CartItemState) => {
    const qty = parseFloat(item.quantity) || 0;
    const baseUnit = item.product.base_unit as Unit;
    let factor = 1;
    let error = null;

    try {
      factor = getConversionFactor(baseUnit, item.unit);
    } catch (e: any) {
      error = e.message;
    }

    const baseQty = qty * factor;
    const unitPrice = item.product.base_price * factor;
    const totalPrice = qty * unitPrice;
    const exceedsStock = baseQty > item.product.quantity_in_stock;

    return {
      factor,
      baseQty,
      unitPrice,
      totalPrice,
      error,
      exceedsStock,
    };
  };

  // Cart totals
  const cartTotal = cart.reduce((sum, item) => {
    const { totalPrice, error } = getCartItemDetails(item);
    return error ? sum : sum + totalPrice;
  }, 0);

  const cartHasErrors = cart.some((item) => {
    const { exceedsStock, error } = getCartItemDetails(item);
    return !!error || exceedsStock || (parseFloat(item.quantity) || 0) <= 0;
  });

  // Submit Order / Quotation
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || cartHasErrors) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
      }));

      const res = await placeOrderAction(orderItems);

      if (res.success) {
        // Trigger celebration animation!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#ffffff']
        });

        setSuccessMessage('Quotation / Order placed successfully! Check History tab.');
        setCart([]);
        
        // Refresh orders list
        router.refresh();
        
        // Refresh state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to place order.');
      }
    });
  };

  const handleLogout = () => {
    logoutAction();
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  return (
    <div className={styles.wrapper}>
      {/* Navbar Header */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.headerLeft}>
          <div className={styles.logoBadge}>
            <Activity className={styles.logoIcon} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>AasaMedChem</h1>
            <p className={styles.headerSubtitle}>Sales Desk Portal</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={`${styles.userRole} badge badge-approved`}>{user.role}</div>
          </div>
          <button onClick={handleLogout} className={`${styles.logoutBtn} btn-secondary`}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('order')}
          className={`${styles.tabBtn} ${activeTab === 'order' ? styles.tabBtnActive : ''}`}
        >
          <ClipboardList size={18} />
          <span>New Quotation</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
        >
          <History size={18} />
          <span>Order History ({orders.length})</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <main className="animate-fade-in">
        {activeTab === 'order' ? (
          <div className="grid-cols-12">
            {/* Catalog (Left side - 8 cols) */}
            <div className={styles.catalogSection}>
              {/* Filters Panel */}
              <div className={`${styles.filterPanel} glass-panel`}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} size={18} />
                  <input
                    type="text"
                    placeholder="Search by SKU, chemical name, category..."
                    className="glass-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className={styles.categoryPills}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`${styles.pillBtn} ${selectedCategory === cat ? styles.pillActive : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className={styles.productGrid}>
                {filteredProducts.map((prod) => {
                  const isInCart = cart.some((item) => item.product.id === prod.id);
                  const isOutOfStock = prod.quantity_in_stock <= 0;

                  return (
                    <div key={prod.id} className={`${styles.productCard} glass-panel glass-panel-hover`}>
                      <div className={styles.productHeader}>
                        <span className={styles.productCategory}>{prod.category}</span>
                        <span className={styles.productSku}>{prod.sku}</span>
                      </div>
                      <h3 className={styles.productName}>{prod.name}</h3>
                      <p className={styles.productDesc}>{prod.description}</p>
                      
                      <div className={styles.stockDetails}>
                        <span className={styles.stockLabel}>Available Stock:</span>
                        <span className={`${styles.stockValue} ${isOutOfStock ? styles.outOfStock : ''}`}>
                          {formatUnit(prod.quantity_in_stock, prod.base_unit)}
                        </span>
                      </div>

                      <div className={styles.productFooter}>
                        <div className={styles.priceContainer}>
                          <span className={styles.priceValue}>{formatINR(prod.base_price)}</span>
                          <span className={styles.priceUnit}>/ {prod.base_unit}</span>
                        </div>
                        
                        <button
                          onClick={() => addToCart(prod)}
                          className={isInCart ? 'btn-success' : 'btn-primary'}
                          disabled={isInCart || isOutOfStock}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          {isOutOfStock ? (
                            'Out of Stock'
                          ) : isInCart ? (
                            <>
                              <Check size={14} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={14} />
                              <span>Add to Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className={`${styles.emptyState} glass-panel`} style={{ gridColumn: '1 / -1' }}>
                    <Package size={48} className={styles.emptyIcon} />
                    <h3>No products found</h3>
                    <p>Try refining your search query or choosing a different category.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quotation Sidebar Cart (Right side - 4 cols) */}
            <div className={styles.cartSection}>
              <div className={`${styles.cartPanel} glass-panel`}>
                <div className={styles.cartTitleBar}>
                  <ShoppingCart size={20} className={styles.accentText} />
                  <h2>Active Quotation</h2>
                  {cart.length > 0 && <span className={styles.cartCount}>{cart.length}</span>}
                </div>

                {errorMessage && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className={styles.successBanner}>
                    <Check size={16} />
                    <span>{successMessage}</span>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className={styles.emptyCart}>
                    <ShoppingCart size={40} className={styles.emptyCartIcon} />
                    <p className={styles.emptyCartText}>No chemicals selected</p>
                    <p className={styles.emptyCartDesc}>
                      Click "Add to Order" on catalog cards to build your quotation with real-time conversion rates.
                    </p>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handlePlaceOrder} className={styles.cartForm}>
                      <div className={styles.cartItemsList}>
                        {cart.map((item) => {
                          const { factor, baseQty, unitPrice, totalPrice, exceedsStock, error } = getCartItemDetails(item);
                          const compatibleUnits = UNIT_TYPES[item.product.unit_type as 'weight' | 'volume' | 'count'];
                          const qtyVal = parseFloat(item.quantity) || 0;

                          return (
                            <div key={item.product.id} className={`${styles.cartItemCard} ${exceedsStock ? styles.cartItemError : ''}`}>
                              <div className={styles.cartItemHeader}>
                                <div>
                                  <h4 className={styles.cartItemName}>{item.product.name}</h4>
                                  <span className={styles.cartItemSku}>{item.product.sku}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className={styles.removeBtn}
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className={styles.inputControls}>
                                <div className={styles.qtyControl}>
                                  <label>Quantity</label>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.00000001"
                                    className="glass-input"
                                    value={item.quantity}
                                    onChange={(e) => updateCartItem(item.product.id, 'quantity', e.target.value)}
                                    required
                                  />
                                </div>

                                <div className={styles.unitControl}>
                                  <label>Unit</label>
                                  <select
                                    className="glass-input"
                                    value={item.unit}
                                    onChange={(e) => updateCartItem(item.product.id, 'unit', e.target.value as Unit)}
                                  >
                                    {compatibleUnits.map((u) => (
                                      <option key={u} value={u}>
                                        {UNITS[u].name} ({u})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Live Calculation / Conversion Display */}
                              <div className={styles.conversionInfo}>
                                {error ? (
                                  <div className={styles.inlineError}>{error}</div>
                                ) : (
                                  <>
                                    <div className={styles.infoRow}>
                                      <span className={styles.infoLabel}>Base unit price:</span>
                                      <span>{formatINR(item.product.base_price)} / {item.product.base_unit}</span>
                                    </div>
                                    {item.unit !== item.product.base_unit && (
                                      <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Converted Rate:</span>
                                        <span className={styles.highlightText}>
                                          {formatINR(unitPrice)} / {item.unit}
                                        </span>
                                      </div>
                                    )}
                                    {item.unit !== item.product.base_unit && (
                                      <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Internal conversion:</span>
                                        <span>
                                          {qtyVal} {item.unit} = {baseQty.toFixed(6)} {item.product.base_unit}
                                        </span>
                                      </div>
                                    )}
                                    <div className={styles.infoRow}>
                                      <span className={styles.infoLabel}>Stock Status:</span>
                                      {exceedsStock ? (
                                        <span className={styles.outOfStock}>
                                          Incompatible (Stock: {item.product.quantity_in_stock} {item.product.base_unit})
                                        </span>
                                      ) : (
                                        <span className={styles.inStock}>
                                          Available ({item.product.quantity_in_stock} {item.product.base_unit})
                                        </span>
                                      )}
                                    </div>
                                    <div className={`${styles.infoRow} ${styles.subtotalRow}`}>
                                      <span className={styles.subtotalLabel}>Subtotal:</span>
                                      <span className={styles.subtotalVal}>{formatINR(totalPrice)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Cart Summary */}
                      <div className={styles.cartSummary}>
                        <div className={styles.summaryTotalRow}>
                          <span>Grand Total (INR):</span>
                          <span className={styles.grandTotalText}>{formatINR(cartTotal)}</span>
                        </div>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ width: '100%', marginTop: '12px' }}
                          disabled={cartHasErrors || isPending}
                        >
                          {isPending ? 'Placing Order...' : 'Submit Quotation / Place Order'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Order History Tab */
          <div className={`${styles.historyContainer} glass-panel`}>
            <div className={styles.historyHeader}>
              <History size={24} className={styles.accentText} />
              <h2>Your Placed Quotations</h2>
              <p className={styles.historySubtitle}>Review past orders and verified conversion records</p>
            </div>

            <div className={styles.orderList}>
              {orders.map((ord) => {
                const isExpanded = expandedOrderId === ord.id;
                const dateString = new Date(ord.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={ord.id} className={`${styles.orderCard} ${isExpanded ? styles.orderCardExpanded : ''}`}>
                    <div 
                      onClick={() => toggleOrderExpand(ord.id)} 
                      className={styles.orderCardHeader}
                    >
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Order ID:</span>
                        <span className={styles.orderIdVal}>{ord.id.substring(0, 8)}...</span>
                      </div>
                      
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Date:</span>
                        <span className={styles.orderDateVal}>{dateString}</span>
                      </div>

                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Total Amount:</span>
                        <span className={styles.orderPriceVal}>{formatINR(ord.total_price)}</span>
                      </div>

                      <div className={styles.orderSummaryCol}>
                        <span className={`${styles.statusBadge} badge badge-${ord.status}`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className={styles.expandIcon}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.orderDetailsDrawer}>
                        <div className={styles.tableResponsive}>
                          <table className={styles.detailsTable}>
                            <thead>
                              <tr>
                                <th>Product Details</th>
                                <th>SKU</th>
                                <th style={{ textAlign: 'right' }}>Ordered Qty</th>
                                <th style={{ textAlign: 'right' }}>Converted (Base)</th>
                                <th style={{ textAlign: 'right' }}>Rate applied</th>
                                <th style={{ textAlign: 'right' }}>Total Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ord.items.map((item: any) => (
                                <tr key={item.id}>
                                  <td>
                                    <div className={styles.tableProdName}>{item.product_name}</div>
                                  </td>
                                  <td>
                                    <code className={styles.tableSku}>{item.sku}</code>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {item.ordered_quantity.toFixed(4)} {item.ordered_unit}
                                  </td>
                                  <td style={{ textAlign: 'right', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                    {item.base_quantity.toFixed(4)} {item.base_unit}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatINR(item.unit_price)} / {item.ordered_unit}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                    {formatINR(item.total_price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.conversionAuditNotice}>
                          <Info size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                          <span>
                            <strong>Conversion Audit:</strong> Internal database registers both ordered configurations and standardized base units. Pricing calculations verified exact in INR based on mathematical conversion factor matching target units.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className={styles.emptyHistory}>
                  <ClipboardList size={48} className={styles.emptyIcon} />
                  <h3>No previous quotations</h3>
                  <p>You haven't placed any quotations yet. Switch to the "New Quotation" tab to start ordering.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
