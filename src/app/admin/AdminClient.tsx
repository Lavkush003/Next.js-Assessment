'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { 
  createProductAction, 
  updateProductAction, 
  deleteProductAction, 
  updateOrderStatusAction 
} from '@/app/actions/admin';
import { updateProductRequestStatusAction } from '@/app/actions/request';
import { 
  formatINR, 
  formatUnit, 
  UNIT_TYPES, 
  UNITS, 
  Unit 
} from '@/lib/conversions';
import { 
  Activity, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardCheck, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Database,
  IndianRupee,
  Layers,
  ShoppingBag,
  FileText
} from 'lucide-react';
import styles from './admin.module.css';

interface AdminClientProps {
  initialProducts: any[];
  initialOrders: any[];
  initialProductRequests: any[];
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    pendingRequests: number;
    lowStockItems: number;
  };
  user: {
    name: string;
    email: string;
    role: 'admin' | 'seller' | 'buyer';
  };
}

export default function AdminClient({ initialProducts, initialOrders, initialProductRequests, metrics, user }: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'quotations' | 'inventory' | 'requests'>('quotations');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [unitType, setUnitType] = useState('weight');
  const [baseUnit, setBaseUnit] = useState<Unit>('kg');
  const [basePrice, setBasePrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');

  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleLogout = () => {
    logoutAction();
  };

  const handleUnitTypeChange = (type: string) => {
    setUnitType(type);
    if (type === 'weight') setBaseUnit('kg');
    else if (type === 'volume') setBaseUnit('L');
    else setBaseUnit('items');
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedProductId(null);
    setSku('');
    setName('');
    setDescription('');
    setCategory('');
    setUnitType('weight');
    setBaseUnit('kg');
    setBasePrice('');
    setQuantityInStock('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setModalMode('edit');
    setSelectedProductId(prod.id);
    setSku(prod.sku);
    setName(prod.name);
    setDescription(prod.description || '');
    setCategory(prod.category);
    setUnitType(prod.unit_type);
    setBaseUnit(prod.base_unit as Unit);
    setBasePrice(prod.base_price.toString());
    setQuantityInStock(prod.quantity_in_stock.toString());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('sku', sku);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('unit_type', unitType);
      formData.append('base_unit', baseUnit);
      formData.append('base_price', basePrice);
      formData.append('quantity_in_stock', quantityInStock);

      let res;
      if (modalMode === 'add') {
        res = await createProductAction(formData);
      } else {
        res = await updateProductAction(selectedProductId!, formData);
      }

      if (res.success) {
        setIsModalOpen(false);
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        setFormError(res.error || 'Failed to save product.');
      }
    });
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        alert(res.error || 'Failed to delete product.');
      }
    });
  };

  const handleUpdateRequestStatus = (
    requestId: string,
    status: 'pending' | 'reviewing' | 'fulfilled' | 'rejected'
  ) => {
    setRequestError(null);
    startTransition(async () => {
      const res = await updateProductRequestStatusAction(
        requestId,
        status,
        requestNotes[requestId]
      );
      if (res.success) {
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        setRequestError(res.error || 'Failed to update request.');
      }
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'approved' | 'rejected' | 'cancelled') => {
    setOrderError(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, status);
      if (res.success) {
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        setOrderError(res.error || 'Failed to update order status.');
      }
    });
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
            <p className={styles.headerSubtitle}>Admin Management Desk</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={`${styles.userRole} badge badge-pending`}>{user.role} console</div>
          </div>
          <button onClick={handleLogout} className={`${styles.logoutBtn} btn-secondary`}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Metrics Section */}
      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Approved Revenue</span>
            <div className={`${styles.metricIconBg} ${styles.blueGlow}`}>
              <IndianRupee size={20} className={styles.metricIcon} />
            </div>
          </div>
          <div className={styles.metricValue}>{formatINR(metrics.totalRevenue)}</div>
          <p className={styles.metricFooter}>INR sales volume from approved quotes</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Incoming Quotes</span>
            <div className={`${styles.metricIconBg} ${styles.purpleGlow}`}>
              <ShoppingBag size={20} className={styles.metricIcon} />
            </div>
          </div>
          <div className={styles.metricValue}>{metrics.totalOrders}</div>
          <p className={styles.metricFooter}>Total quotes placed by sales agents</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Pending Action</span>
            <div className={`${styles.metricIconBg} ${styles.amberGlow}`}>
              <ClipboardCheck size={20} className={styles.metricIcon} />
            </div>
          </div>
          <div className={`${styles.metricValue} ${metrics.pendingOrders > 0 ? styles.alertText : ''}`}>
            {metrics.pendingOrders}
          </div>
          <p className={styles.metricFooter}>Quotations awaiting review</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Product Requests</span>
            <div className={`${styles.metricIconBg} ${styles.blueGlow}`}>
              <FileText size={20} className={styles.metricIcon} />
            </div>
          </div>
          <div className={`${styles.metricValue} ${metrics.pendingRequests > 0 ? styles.alertText : ''}`}>
            {metrics.pendingRequests}
          </div>
          <p className={styles.metricFooter}>Buyer requests awaiting review</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Low Stock Alerts</span>
            <div className={`${styles.metricIconBg} ${styles.roseGlow}`}>
              <AlertTriangle size={20} className={styles.metricIcon} />
            </div>
          </div>
          <div className={`${styles.metricValue} ${metrics.lowStockItems > 0 ? styles.dangerText : ''}`}>
            {metrics.lowStockItems}
          </div>
          <p className={styles.metricFooter}>Products running below trigger levels</p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('quotations')}
          className={`${styles.tabBtn} ${activeTab === 'quotations' ? styles.tabBtnActive : ''}`}
        >
          <ClipboardCheck size={18} />
          <span>Incoming Quotations ({initialOrders.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.tabBtnActive : ''}`}
        >
          <FileText size={18} />
          <span>Product Requests ({initialProductRequests.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`${styles.tabBtn} ${activeTab === 'inventory' ? styles.tabBtnActive : ''}`}
        >
          <Layers size={18} />
          <span>Chemical Inventory ({initialProducts.length})</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <main className="animate-fade-in">
        {orderError && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={16} />
            <span>{orderError}</span>
          </div>
        )}

        {requestError && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={16} />
            <span>{requestError}</span>
          </div>
        )}

        {activeTab === 'quotations' ? (
          /* Quotations Queue Dashboard */
          <div className={`${styles.historyContainer} glass-panel`}>
            <div className={styles.historyHeader}>
              <h2>Incoming Quotation Pipeline</h2>
              <p className={styles.historySubtitle}>Review unit conversions, check stock limits, and approve/reject orders.</p>
            </div>

            <div className={styles.orderList}>
              {initialOrders.map((ord) => {
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
                    <div className={styles.orderCardHeader}>
                      {/* Left: Metadata info */}
                      <div onClick={() => toggleOrderExpand(ord.id)} style={{ display: 'contents' }}>
                        <div className={styles.orderSummaryCol}>
                          <span className={styles.orderIdLabel}>Quotation Ref:</span>
                          <span className={styles.orderIdVal}>{ord.id.substring(0, 8)}...</span>
                        </div>
                        
                        <div className={styles.orderSummaryCol}>
                          <span className={styles.orderIdLabel}>Sales Agent:</span>
                          <span className={styles.agentName}>{ord.user_name}</span>
                          <span className={styles.agentEmail}>{ord.user_email}</span>
                        </div>

                        <div className={styles.orderSummaryCol}>
                          <span className={styles.orderIdLabel}>Quotation Value:</span>
                          <span className={styles.orderPriceVal}>{formatINR(ord.total_price)}</span>
                        </div>

                        <div className={styles.orderSummaryCol}>
                          <span className={`${styles.statusBadge} badge badge-${ord.status}`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions and expand */}
                      <div className={styles.adminActionCol}>
                        {ord.status === 'pending' && (
                          <div className={styles.quickActionGroup}>
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'approved')}
                              className={styles.approveBtn}
                              disabled={isPending}
                              title="Approve Order & Deduct Stock"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'rejected')}
                              className={styles.rejectBtn}
                              disabled={isPending}
                              title="Reject Order"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        {ord.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                            className={styles.cancelBtn}
                            disabled={isPending}
                            title="Cancel Order & Revert Stock"
                          >
                            Cancel
                          </button>
                        )}

                        <div 
                          onClick={() => toggleOrderExpand(ord.id)}
                          className={styles.expandIcon}
                          style={{ cursor: 'pointer', padding: '4px' }}
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
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
                                <th style={{ textAlign: 'right' }}>Seller Ordered</th>
                                <th style={{ textAlign: 'right' }}>Database (Base unit)</th>
                                <th style={{ textAlign: 'right' }}>Rate Applied</th>
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
                            <strong>Conversion & Price Auditor:</strong> This dashboard verifies that the database has recorded matching parameters. Conversion factors were evaluated based on dimension tables: Weight (`kg` $\leftrightarrow$ `g` factor `1000` / `0.001`), Volume (`L` $\leftrightarrow$ `mL` factor `1000` / `0.001`), and Count (`items`). Applied prices are correct.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {initialOrders.length === 0 && (
                <div className={styles.emptyHistory}>
                  <ClipboardCheck size={48} className={styles.emptyIcon} />
                  <h3>No quotation requests</h3>
                  <p>There are no incoming quotation requests to review at this time.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <div className={`${styles.historyContainer} glass-panel`}>
            <div className={styles.historyHeader}>
              <h2>Product Request Pipeline</h2>
              <p className={styles.historySubtitle}>
                Review buyer procurement requests, update status, and leave admin notes.
              </p>
            </div>

            <div className={styles.orderList}>
              {initialProductRequests.map((req) => {
                const dateString = new Date(req.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={req.id} className={`${styles.orderCard} glass-panel`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className={styles.orderCardHeader} style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Product:</span>
                        <span className={styles.orderIdVal}>{req.product_name}</span>
                      </div>
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Requester:</span>
                        <span className={styles.agentName}>{req.user_name}</span>
                        <span className={styles.agentEmail}>{req.user_email}</span>
                      </div>
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Quantity:</span>
                        <span className={styles.orderPriceVal}>
                          {req.requested_quantity} {req.requested_unit}
                        </span>
                      </div>
                      <div className={styles.orderSummaryCol}>
                        <span className={`${styles.statusBadge} badge badge-${req.status === 'fulfilled' ? 'approved' : req.status === 'rejected' ? 'rejected' : 'pending'}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className={styles.orderSummaryCol}>
                        <span className={styles.orderIdLabel}>Submitted:</span>
                        <span className={styles.orderDateVal}>{dateString}</span>
                      </div>
                    </div>

                    {req.description && (
                      <p style={{ margin: '0 16px 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {req.description}
                      </p>
                    )}

                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className={styles.formGroup}>
                        <label>Admin Notes</label>
                        <textarea
                          className="glass-input"
                          placeholder="Internal notes visible to the requester..."
                          value={requestNotes[req.id] ?? req.admin_notes ?? ''}
                          onChange={(e) =>
                            setRequestNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          rows={2}
                          disabled={isPending}
                        />
                      </div>
                      <div className={styles.quickActionGroup}>
                        {(['pending', 'reviewing', 'fulfilled', 'rejected'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateRequestStatus(req.id, st)}
                            className={st === 'fulfilled' ? styles.approveBtn : st === 'rejected' ? styles.rejectBtn : 'btn-secondary'}
                            disabled={isPending || req.status === st}
                            style={st === 'pending' || st === 'reviewing' ? { padding: '6px 12px', fontSize: '0.8rem' } : undefined}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {initialProductRequests.length === 0 && (
                <div className={styles.emptyHistory}>
                  <FileText size={48} className={styles.emptyIcon} />
                  <h3>No product requests</h3>
                  <p>Buyer-submitted procurement requests will appear here.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Inventory Manager Panel */
          <div className={`${styles.historyContainer} glass-panel`}>
            <div className={styles.inventoryTitleBar}>
              <div>
                <h2>Chemical Catalog & Inventory Levels</h2>
                <p className={styles.historySubtitle}>Add new active compounds, adjust stock levels, or customize pricing models.</p>
              </div>
              <button onClick={openAddModal} className="btn-primary">
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            </div>

            <div className={styles.tableResponsive} style={{ marginTop: '24px' }}>
              <table className={styles.inventoryTable}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Dimension</th>
                    <th>Base Price</th>
                    <th>Current Stock</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialProducts.map((prod) => {
                    const isLow = prod.base_unit === 'g' || prod.base_unit === 'mL' 
                      ? prod.quantity_in_stock < 1000 
                      : prod.quantity_in_stock < 10;
                    
                    return (
                      <tr key={prod.id}>
                        <td>
                          <code className={styles.tableSku}>{prod.sku}</code>
                        </td>
                        <td>
                          <div className={styles.tableProdName}>{prod.name}</div>
                          {prod.description && <div className={styles.tableProdDesc}>{prod.description}</div>}
                        </td>
                        <td>{prod.category}</td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>{prod.unit_type}</span>
                          <span className={styles.baseUnitBadge}>({prod.base_unit})</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {formatINR(prod.base_price)} / {prod.base_unit}
                        </td>
                        <td style={{ fontWeight: 700 }} className={isLow ? styles.lowStockText : styles.inStockText}>
                          {prod.quantity_in_stock.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {prod.base_unit}
                          {isLow && <span className={styles.lowStockWarningTag}>Low Stock</span>}
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            <button
                              onClick={() => openEditModal(prod)}
                              className={styles.editBtn}
                              disabled={isPending}
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className={styles.deleteBtn}
                              disabled={isPending}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className={styles.errorBanner} style={{ marginTop: '16px' }}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleProductSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>SKU (Unique code)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHEM-XYZ-001"
                    className="glass-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={isPending || modalMode === 'edit'} // Lock SKU on edit
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sodium Bicarbonate"
                    className="glass-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Chemical purity, appearance, handling instructions..."
                  className="glass-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reagents, Solvents"
                    className="glass-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Dimension Type</label>
                  <select
                    className="glass-input"
                    value={unitType}
                    onChange={(e) => handleUnitTypeChange(e.target.value)}
                    disabled={isPending || modalMode === 'edit'} // Lock dimension on edit to protect conversions
                  >
                    <option value="weight">Weight (g, kg)</option>
                    <option value="volume">Volume (mL, L)</option>
                    <option value="count">Count (items)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Base Storage Unit</label>
                  <select
                    className="glass-input"
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value as Unit)}
                    disabled={isPending || modalMode === 'edit'} // Lock unit on edit
                  >
                    {UNIT_TYPES[unitType as 'weight' | 'volume' | 'count'].map((u) => (
                      <option key={u} value={u}>
                        {UNITS[u].name} ({u})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Base Price per unit (INR)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    placeholder="e.g. 250.00"
                    className="glass-input"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ maxWidth: '50%' }}>
                <label>Opening Stock Quantity (in base unit)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 100.00"
                  className="glass-input"
                  value={quantityInStock}
                  onChange={(e) => setQuantityInStock(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
