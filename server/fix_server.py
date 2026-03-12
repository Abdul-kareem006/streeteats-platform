import sys

try:
    with open('server.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update register vendor
    content = content.replace(
        'const vendor = { fullName, email, phone, password, shopname, shoploc, aadhar, gst, verified: false, createdAt: new Date() };',
        'const vendor = { fullName, email, phone, password, shopname, shoploc, aadhar, gst, verified: false, isActive: true, createdAt: new Date() };'
    )

    # 2. Update orders POST route
    old_orders = """app.post('/api/orders', async (req, res) => {
    try {
        const { vendorPhone, vendorName, vendorShop, vendorLocation, items, totalAmount, paymentMethod } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });"""

    new_orders = """app.post('/api/orders', async (req, res) => {
    try {
        const { vendorPhone, vendorName, vendorShop, vendorLocation, items, totalAmount, paymentMethod } = req.body;
        
        // Check if vendor is suspended
        const vendor = await db.collection('vendors').findOne({ phone: vendorPhone });
        if (vendor && vendor.isActive === false) {
            return res.status(403).json({ error: 'Your account is suspended. You cannot place new orders.' });
        }

        if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });"""
    content = content.replace(old_orders, new_orders)

    # 3. Handle verifyAdmin
    old_admin_middleware = """// Admin Auth Middleware
const verifyAdmin = (req, res, next) => {
    const adminId = req.headers['x-admin-id'];
    if (adminId !== ADMIN_CREDENTIALS.userId) {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
};

// Get unverified users
app.get('/api/admin/unverified-users', verifyAdmin, async (req, res) => {"""

    new_admin_middleware = """app.use('/api/admin', (req, res, next) => {
    if (req.path === '/login') return next();
    
    // Check role from header / custom token
    const adminId = req.headers['x-admin-id'];
    req.user = { role: adminId === ADMIN_CREDENTIALS.userId ? 'admin' : 'vendor' };
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

// Get unverified users
app.get('/api/admin/unverified-users', async (req, res) => {"""

    content = content.replace(old_admin_middleware, new_admin_middleware)
    content = content.replace(', verifyAdmin,', ',')

    # 4. Add vendor suspension route
    vendors_route = """// Admin: Remove a vendor
app.delete('/api/admin/vendor/:id', async (req, res) => {"""

    suspend_route = """// Admin: Suspend a vendor
app.patch('/api/admin/vendor/:id/suspend', async (req, res) => {
    try {
        const result = await db.collection('vendors').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isActive: false } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Vendor not found' });
        res.json({ message: 'Vendor suspended successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Remove a vendor
app.delete('/api/admin/vendor/:id', async (req, res) => {"""
    
    content = content.replace(vendors_route, suspend_route)

    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Successfully updated server.js")
except Exception as e:
    print(f"Error: {e}")
