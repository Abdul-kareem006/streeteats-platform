import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Shield, Loader2, Users, Store, Truck, Search, AlertTriangle, TrendingUp, IndianRupee, ShoppingCart, MessageSquare, Plus, CheckCircle, PackageCheck, Package, Trash2, MapPin } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [unverifiedUsers, setUnverifiedUsers] = useState({ vendors: [], suppliers: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [grievances, setGrievances] = useState([]);
    const [grievancesLoading, setGrievancesLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // New state holding platform-wide lists
    const [allVendors, setAllVendors] = useState([]);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [allOrders, setAllOrders] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedUserType = localStorage.getItem('userType');
        if (!storedUser || storedUserType !== 'admin') { navigate('/login'); return; }
        fetchUnverifiedUsers();
        fetchStats();
    }, [navigate]);

    const fetchUnverifiedUsers = async () => {
        try {
            const response = await fetch('/api/admin/unverified-users', { headers: { 'x-admin-id': 'admin' } });
            let data;
            try { data = await response.json(); } catch { data = { vendors: [], suppliers: [] }; }
            setUnverifiedUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch unverified users:', error);
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats', { headers: { 'x-admin-id': 'admin' } });
            let data; try { data = await response.json(); } catch { data = {}; }
            setStats(data);

            const vRes = await fetch('/api/admin/vendors', { headers: { 'x-admin-id': 'admin' } });
            const vData = await vRes.json();
            setAllVendors(vData.vendors || []);

            const sRes = await fetch('/api/admin/suppliers', { headers: { 'x-admin-id': 'admin' } });
            const sData = await sRes.json();
            setAllSuppliers(sData.suppliers || []);

            const oRes = await fetch('/api/admin/orders', { headers: { 'x-admin-id': 'admin' } });
            const oData = await oRes.json();
            setAllOrders(oData.orders || []);
        } catch (error) { console.error('Failed to fetch stats/lists:', error); }
    };

    const fetchGrievances = async () => {
        setGrievancesLoading(true);
        try {
            const response = await fetch('/api/grievances');
            let data;
            try { data = await response.json(); } catch { data = {}; }
            setGrievances(data.grievances || []);
        } catch (error) { console.error('Failed to fetch grievances:', error); }
        finally { setGrievancesLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'grievances') fetchGrievances();
        // optionally refetch stats when hitting overview or specific list
        if (['overview', 'vendors', 'suppliers', 'orders'].includes(activeTab)) fetchStats();
    }, [activeTab]);

    const handleVerify = async (userType, id) => {
        try {
            const response = await fetch(`/api/admin/${userType}/${id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin' }
            });
            if (response.ok) { fetchUnverifiedUsers(); fetchStats(); }
        } catch (error) { console.error('Verification failed:', error); }
    };

    const handleReject = async (userType, id) => {
        if (!window.confirm('Are you sure you want to reject and delete this user?')) return;
        try {
            const response = await fetch(`/api/admin/reject-user/${userType}/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-id': 'admin' }
            });
            if (response.ok) fetchUnverifiedUsers();
        } catch (error) { console.error('Rejection failed:', error); }
    };

    const handleSuspendVendor = async (id) => {
        if (!window.confirm('Are you sure you want to suspend this vendor?')) return;
        try {
            const response = await fetch(`/api/admin/vendor/${id}/suspend`, {
                method: 'PATCH',
                headers: { 'x-admin-id': 'admin' }
            });
            if (response.ok) fetchStats();
            else { const err = await response.json(); alert(err.error || 'Failed to suspend vendor'); }
        } catch (error) { console.error('Suspend vendor failed:', error); }
    };

    const handleRemoveSupplier = async (id) => {
        if (!window.confirm('Are you sure you want to remove this supplier?')) return;
        try {
            const response = await fetch(`/api/admin/supplier/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-id': 'admin' }
            });
            if (response.ok) fetchStats();
            else { const err = await response.json(); alert(err.error || 'Failed to remove supplier'); }
        } catch (error) { console.error('Remove supplier failed:', error); }
    };

    const handleSuspendSupplier = async (id) => {
        if (!window.confirm('Are you sure you want to suspend this supplier?')) return;
        try {
            const response = await fetch(`/api/admin/supplier/${id}/suspend`, {
                method: 'PATCH',
                headers: { 'x-admin-id': 'admin' }
            });
            if (response.ok) fetchStats();
            else { const err = await response.json(); alert(err.error || 'Failed to suspend supplier'); }
        } catch (error) { console.error('Suspend supplier failed:', error); }
    };

    const handleUnsuspendSupplier = async (id) => {
        if (!window.confirm('Are you sure you want to reactivate this supplier?')) return;
        try {
            const response = await fetch(`/api/admin/supplier/${id}/unsuspend`, {
                method: 'PATCH',
                headers: { 'x-admin-id': 'admin' }
            });
            if (response.ok) fetchStats();
            else { const err = await response.json(); alert(err.error || 'Failed to unsuspend supplier'); }
        } catch (error) { console.error('Unsuspend supplier failed:', error); }
    };

    // Helper functions
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    };

    const filterUsers = (users) =>
        users.filter(u =>
            u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.shopname?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Helpers for rendering the new tabs
    const renderVendorRow = (user) => (
        <tr key={user._id} className="hover:bg-slate-50 transition-colors bg-white">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-orange-500">
                            {getInitials(user.fullName)}
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1 mt-2">
                <MapPin className="w-3 h-3 text-gray-400" />{user.shoploc}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{user.ordersPlaced || 0}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {user.isActive === false ? 'Suspended' : 'Active'}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {user.isActive !== false && (
                    <button
                        onClick={() => handleSuspendVendor(user._id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1 font-semibold ml-auto"
                    >
                        <Shield className="w-4 h-4" /> Suspend
                    </button>
                )}
            </td>
        </tr>
    );

    const renderSupplierRow = (user) => (
        <tr key={user._id} className="hover:bg-slate-50 transition-colors bg-white">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">{user.shopname}</div>
                <div className="text-xs text-gray-500">{user.fullName}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />{user.shoploc}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.verified ? (user.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') : 'bg-amber-100 text-amber-800'}`}>
                    {user.verified ? (user.isSuspended ? 'Suspended' : 'Active') : 'Pending'}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{user.ordersCompleted || 0}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-4 justify-end">
                    {!user.verified && (
                        <button onClick={() => handleVerify('supplier', user._id)} className="text-green-600 hover:text-green-900 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Verify
                        </button>
                    )}
                    {user.verified && !user.isSuspended && (
                        <button onClick={() => handleSuspendSupplier(user._id)} className="text-amber-600 hover:text-amber-900 font-semibold flex items-center gap-1">
                            <Shield className="w-4 h-4" /> Suspend
                        </button>
                    )}
                    {user.verified && user.isSuspended && (
                        <button onClick={() => handleUnsuspendSupplier(user._id)} className="text-blue-600 hover:text-blue-900 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Unsuspend
                        </button>
                    )}
                    <button onClick={() => handleRemoveSupplier(user._id)} className="text-red-600 hover:text-red-900 font-semibold flex items-center gap-1">
                        <Trash2 className="w-4 h-4" /> Remove
                    </button>
                </div>
            </td>
        </tr>
    );

    const STATUS_CONFIG = {
        pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        accepted: { label: 'Accepted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        packed: { label: 'Packed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
        cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-10 w-10 text-slate-700 animate-spin mx-auto" />
                <p className="mt-4 text-gray-500 text-sm">Loading admin panel...</p>
            </div>
        </div>
    );

    const totalPending = unverifiedUsers.vendors.length + unverifiedUsers.suppliers.length;

    const ISSUE_COLORS = {
        Quality: 'bg-red-50 text-red-700 border-red-200',
        Delivery: 'bg-amber-50 text-amber-700 border-amber-200',
        Payment: 'bg-blue-50 text-blue-700 border-blue-200',
        Other: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    const UserCard = ({ user, type, gradient }) => (
        <div className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors group">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                {getInitials(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{user.fullName}</h3>
                <p className="text-sm text-gray-500 truncate">{user.shopname} — {user.shoploc}</p>
                <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    <span>GST: {user.gst}</span>
                    <span>📞 {user.phone}</span>
                </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button
                    onClick={() => handleVerify(type, user._id)}
                    className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow-md hover:shadow-green-200/50 transition-all duration-200 hover:-translate-y-0.5"
                >
                    <Check className="h-3.5 w-3.5 mr-1" /> Verify
                </button>
                <button
                    onClick={() => handleReject(type, user._id)}
                    className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-sm hover:shadow-md hover:shadow-red-200/50 transition-all duration-200 hover:-translate-y-0.5"
                >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'vendors', label: 'Vendors' },
        { id: 'suppliers', label: 'Suppliers' },
        { id: 'orders', label: 'Orders' },
        { id: 'grievances', label: 'Grievances' },
        { id: 'verifications', label: `Verifications${totalPending > 0 ? ` (${totalPending})` : ''}` },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-slate-300 text-sm mt-0.5">Manage platform operations</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                {/* Tabs Wrapper */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
                        <nav className="flex whitespace-nowrap">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id
                                        ? 'border-slate-700 text-slate-900 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Platform Statistics</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm"><Store className="w-4 h-4 text-orange-500" /> Vendors</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm"><Truck className="w-4 h-4 text-blue-500" /> Suppliers</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats?.totalSuppliers || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm"><ShoppingCart className="w-4 h-4 text-emerald-500" /> Total Orders</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm"><IndianRupee className="w-4 h-4 text-green-500" /> Total Transaction Value</div>
                                        <div className="text-2xl font-bold text-green-600">₹{stats?.totalRevenue || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-2 hover:shadow-md transition">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm"><MessageSquare className="w-4 h-4 text-purple-500" /> Grievances</div>
                                        <div className="text-2xl font-bold text-gray-900">{stats?.totalGrievances || 0}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VENDORS TAB */}
                        {activeTab === 'vendors' && (
                            <div className="animate-fade-in overflow-x-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">All Registered Vendors</h2>
                                </div>
                                <table className="min-w-full divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {allVendors.map(v => renderVendorRow(v))}
                                        {allVendors.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No vendors found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* SUPPLIERS TAB */}
                        {activeTab === 'suppliers' && (
                            <div className="animate-fade-in overflow-x-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">All Registered Suppliers</h2>
                                </div>
                                <table className="min-w-full divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Orders Completed</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {allSuppliers.map(s => renderSupplierRow(s))}
                                        {allSuppliers.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No suppliers found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Platform Raw Material Orders</h2>
                                <div className="space-y-4">
                                    {allOrders.map(order => {
                                        const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                        return (
                                            <div key={order._id} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">From:</span> {order.vendorShop || order.vendorName}
                                                        <MapPin className="w-3 h-3 text-gray-400 inline" /> <span className="text-gray-500 text-sm">{order.vendorLocation}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-gray-900">To:</span> {order.supplierName}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()} • {order.items.length} items</div>
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500">Total</div>
                                                        <div className="font-bold text-gray-900">₹{order.subtotal}</div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>{statusCfg.label}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {allOrders.length === 0 && <div className="text-center py-8 text-gray-500">No orders placed on the platform yet.</div>}
                                </div>
                            </div>
                        )}
                        {/* Verifications Tab */}
                        {activeTab === 'verifications' && (
                            <div className="animate-fade-in">
                                {/* Search */}
                                <div className="relative mb-6">
                                    <Search className="absolute top-3.5 left-4 text-gray-400 h-5 w-5" />
                                    <input type="text" placeholder="Search pending users by name or shop..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all shadow-sm" />
                                </div>

                                <div className="space-y-6">
                                    {/* Vendors Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex items-center gap-2">
                                            <Store className="h-5 w-5 text-orange-500" />
                                            <h2 className="text-base font-semibold text-gray-900">Pending Vendor Verifications</h2>
                                            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">{unverifiedUsers.vendors.length}</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {filterUsers(unverifiedUsers.vendors).length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No pending vendor verifications</p>
                                                </div>
                                            ) : (
                                                filterUsers(unverifiedUsers.vendors).map((vendor) => (
                                                    <UserCard key={vendor._id} user={vendor} type="vendor" gradient="from-orange-500 to-red-500" />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Suppliers Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-blue-500" />
                                            <h2 className="text-base font-semibold text-gray-900">Pending Supplier Verifications</h2>
                                            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">{unverifiedUsers.suppliers.length}</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {filterUsers(unverifiedUsers.suppliers).length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No pending supplier verifications</p>
                                                </div>
                                            ) : (
                                                filterUsers(unverifiedUsers.suppliers).map((supplier) => (
                                                    <UserCard key={supplier._id} user={supplier} type="supplier" gradient="from-blue-500 to-indigo-500" />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grievances Tab */}
                        {activeTab === 'grievances' && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">All Grievances</h2>
                                {grievancesLoading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="h-8 w-8 text-slate-500 animate-spin mx-auto" />
                                        <p className="mt-3 text-sm text-gray-500">Loading grievances...</p>
                                    </div>
                                ) : grievances.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400">
                                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                        <p>No grievances submitted yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {grievances.map(g => (
                                            <div key={g._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all bg-white">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-red-50 p-2 rounded-lg">
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 text-sm">{g.vendorName}</h3>
                                                            <p className="text-xs text-gray-400">{g.vendorLocation} • {new Date(g.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${ISSUE_COLORS[g.issueType] || ISSUE_COLORS.Other}`}>
                                                        {g.issueType}
                                                    </span>
                                                </div>
                                                <div className="mb-2">
                                                    <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Against:</span> {g.supplierName} ({g.supplierShop})</p>
                                                </div>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{g.issueDetails}</p>
                                                {g.attachments && g.attachments.length > 0 && (
                                                    <p className="mt-2 text-xs text-gray-400">📎 {g.attachments.length} attachment(s)</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="h-8"></div>
        </div>
    );
};

export default AdminDashboard;
