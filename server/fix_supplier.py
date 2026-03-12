import sys
import re

try:
    with open('server.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update register supplier
    content = content.replace(
        "const supplier = { fullName, email, phone, password, shopname, shoploc, city: city || '', area: area || '', aadhar, gst, verified: false, shopStatus: false, createdAt: new Date() };",
        "const supplier = { fullName, email, phone, password, shopname, shoploc, city: city || '', area: area || '', aadhar, gst, verified: false, shopStatus: false, isSuspended: false, createdAt: new Date() };"
    )

    # 2. Update /api/all-users to filter suspended suppliers
    old_all_users = "const suppliers = await db.collection('suppliers').find({ verified: true }).project({ password: 0 }).toArray();"
    new_all_users = "const suppliers = await db.collection('suppliers').find({ verified: true, isSuspended: { $ne: true } }).project({ password: 0 }).toArray();"
    content = content.replace(old_all_users, new_all_users)
    
    # 3. Update /api/search/items to filter items from suspended suppliers
    old_search = """app.get('/api/search/items', async (req, res) => {
    try {
        const { q } = req.query;
        const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
        const items = await db.collection('inventoryItems').find(filter).sort({ price: 1 }).toArray();"""
        
    new_search = """app.get('/api/search/items', async (req, res) => {
    try {
        const { q } = req.query;
        
        // Find suspended suppliers
        const suspendedSuppliers = await db.collection('suppliers').find({ isSuspended: true }).toArray();
        const suspendedPhones = suspendedSuppliers.map(s => s.phone);
        
        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (suspendedPhones.length > 0) filter.phone = { $nin: suspendedPhones };
        
        const items = await db.collection('inventoryItems').find(filter).sort({ price: 1 }).toArray();"""
    content = content.replace(old_search, new_search)

    # 4. Add supplier suspension/unsuspension routes
    old_supplier_delete = """// Admin: Remove a supplier
app.delete('/api/admin/supplier/:id', async (req, res) => {"""
    
    new_supplier_suspend = """// Admin: Suspend a supplier
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
app.delete('/api/admin/supplier/:id', async (req, res) => {"""
    content = content.replace(old_supplier_delete, new_supplier_suspend)

    # 5. Update /api/orders validation to protect against suspended suppliers
    old_order_validation = """            const supplier = await db.collection('suppliers').findOne({ phone: item.supplierPhone });
            if (supplier && !supplier.shopStatus) return res.status(400).json({ error: `Supplier "${item.supplierName}" is currently closed` });"""
            
    new_order_validation = """            const supplier = await db.collection('suppliers').findOne({ phone: item.supplierPhone });
            if (supplier) {
                if (supplier.isSuspended) return res.status(400).json({ error: `Supplier "${item.supplierName}" is suspended by admin and cannot accept orders.` });
                if (!supplier.shopStatus) return res.status(400).json({ error: `Supplier "${item.supplierName}" is currently closed` });
            }"""
    content = content.replace(old_order_validation, new_order_validation)

    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Successfully updated server.js")
except Exception as e:
    print(f"Error: {e}")
