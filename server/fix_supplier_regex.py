import sys
import re

try:
    with open('server.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply the same changes but directly parsing the syntax correctly
    content_new = re.sub(
        r"app.get\('/api/search/items', async \(req, res\) => \{\s+try \{\s+const \{ q \} = req.query;\s+const filter = q \? \{ name: \{ \$regex: q, \$options: 'i' \} \} : \{\};\s+const items = await db.collection\('inventoryItems'\).find\(filter\).sort\(\{ price: 1 \}\).toArray\(\);",
        """app.get('/api/search/items', async (req, res) => {
    try {
        const { q } = req.query;
        
        // Find suspended suppliers
        const suspendedSuppliers = await db.collection('suppliers').find({ isSuspended: true }).toArray();
        const suspendedPhones = suspendedSuppliers.map(s => s.phone);
        
        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (suspendedPhones.length > 0) filter.phone = { $nin: suspendedPhones };
        
        const items = await db.collection('inventoryItems').find(filter).sort({ price: 1 }).toArray();""",
        content
    )
    if content == content_new:
        print("Warning: regex for /api/search/items did not match")
    content = content_new

    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Done")
except Exception as e:
    print(f"Error: {e}")
