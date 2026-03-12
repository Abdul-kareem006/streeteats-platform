import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, Clock, Package, Loader2, ToggleLeft, ToggleRight, Trash2, ShoppingCart, Check, X, Truck, PackageCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', next: 'accepted', nextLabel: 'Accept' },
    accepted: { label: 'Accepted', color: 'bg-blue-50 text-blue-700 border-blue-200', next: 'packed', nextLabel: 'Mark Packed' },
    packed: { label: 'Packed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', next: 'delivered', nextLabel: 'Mark Delivered' },
    delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const SupplierDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [inventoryItems, setInventoryItems] = useState([]);
    const [shopStatus, setShopStatus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [newItem, setNewItem] = useState({ itemname: '', itemcost: '', todaysstock: '', minorder: '1' });
    const knownOrderIds = useRef(new Set());

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedUserType = localStorage.getItem('userType');
        if (!storedUser || storedUserType !== 'supplier') { navigate('/login'); return; }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setShopStatus(parsedUser.shopStatus || false);
        fetchInventory(parsedUser.phone);
        setLoading(false);
    }, [navigate]);

    const fetchInventory = async (phone) => {
        try {
            const response = await fetch(`/api/supplier/inventory/${phone}`);
            let data; try { data = await response.json(); } catch { data = {}; }
            if (data.success) setInventoryItems(data.inventoryItems);
        } catch (error) { console.error('Failed to fetch inventory:', error); }
    };

    const fetchOrders = async (silent = false) => {
        if (!user) return;
        if (!silent) setOrdersLoading(true);
        try {
            const response = await fetch(`/api/orders/supplier/${user.phone}`);
            let data; try { data = await response.json(); } catch { data = {}; }
            const fetchedOrders = data.orders || [];

            // Check for new pending orders
            if (silent && knownOrderIds.current.size > 0) {
                const newPending = fetchedOrders.filter(o => o.status === 'pending' && !knownOrderIds.current.has(o._id));
                if (newPending.length > 0) {
                    toast(`🔔 You have ${newPending.length} new incoming order(s)!`, 'success');
                }
            }

            // Update known orders
            fetchedOrders.forEach(o => knownOrderIds.current.add(o._id));
            setOrders(fetchedOrders);
        } catch (error) { console.error('Failed to fetch orders:', error); }
        finally { if (!silent) setOrdersLoading(false); }
    };

    // Auto-poll orders every 10 seconds across all tabs
    useEffect(() => {
        if (user) {
            fetchOrders();
            const intervalId = setInterval(() => {
                fetchOrders(true);
            }, 10000);
            return () => clearInterval(intervalId);
        }
    }, [user]);

    const handleShopStatusToggle = async () => {
        try {
            const newStatus = !shopStatus;
            const response = await fetch('/api/supplier/shop-status', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: user.phone, status: newStatus })
            });
            let data; try { data = await response.json(); } catch { data = {}; }
            if (response.ok && data.isShopOpen !== undefined) {
                setShopStatus(data.isShopOpen);
                toast(`Status: ${data.isShopOpen ? 'Accepting Orders' : 'Not Accepting Orders'}`, data.isShopOpen ? 'success' : 'info');
            }
        } catch (error) { console.error('Failed to update status:', error); }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                phone: user.phone, shopname: user.shopname, gst: user.gst,
                itemname: newItem.itemname, itemcost: newItem.itemcost,
                todaysstock: newItem.todaysstock, minorder: newItem.minorder
            };
            const response = await fetch('/api/supplier/inventory', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data; try { data = await response.json(); } catch { data = {}; }
            if (data.success) {
                fetchInventory(user.phone);
                setNewItem({ itemname: '', itemcost: '', todaysstock: '', minorder: '1' });
                toast('Raw material added to inventory', 'success');
            } else { toast(data.error || 'Failed to add item', 'error'); }
        } catch (error) { console.error('Error adding item:', error); }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            const response = await fetch(`/api/supplier/inventory/${itemId}`, { method: 'DELETE' });
            let data; try { data = await response.json(); } catch { data = {}; }
            if (data.success) { fetchInventory(user.phone); toast('Item removed', 'info'); }
        } catch (error) { console.error('Error deleting item:', error); }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) { toast(`Order ${status}`, 'success'); fetchOrders(); }
        } catch (error) { console.error('Error updating order:', error); }
    };

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.subtotal || 0), 0);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'orders', label: `Orders${pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ''}` },
        { id: 'inventory', label: 'Inventory Management' },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
                        <p className="text-blue-100 mt-1">Managing inventory for {user?.shopname} 👋</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${shopStatus ? 'bg-green-400/20 text-green-100 border border-green-400/30' : 'bg-red-400/20 text-red-100 border border-red-400/30'}`}>
                            {shopStatus ? '🟢 Accepting Orders' : '🔴 Not Accepting'}
                        </span>
                        <button onClick={handleShopStatusToggle} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 text-sm font-medium transition-all">
                            {shopStatus ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />} Toggle
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50/50">
                        <nav className="flex">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200/50">
                                    <div className="flex items-center"><div className="bg-white/20 p-3 rounded-xl"><Package className="h-6 w-6" /></div>
                                        <div className="ml-4"><p className="text-blue-100 text-sm">Inventory Items</p><p className="text-3xl font-bold">{inventoryItems.length}</p></div></div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl text-white shadow-lg shadow-green-200/50">
                                    <div className="flex items-center"><div className="bg-white/20 p-3 rounded-xl"><Check className="h-6 w-6" /></div>
                                        <div className="ml-4"><p className="text-green-100 text-sm">Completed Orders</p><p className="text-3xl font-bold">{completedOrdersCount}</p></div></div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg shadow-amber-200/50">
                                    <div className="flex items-center"><div className="bg-white/20 p-3 rounded-xl"><ShoppingCart className="h-6 w-6" /></div>
                                        <div className="ml-4"><p className="text-amber-100 text-sm">Pending Orders</p><p className="text-3xl font-bold">{pendingOrdersCount}</p></div></div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-purple-200/50">
                                    <div className="flex items-center"><div className="bg-white/20 p-3 rounded-xl"><Store className="h-6 w-6" /></div>
                                        <div className="ml-4"><p className="text-purple-100 text-sm">Revenue</p><p className="text-3xl font-bold">₹{totalRevenue}</p></div></div>
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Incoming Raw Material Orders</h2>
                                {ordersLoading ? (
                                    <div className="text-center py-12"><Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" /></div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400"><ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No orders received yet.</p></div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => {
                                            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                            return (
                                                <div key={order._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-white">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg text-white"><Store className="h-4 w-4" /></div>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900 text-sm">{order.vendorShop || order.vendorName}</h3>
                                                                <p className="text-xs text-gray-400">{order.vendorLocation} • {new Date(order.createdAt).toLocaleString()}{order.paymentMethod ? ` • ${order.paymentMethod}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>{statusCfg.label}</span>
                                                    </div>
                                                    <div className="space-y-1.5 mb-3">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-gray-600">{item.name} × {item.quantity} units</span>
                                                                <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">₹{order.subtotal}</span>
                                                        <div className="flex gap-2">
                                                            {order.status === 'pending' && (
                                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'rejected')}
                                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all">
                                                                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                                                                </button>
                                                            )}
                                                            {statusCfg.next && (
                                                                <button onClick={() => handleUpdateOrderStatus(order._id, statusCfg.next)}
                                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all">
                                                                    {statusCfg.next === 'accepted' && <Check className="h-3.5 w-3.5 mr-1" />}
                                                                    {statusCfg.next === 'packed' && <PackageCheck className="h-3.5 w-3.5 mr-1" />}
                                                                    {statusCfg.next === 'delivered' && <Truck className="h-3.5 w-3.5 mr-1" />}
                                                                    {statusCfg.nextLabel}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Inventory Management Tab */}
                        {activeTab === 'inventory' && (
                            <div className="animate-fade-in">
                                <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" /> Add Raw Material</h3>
                                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Material Name</label>
                                            <input type="text" value={newItem.itemname} placeholder="e.g. Tomatoes, Rice" onChange={(e) => setNewItem({ ...newItem, itemname: e.target.value })}
                                                className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm p-3 bg-white transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price/unit (₹)</label>
                                            <input type="number" value={newItem.itemcost} placeholder="25" onChange={(e) => setNewItem({ ...newItem, itemcost: e.target.value })}
                                                className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm p-3 bg-white transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
                                            <input type="number" value={newItem.todaysstock} placeholder="100" onChange={(e) => setNewItem({ ...newItem, todaysstock: e.target.value })}
                                                className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm p-3 bg-white transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Order</label>
                                            <input type="number" value={newItem.minorder} placeholder="5" min="1" onChange={(e) => setNewItem({ ...newItem, minorder: e.target.value })}
                                                className="block w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm p-3 bg-white transition-all" required />
                                        </div>
                                        <button type="submit" className="flex justify-center items-center px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50">
                                            <Plus className="h-5 w-5 mr-2" /> Add
                                        </button>
                                    </form>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Raw Material</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price/Unit</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Min Order</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {inventoryItems.map((item, idx) => (
                                                <tr key={item._id} className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || item.itemname}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">₹{item.price || item.itemcost}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {(item.stock || item.todaysstock) <= 0 ? (
                                                            <span className="text-red-500 font-medium">Out of Stock</span>
                                                        ) : (
                                                            `${item.stock || item.todaysstock} units`
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minOrder || 1} units</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button onClick={() => handleDeleteItem(item._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {inventoryItems.length === 0 && (
                                        <div className="text-center py-12 text-gray-400"><Package className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No items in inventory. Add raw materials above!</p></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="h-8"></div>
        </div>
    );
};

export default SupplierDashboard;
