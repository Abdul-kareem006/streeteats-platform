const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for grievance attachments
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// MongoDB connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'streeteats';
let db;

async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('✅ MongoDB Connected to', DB_NAME);
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

// ─── ADMIN LOGIN ────────────────────────────────────

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = { userId: 'admin', password: 'admin123' };

app.post('/api/admin/login', (req, res) => {
    const { userId, password } = req.body;
    if (userId === ADMIN_CREDENTIALS.userId && password === ADMIN_CREDENTIALS.password) {
        return res.json({ role: 'admin', fullName: 'Admin', _id: 'admin' });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
});

// ─── VENDOR ROUTES ──────────────────────────────────

// Register vendor
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, shopname, shoploc, aadhar, gst } = req.body;
        // Check if vendor already exists
        const existing = await db.collection('vendors').findOne({ $or: [{ email }, { phone }] });
        if (existing) return res.status(400).json({ error: 'Vendor already exists with this email or phone' });

        const vendor = { fullName, email, phone, password, shopname, shoploc, aadhar, gst, verified: false, isActive: true, createdAt: new Date() };
        await db.collection('vendors').insertOne(vendor);
        res.json({ message: 'Vendor registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login vendor
app.post('/api/vendor/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const vendor = await db.collection('vendors').findOne({
            $or: [{ email: userId }, { phone: userId }],
            password
        });
        if (!vendor) return res.status(401).json({ error: 'Invalid credentials' });
        if (!vendor.verified) return res.status(403).json({ error: 'Your account is pending verification by admin' });
        const { password: _, ...safeVendor } = vendor;
        res.json(safeVendor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SUPPLIER ROUTES ────────────────────────────────

// Register supplier
app.post('/api/supplier/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, shopname, shoploc, city, area, aadhar, gst } = req.body;
        const existing = await db.collection('suppliers').findOne({ $or: [{ email }, { phone }] });
        if (existing) return res.status(400).json({ error: 'Supplier already exists with this email or phone' });

        const supplier = { fullName, email, phone, password, shopname, shoploc, city: city || '', area: area || '', aadhar, gst, verified: false, shopStatus: false, isSuspended: false, createdAt: new Date() };
        await db.collection('suppliers').insertOne(supplier);
        res.json({ message: 'Supplier registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login supplier
app.post('/api/supplier/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const supplier = await db.collection('suppliers').findOne({
            $or: [{ email: userId }, { phone: userId }],
            password
        });
        if (!supplier) return res.status(401).json({ error: 'Invalid credentials' });
        if (!supplier.verified) return res.status(403).json({ error: 'Your account is pending verification by admin' });
        const { password: _, ...safeSupplier } = supplier;
        res.json(safeSupplier);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get supplier menu
app.get('/api/supplier/inventory/:phone', async (req, res) => {
    try {
        const inventoryItems = await db.collection('inventoryItems').find({ phone: req.params.phone }).toArray();
        res.json({ success: true, inventoryItems });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add inventory item (with minimum order quantity)
app.post('/api/supplier/inventory', async (req, res) => {
    try {
        const { phone, shopname, gst, itemname, itemcost, todaysstock, minorder } = req.body;
        const item = {
            phone, shopname, gst,
            name: itemname, price: Number(itemcost), stock: Number(todaysstock),
            minOrder: Number(minorder) || 1,
            createdAt: new Date()
        };
        await db.collection('inventoryItems').insertOne(item);
        res.json({ success: true, message: 'Item added' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Toggle shop status
app.post('/api/supplier/shop-status', async (req, res) => {
    try {
        const { phone, status } = req.body;
        await db.collection('suppliers').updateOne({ phone }, { $set: { shopStatus: status } });
        res.json({ isShopOpen: status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SHARED ROUTES ──────────────────────────────────

// Calculate trust score as percentage (50% delivery success, 30% rating, 20% grievance)
function calcTrustScore(completedOrders, totalOrders, grievanceCount) {
    const deliveryRate = totalOrders > 0 ? (completedOrders / totalOrders) : 0.5;
    const ratingScore = Math.max(0, 1 - grievanceCount * 0.05);
    const grievanceScore = Math.max(0, 1 - grievanceCount * 0.1);
    const raw = (deliveryRate * 0.5 + ratingScore * 0.3 + grievanceScore * 0.2) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
}

// Get all verified suppliers (enriched with trust data for vendor browsing)
app.get('/api/all-users', async (req, res) => {
    try {
        const suppliers = await db.collection('suppliers').find({ verified: true, isSuspended: { $ne: true } }).project({ password: 0 }).toArray();
        const enriched = await Promise.all(suppliers.map(async (s) => {
            const completedOrders = await db.collection('orders').countDocuments({ supplierPhone: s.phone, status: 'delivered' });
            const totalOrders = await db.collection('orders').countDocuments({ supplierPhone: s.phone });
            const grievanceCount = await db.collection('grievances').countDocuments({ supplierShop: s.shopname });
            const trustScore = calcTrustScore(completedOrders, totalOrders, grievanceCount);
            return { ...s, completedOrders, totalOrders, grievanceCount, trustScore };
        }));
        res.json({ suppliers: enriched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get individual supplier trust profile
app.get('/api/supplier/profile/:phone', async (req, res) => {
    try {
        const supplier = await db.collection('suppliers').findOne({ phone: req.params.phone }, { projection: { password: 0 } });
        if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
        const completedOrders = await db.collection('orders').countDocuments({ supplierPhone: req.params.phone, status: 'delivered' });
        const totalOrders = await db.collection('orders').countDocuments({ supplierPhone: req.params.phone });
        const grievanceCount = await db.collection('grievances').countDocuments({ supplierShop: supplier.shopname });
        const trustScore = calcTrustScore(completedOrders, totalOrders, grievanceCount);
        res.json({ ...supplier, completedOrders, totalOrders, grievanceCount, trustScore });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ADMIN ROUTES ───────────────────────────────────

app.use('/api/admin', (req, res, next) => {
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
app.get('/api/admin/unverified-users', async (req, res) => {
    try {
        const vendors = await db.collection('vendors').find({ verified: false }).project({ password: 0 }).toArray();
        const suppliers = await db.collection('suppliers').find({ verified: false }).project({ password: 0 }).toArray();
        res.json({ vendors, suppliers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify user (Used generally, but mostly for suppliers)
app.patch('/api/admin/:userType/:id/verify', async (req, res) => {
    try {
        const { userType, id } = req.params;
        const collection = userType === 'vendor' ? 'vendors' : 'suppliers';
        await db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: { verified: true } });
        res.json({ message: `${userType} verified successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reject (delete) user during verification
app.delete('/api/admin/reject-user/:userType/:id', async (req, res) => {
    try {
        const { userType, id } = req.params;
        const collection = userType === 'vendor' ? 'vendors' : 'suppliers';
        await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
        res.json({ message: `${userType} rejected and removed` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GRIEVANCE ROUTES ───────────────────────────────

app.post('/api/grievance', upload.array('attachments', 5), async (req, res) => {
    try {
        const grievance = {
            supplierName: req.body.supplierName,
            supplierShop: req.body.supplierShop,
            vendorName: req.body.vendorName,
            vendorLocation: req.body.vendorLocation,
            issueDate: req.body.issueDate,
            issueType: req.body.issueType,
            issueDetails: req.body.issueDetails,
            postedBy: req.body.postedBy,
            attachments: req.files ? req.files.map(f => f.filename) : [],
            createdAt: new Date()
        };
        await db.collection('grievances').insertOne(grievance);
        res.json({ message: 'Grievance submitted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all grievances (admin)
app.get('/api/grievances', async (req, res) => {
    try {
        const grievances = await db.collection('grievances').find().sort({ createdAt: -1 }).toArray();
        res.json({ grievances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ORDER ROUTES ───────────────────────────────────

// Place order — validates stock, MOQ, and supplier status
app.post('/api/orders', async (req, res) => {
    try {
        const { vendorPhone, vendorName, vendorShop, vendorLocation, items, totalAmount, paymentMethod } = req.body;
        
        // Check if vendor is suspended
        const vendor = await db.collection('vendors').findOne({ phone: vendorPhone });
        if (vendor && vendor.isActive === false) {
            return res.status(403).json({ error: 'Your account is suspended. You cannot place new orders.' });
        }

        if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        // Validate each item: stock, MOQ, and supplier open
        for (const item of items) {
            const dbItem = await db.collection('inventoryItems').findOne({ _id: new ObjectId(item._id) });
            if (!dbItem) return res.status(400).json({ error: `Item "${item.name}" no longer exists` });
            if (dbItem.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${item.name}. Available: ${dbItem.stock}` });
            if (dbItem.minOrder && item.quantity < dbItem.minOrder) return res.status(400).json({ error: `Minimum order for ${item.name} is ${dbItem.minOrder} units` });
            const supplier = await db.collection('suppliers').findOne({ phone: item.supplierPhone });
            if (supplier) {
                if (supplier.isSuspended) return res.status(400).json({ error: `Supplier "${item.supplierName}" is suspended by admin and cannot accept orders.` });
                if (!supplier.shopStatus) return res.status(400).json({ error: `Supplier "${item.supplierName}" is currently closed` });
            }
        }

        // Group items by supplier
        const supplierGroups = {};
        for (const item of items) {
            const key = item.supplierPhone;
            if (!supplierGroups[key]) supplierGroups[key] = { supplierPhone: key, supplierName: item.supplierName, items: [] };
            supplierGroups[key].items.push({ itemId: item._id, name: item.name, price: item.price, quantity: item.quantity });
        }

        const orderIds = [];
        for (const group of Object.values(supplierGroups)) {
            const subtotal = group.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const order = {
                vendorPhone, vendorName, vendorShop, vendorLocation,
                supplierPhone: group.supplierPhone,
                supplierName: group.supplierName,
                items: group.items,
                subtotal,
                paymentMethod: paymentMethod || 'Cash on Delivery',
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await db.collection('orders').insertOne(order);
            orderIds.push(result.insertedId);

            for (const item of group.items) {
                await db.collection('inventoryItems').updateOne(
                    { _id: new ObjectId(item.itemId) },
                    { $inc: { stock: -item.quantity } }
                );
            }
        }

        res.json({ success: true, message: 'Order placed successfully', orderIds });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders for a vendor
app.get('/api/orders/vendor/:phone', async (req, res) => {
    try {
        const orders = await db.collection('orders').find({ vendorPhone: req.params.phone }).sort({ createdAt: -1 }).toArray();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders for a supplier
app.get('/api/orders/supplier/:phone', async (req, res) => {
    try {
        const orders = await db.collection('orders').find({ supplierPhone: req.params.phone }).sort({ createdAt: -1 }).toArray();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['accepted', 'packed', 'delivered', 'rejected'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status, updatedAt: new Date() } }
        );

        // If rejected, restore stock
        if (status === 'rejected') {
            const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
            if (order) {
                for (const item of order.items) {
                    await db.collection('inventoryItems').updateOne(
                        { _id: new ObjectId(item.itemId) },
                        { $inc: { stock: item.quantity } }
                    );
                }
            }
        }

        res.json({ message: `Order ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel order (vendor can cancel only pending orders)
app.patch('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

        await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status: 'cancelled', updatedAt: new Date() } }
        );
        // Restore stock
        for (const item of order.items) {
            await db.collection('inventoryItems').updateOne(
                { _id: new ObjectId(item.itemId) },
                { $inc: { stock: item.quantity } }
            );
        }
        res.json({ message: 'Order cancelled and stock restored' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vendor order stats / insights
app.get('/api/orders/vendor/:phone/stats', async (req, res) => {
    try {
        const orders = await db.collection('orders').find({ vendorPhone: req.params.phone }).toArray();
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
        const suppliersUsed = new Set(orders.map(o => o.supplierPhone)).size;
        res.json({ totalOrders, totalSpent, suppliersUsed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalOrders = await db.collection('orders').countDocuments();
        const totalVendors = await db.collection('vendors').countDocuments({ verified: true });
        const totalSuppliers = await db.collection('suppliers').countDocuments({ verified: true });
        const orders = await db.collection('orders').find().toArray();
        const totalRevenue = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
        const totalGrievances = await db.collection('grievances').countDocuments();
        res.json({ totalOrders, totalVendors, totalSuppliers, totalRevenue, totalGrievances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all vendors
app.get('/api/admin/vendors', async (req, res) => {
    try {
        const vendors = await db.collection('vendors').find().project({ password: 0 }).toArray();
        // Aggregate orders placed
        const enrichedVendors = await Promise.all(vendors.map(async (v) => {
            const ordersPlaced = await db.collection('orders').countDocuments({ vendorPhone: v.phone });
            return { ...v, ordersPlaced };
        }));
        res.json({ vendors: enrichedVendors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all suppliers
app.get('/api/admin/suppliers', async (req, res) => {
    try {
        const suppliers = await db.collection('suppliers').find().project({ password: 0 }).toArray();
        // Aggregate orders completed
        const enrichedSuppliers = await Promise.all(suppliers.map(async (s) => {
            const ordersCompleted = await db.collection('orders').countDocuments({ supplierPhone: s.phone, status: 'delivered' });
            return { ...s, ordersCompleted };
        }));
        res.json({ suppliers: enrichedSuppliers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await db.collection('orders').find().sort({ createdAt: -1 }).toArray();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Suspend a vendor
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
app.delete('/api/admin/vendor/:id', async (req, res) => {
    try {
        const result = await db.collection('vendors').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Vendor not found' });
        res.json({ message: 'Vendor removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Suspend a supplier
app.patch('/api/admin/supplier/:id/suspend', async (req, res) => {
    try {
        const result = await db.collection('suppliers').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isSuspended: true } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier suspended successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Unsuspend a supplier
app.patch('/api/admin/supplier/:id/unsuspend', async (req, res) => {
    try {
        const result = await db.collection('suppliers').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isSuspended: false } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier unsuspended successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Remove a supplier
app.delete('/api/admin/supplier/:id', async (req, res) => {
    try {
        const supplier = await db.collection('suppliers').findOne({ _id: new ObjectId(req.params.id) });
        if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

        // Safety check: Prevent deletion if supplier has active orders
        const activeOrders = await db.collection('orders').countDocuments({
            supplierPhone: supplier.phone,
            status: { $in: ['pending', 'accepted', 'packed'] }
        });

        if (activeOrders > 0) {
            return res.status(400).json({ error: 'Cannot delete supplier with active orders' });
        }

        await db.collection('suppliers').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: 'Supplier removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SUPPLIER INVENTORY ITEM DELETION ────────────────────

app.delete('/api/supplier/inventory/:id', async (req, res) => {
    try {
        await db.collection('inventoryItems').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── SEARCH ITEMS ACROSS SUPPLIERS ──────────────────

app.get('/api/search/items', async (req, res) => {
    try {
        const { q } = req.query;
        
        // Find suspended suppliers
        const suspendedSuppliers = await db.collection('suppliers').find({ isSuspended: true }).toArray();
        const suspendedPhones = suspendedSuppliers.map(s => s.phone);
        
        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (suspendedPhones.length > 0) filter.phone = { $nin: suspendedPhones };
        
        const items = await db.collection('inventoryItems').find(filter).sort({ price: 1 }).toArray();
        res.json({ items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── START SERVER ───────────────────────────────────

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 StreetEats API running at http://localhost:${PORT}`);
    });
});
