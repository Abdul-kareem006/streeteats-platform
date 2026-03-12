import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingCart, AlertTriangle, Search, Loader2, MapPin, Plus, Minus, Trash2, X as XIcon, Clock, Package, CheckCircle, Truck, ArrowDownUp, Star, ShieldCheck, TrendingUp, IndianRupee, Users, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', canCancel: true },
    accepted: { label: 'Accepted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    packed: { label: 'Packed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const CART_STORAGE_KEY = 'streeteats_vendor_cart';

const TrustBadge = ({ supplier }) => (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
        {supplier.verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" /> Verified
            </span>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${supplier.trustScore >= 75 ? 'bg-green-50 text-green-700 border border-green-200' : supplier.trustScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            Trust: {supplier.trustScore || 0}%
        </span>
        <span className="text-[10px] text-gray-400">
            {supplier.completedOrders || 0} orders • {supplier.grievanceCount || 0} complaints
        </span>
    </div>
);

// Deterministic mock distance based on ID
const getDistance = (id) => {
    if (!id) return "2.5";
    const charCode = id.charCodeAt(id.length - 1) || 0;
    return ((charCode % 8) + 1.2).toFixed(1);
};

const VendorDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('suppliers');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [sortByPrice, setSortByPrice] = useState(false);

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [vendorStats, setVendorStats] = useState(null);

    const [grievance, setGrievance] = useState({
        supplierName: '', supplierShop: '', issueType: 'Quality', issueDetails: '', attachments: null
    });

    // Load cart from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (saved) setCart(JSON.parse(saved));
        } catch { /* ignore parse errors */ }
    }, []);

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedUserType = localStorage.getItem('userType');
        if (!storedUser || storedUserType !== 'vendor') { navigate('/login'); return; }
        setUser(JSON.parse(storedUser));
        fetchSuppliers();
    }, [navigate]);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/all-users');
            let data; try { data = await response.json(); } catch { data = {}; }
            if (data.suppliers) setSuppliers(data.suppliers);
            setLoading(false);
        } catch (error) { console.error('Failed to fetch suppliers:', error); setLoading(false); }
    };

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setOrdersLoading(true);
        try {
            const response = await fetch(`/api/orders/vendor/${user.phone}`);
            let data; try { data = await response.json(); } catch { data = {}; }
            setOrders(data.orders || []);
        } catch (error) { console.error('Failed to fetch orders:', error); }
        finally { setOrdersLoading(false); }
    }, [user]);

    const fetchVendorStats = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/orders/vendor/${user.phone}/stats`);
            let data; try { data = await response.json(); } catch { data = {}; }
            setVendorStats(data);
        } catch (error) { console.error('Failed to fetch stats:', error); }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'orders' && user) { fetchOrders(); fetchVendorStats(); }
    }, [activeTab, user, fetchOrders, fetchVendorStats]);

    const handleViewInventory = async (supplier) => {
        setSelectedSupplier(supplier);
        setInventoryLoading(true);
        setSortByPrice(false);
        try {
            const response = await fetch(`/api/supplier/inventory/${supplier.phone}`);
            let data; try { data = await response.json(); } catch { data = {}; }
            setInventoryItems(data.success ? data.inventoryItems : []);
        } catch (error) { console.error('Failed to fetch inventory:', error); setInventoryItems([]); }
        finally { setInventoryLoading(false); }
    };

    const closeInventory = () => { setSelectedSupplier(null); setInventoryItems([]); };

    const addToCart = (item, supplier) => {
        if (item.stock <= 0) { toast('This item is out of stock', 'warning'); return; }
        setCart(prev => {
            const existing = prev.find(c => c._id === item._id);
            if (existing) {
                if (existing.quantity >= item.stock) { toast(`Only ${item.stock} units in stock`, 'warning'); return prev; }
                return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
            }
            toast(`${item.name} added to cart`, 'success');
            return [...prev, { ...item, quantity: item.minOrder || 1, supplierName: supplier.shopname, supplierPhone: supplier.phone }];
        });
    };

    const removeFromCart = (itemId) => setCart(prev => prev.filter(c => c._id !== itemId));

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(c => {
            if (c._id !== itemId) return c;
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > c.stock) { toast(`Only ${c.stock} units in stock`, 'warning'); return c; }
            if (c.minOrder && newQty < c.minOrder) { toast(`Minimum order is ${c.minOrder} units`, 'warning'); return c; }
            return { ...c, quantity: newQty };
        }).filter(Boolean));
    };

    const clearCart = () => { setCart([]); localStorage.removeItem(CART_STORAGE_KEY); };
    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    // Group cart by supplier for confirmation modal
    const cartBySupplier = cart.reduce((acc, item) => {
        if (!acc[item.supplierName]) acc[item.supplierName] = [];
        acc[item.supplierName].push(item);
        return acc;
    }, {});

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        // Validate MOQ before showing modal
        for (const item of cart) {
            if (item.minOrder && item.quantity < item.minOrder) {
                toast(`Minimum order for ${item.name} is ${item.minOrder} units`, 'error');
                return;
            }
        }
        setShowConfirmModal(true);
    };

    const confirmOrder = async () => {
        setPlacingOrder(true);
        setShowConfirmModal(false);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorPhone: user.phone, vendorName: user.fullName,
                    vendorShop: user.shopname, vendorLocation: user.shoploc,
                    items: cart, totalAmount: cartTotal, paymentMethod
                })
            });
            let data; try { data = await response.json(); } catch { data = {}; }
            if (data.success) {
                toast('Raw material order placed successfully! 🎉', 'success');
                clearCart();
                setActiveTab('orders');
                fetchOrders();
            } else {
                toast(data.error || 'Failed to place order', 'error');
            }
        } catch (error) { toast('Failed to place order. Please try again.', 'error'); }
        finally { setPlacingOrder(false); }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
            let data; try { data = await response.json(); } catch { data = {}; }
            if (response.ok) {
                toast('Order cancelled successfully', 'info');
                fetchOrders();
            } else {
                toast(data.error || 'Cannot cancel this order', 'error');
            }
        } catch (error) { toast('Failed to cancel order', 'error'); }
    };

    const handleGrievanceSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('supplierName', grievance.supplierName);
        formData.append('supplierShop', grievance.supplierShop);
        formData.append('vendorName', user.name || user.fullName);
        formData.append('vendorLocation', user.shoploc);
        formData.append('issueDate', new Date().toISOString());
        formData.append('issueType', grievance.issueType);
        formData.append('issueDetails', grievance.issueDetails);
        formData.append('postedBy', 'vendor');
        if (grievance.attachments) {
            for (let i = 0; i < grievance.attachments.length; i++) formData.append('attachments', grievance.attachments[i]);
        }
        try {
            const response = await fetch('/api/grievance', { method: 'POST', body: formData });
            if (response.ok) {
                toast('Complaint submitted successfully', 'success');
                setGrievance({ supplierName: '', supplierShop: '', issueType: 'Quality', issueDetails: '', attachments: null });
            } else { toast('Failed to submit complaint', 'error'); }
        } catch (error) { console.error('Error submitting grievance:', error); }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.shopname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shoploc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.area?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedItems = sortByPrice ? [...inventoryItems].sort((a, b) => a.price - b.price) : inventoryItems;

    // Calculate Recommended Reorders based on past orders
    const recommendedReorders = [];
    if (orders.length > 0) {
        const itemFreq = {};
        orders.forEach(order => {
            if (order.status !== 'cancelled' && order.status !== 'rejected') {
                order.items.forEach(item => {
                    if (!itemFreq[item.name]) itemFreq[item.name] = { ...item, count: 0, supplierPhone: order.supplierPhone, supplierName: order.supplierName };
                    itemFreq[item.name].count += 1;
                });
            }
        });
        const sortedFreq = Object.values(itemFreq).sort((a, b) => b.count - a.count).slice(0, 4);
        if (sortedFreq.length > 0) Object.assign(recommendedReorders, sortedFreq);
    }

    const tabs = [
        { id: 'suppliers', label: 'Browse Suppliers', icon: Store },
        { id: 'cart', label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}`, icon: ShoppingCart },
        { id: 'orders', label: 'Orders', icon: Clock },
        { id: 'grievance', label: 'Report Issue', icon: AlertTriangle },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center"><Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" /><p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
                    <p className="text-orange-100 mt-1">Source raw materials for {user?.shopname} 👋</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-100 bg-gray-50/50">
                        <nav className="flex overflow-x-auto">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap px-3 ${activeTab === tab.id ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    <tab.icon className="h-4 w-4" />{tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">

                        {/* ═══ SUPPLIERS TAB ═══ */}
                        {activeTab === 'suppliers' && !selectedSupplier && (
                            <div className="animate-fade-in">

                                {/* Recommended Reorders Section */}
                                {recommendedReorders.length > 0 && !searchTerm && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-orange-500" /> Recommended Reorders
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {recommendedReorders.map((item, idx) => (
                                                <div key={idx} className="border border-orange-100 bg-orange-50/30 rounded-xl p-4 hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-medium">Reorder</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-3">From {item.supplierName}</p>
                                                    <button onClick={() => {
                                                        const supplier = suppliers.find(s => s.phone === item.supplierPhone);
                                                        if (supplier) handleViewInventory(supplier);
                                                        else toast('Supplier unavailable', 'warning');
                                                    }} className="w-full text-xs font-semibold text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 py-2 rounded-lg transition-all">
                                                        View Inventory
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="relative mb-6">
                                    <Search className="absolute top-3.5 left-4 text-gray-400 h-5 w-5" />
                                    <input type="text" placeholder="Search suppliers by name, city, or area..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm bg-gray-50/50 transition-all" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredSuppliers.map(supplier => (
                                        <div key={supplier._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5 bg-white group">
                                            <div className="flex items-start mb-1">
                                                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2.5 rounded-xl text-white shadow-sm">
                                                    <Store className="h-5 w-5" />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <h3 className="text-base font-semibold text-gray-900">{supplier.shopname}</h3>
                                                    <p className="text-xs text-gray-500 flex items-center mt-0.5 mb-1">
                                                        <MapPin className="h-3 w-3 mr-1" />{supplier.area ? `${supplier.area}, ` : ''}{supplier.city || supplier.shoploc}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                                                        Distance: ~{getDistance(supplier._id)} km
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${supplier.shopStatus ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                    {supplier.shopStatus ? '🟢 Accepting' : '🔴 Closed'}
                                                </span>
                                            </div>
                                            {(supplier.trustScore && supplier.trustScore >= 80) && (
                                                <div className="mb-2 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 shadow-sm">
                                                        ⭐ Highly Trusted Supplier
                                                    </span>
                                                </div>
                                            )}
                                            <TrustBadge supplier={supplier} />
                                            <button onClick={() => handleViewInventory(supplier)}
                                                className="w-full mt-3 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 rounded-xl hover:from-orange-700 hover:to-red-700 text-sm font-medium transition-all duration-300 hover:shadow-md hover:shadow-orange-200/50">
                                                View Inventory
                                            </button>
                                        </div>
                                    ))}
                                    {filteredSuppliers.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-gray-400">
                                            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No suppliers found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══ INVENTORY VIEW ═══ */}
                        {activeTab === 'suppliers' && selectedSupplier && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Inventory: {selectedSupplier.shopname}</h2>
                                        <TrustBadge supplier={selectedSupplier} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSortByPrice(!sortByPrice)}
                                            className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${sortByPrice ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            <ArrowDownUp className="h-3 w-3" />{sortByPrice ? 'Price ↑' : 'Sort by Price'}
                                        </button>
                                        <button onClick={closeInventory} className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors">← Back</button>
                                    </div>
                                </div>
                                {inventoryLoading ? (
                                    <div className="text-center py-12"><Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" /><p className="mt-3 text-sm text-gray-500">Loading inventory...</p></div>
                                ) : displayedItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400"><Package className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No raw materials available from this supplier.</p></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {displayedItems.map(item => {
                                            const outOfStock = item.stock <= 0;
                                            const inCart = cart.find(c => c._id === item._id);
                                            return (
                                                <div key={item._id} className={`border ${outOfStock ? 'border-gray-200 bg-gray-50' : 'border-gray-100 hover:shadow-md hover:border-orange-100'} p-4 rounded-xl flex justify-between items-center transition-all duration-200 bg-white`}>
                                                    <div>
                                                        <h3 className={`font-semibold ${outOfStock ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">Stock: {item.stock} units {item.minOrder > 1 ? `• Min order: ${item.minOrder}` : ''}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-lg font-bold ${outOfStock ? 'text-gray-400' : 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'}`}>₹{item.price}/unit</p>
                                                        {outOfStock ? (
                                                            <span className="mt-1.5 text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-100 inline-block">Out of Stock</span>
                                                        ) : (
                                                            <button onClick={() => addToCart(item, selectedSupplier)} disabled={outOfStock}
                                                                className="mt-1.5 text-xs text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto">
                                                                <Plus className="h-3 w-3" />{inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ CART TAB ═══ */}
                        {activeTab === 'cart' && (
                            <div className="animate-fade-in">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="bg-gray-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShoppingCart className="h-10 w-10 text-gray-300" /></div>
                                        <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
                                        <p className="mt-1 text-sm text-gray-500">Browse suppliers to add raw materials.</p>
                                        <button onClick={() => setActiveTab('suppliers')} className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors">Browse Suppliers</button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-5">
                                            <h2 className="text-xl font-bold text-gray-900">Raw Materials ({cartCount} items)</h2>
                                            <button onClick={clearCart} className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"><Trash2 className="h-4 w-4" /> Clear All</button>
                                        </div>
                                        <div className="space-y-3">
                                            {cart.map(item => (
                                                <div key={item._id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-orange-100 transition-all duration-200 bg-white">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">from {item.supplierName} {item.minOrder > 1 ? `• Min: ${item.minOrder}` : ''}</p>
                                                        <p className="text-sm font-medium text-orange-600 mt-1">₹{item.price}/unit</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                                                            <button onClick={() => updateQuantity(item._id, -1)} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"><Minus className="h-3.5 w-3.5" /></button>
                                                            <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item._id, 1)} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"><Plus className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                        <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent w-20 text-right">₹{item.price * item.quantity}</p>
                                                        <button onClick={() => removeFromCart(item._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><XIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 font-medium">Order Total</span>
                                                <span className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">₹{cartTotal}</span>
                                            </div>
                                            <button onClick={handlePlaceOrder} disabled={placingOrder}
                                                className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl hover:from-orange-700 hover:to-red-700 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-orange-200/50 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
                                                {placingOrder ? (<><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</>) : (<><Package className="h-4 w-4" /> Review & Place Order</>)}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ ORDERS TAB ═══ */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                {/* Vendor Insights */}
                                {vendorStats && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-2xl text-white shadow-lg shadow-orange-200/50">
                                            <div className="flex items-center"><div className="bg-white/20 p-2.5 rounded-xl"><Package className="h-5 w-5" /></div>
                                                <div className="ml-3"><p className="text-orange-100 text-xs">Orders Placed</p><p className="text-2xl font-bold">{vendorStats.totalOrders}</p></div></div>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-5 rounded-2xl text-white shadow-lg shadow-green-200/50">
                                            <div className="flex items-center"><div className="bg-white/20 p-2.5 rounded-xl"><IndianRupee className="h-5 w-5" /></div>
                                                <div className="ml-3"><p className="text-green-100 text-xs">Total Spent</p><p className="text-2xl font-bold">₹{vendorStats.totalSpent}</p></div></div>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-200/50">
                                            <div className="flex items-center"><div className="bg-white/20 p-2.5 rounded-xl"><Users className="h-5 w-5" /></div>
                                                <div className="ml-3"><p className="text-blue-100 text-xs">Suppliers Used</p><p className="text-2xl font-bold">{vendorStats.suppliersUsed}</p></div></div>
                                        </div>
                                    </div>
                                )}
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Order History</h2>
                                {ordersLoading ? (
                                    <div className="text-center py-12"><Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" /><p className="mt-3 text-sm text-gray-500">Loading orders...</p></div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400"><Clock className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No orders yet.</p>
                                        <button onClick={() => setActiveTab('suppliers')} className="mt-4 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors">Browse Suppliers</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => {
                                            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                            return (
                                                <div key={order._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-white">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg text-white"><Truck className="h-4 w-4" /></div>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900 text-sm">{order.supplierName}</h3>
                                                                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()} {order.paymentMethod ? `• ${order.paymentMethod}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>{statusCfg.label}</span>
                                                            {statusCfg.canCancel && (
                                                                <button onClick={() => handleCancelOrder(order._id)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all">
                                                                    <XCircle className="h-3 w-3" /> Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 mb-3">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                                                <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                                        <span className="text-sm text-gray-500">Total</span>
                                                        <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">₹{order.subtotal}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ GRIEVANCE TAB ═══ */}
                        {activeTab === 'grievance' && (
                            <div className="max-w-2xl mx-auto animate-fade-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-red-50 p-2.5 rounded-xl"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                                    <div><h3 className="text-lg font-semibold text-gray-900">Report a Supplier Issue</h3><p className="text-sm text-gray-500">Report quality, delivery, or payment problems</p></div>
                                </div>
                                <form onSubmit={handleGrievanceSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Name</label><input type="text" value={grievance.supplierName} onChange={(e) => setGrievance({ ...grievance, supplierName: e.target.value })} className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-sm p-3 transition-all" required /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label><input type="text" value={grievance.supplierShop} onChange={(e) => setGrievance({ ...grievance, supplierShop: e.target.value })} className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-sm p-3 transition-all" required /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Type</label><select value={grievance.issueType} onChange={(e) => setGrievance({ ...grievance, issueType: e.target.value })} className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-sm p-3 transition-all"><option>Quality</option><option>Delivery</option><option>Payment</option><option>Other</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Details</label><textarea rows={4} value={grievance.issueDetails} onChange={(e) => setGrievance({ ...grievance, issueDetails: e.target.value })} className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-sm p-3 transition-all" required /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label><input type="file" multiple onChange={(e) => setGrievance({ ...grievance, attachments: e.target.files })} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" /></div>
                                    <button type="submit" className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-200/50">
                                        <AlertTriangle className="h-4 w-4 mr-2" /> Submit Complaint
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ ORDER CONFIRMATION MODAL ═══ */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                            <p className="text-sm text-gray-500 mt-1">Review your raw material order before confirming</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {Object.entries(cartBySupplier).map(([supplierName, items]) => (
                                <div key={supplierName}>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Store className="h-4 w-4 text-orange-500" /> {supplierName}
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                        {items.map(item => (
                                            <div key={item._id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.name} {item.quantity} × ₹{item.price}</span>
                                                <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="font-semibold text-gray-700">Total Amount</span>
                                <span className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">₹{cartTotal}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                <div className="space-y-2">
                                    {['Cash on Delivery', 'UPI on Delivery', 'Vendor Credit'].map(method => (
                                        <label key={method} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === method ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={(e) => setPaymentMethod(e.target.value)} className="text-orange-600 focus:ring-orange-500" />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={confirmOrder} disabled={placingOrder}
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {placingOrder ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><CheckCircle className="h-4 w-4" /> Confirm Order</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-8"></div>
        </div>
    );
};

export default VendorDashboard;
