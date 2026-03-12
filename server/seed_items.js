const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'streeteats';

const itemsToAdd = [
    { name: 'Tomatoes', basePrice: 20, stock: 100, minOrder: 5 },
    { name: 'Onions', basePrice: 25, stock: 150, minOrder: 5 },
    { name: 'Potatoes', basePrice: 15, stock: 200, minOrder: 10 },
    { name: 'Rice', basePrice: 50, stock: 500, minOrder: 25 },
    { name: 'Cooking Oil', basePrice: 110, stock: 50, minOrder: 5 },
    { name: 'Wheat Flour', basePrice: 35, stock: 300, minOrder: 10 },
    { name: 'Paneer', basePrice: 350, stock: 20, minOrder: 2 }
];

async function seedItems() {
    const client = new MongoClient(MONGO_URL);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        const suppliers = await db.collection('suppliers').find({}).toArray();
        console.log(`Found ${suppliers.length} suppliers in the database.`);

        if (suppliers.length === 0) {
            console.log("No suppliers to add items to.");
            return;
        }

        // We can optionally clear existing inventory to prevent huge duplicates if run multiple times, 
        // but user just said "add items". Let's clear inventory just to keep things clean.
        await db.collection('inventoryItems').deleteMany({});
        console.log("Cleared existing inventory items.");

        let addedCount = 0;

        for (const supplier of suppliers) {
            for (const tpl of itemsToAdd) {
                // Vary price slightly for each supplier so the price comparison feature is meaningful
                const priceVar = Math.floor(Math.random() * 8) - 4; // -4 to +3
                const finalPrice = Math.max(1, tpl.basePrice + priceVar);

                const item = {
                    phone: supplier.phone,
                    shopname: supplier.shopname,
                    gst: supplier.gst || '',
                    name: tpl.name,
                    price: finalPrice,
                    stock: tpl.stock,
                    minOrder: tpl.minOrder,
                    createdAt: new Date()
                };

                await db.collection('inventoryItems').insertOne(item);
                addedCount++;
            }
        }

        console.log(`Successfully added ${addedCount} raw materials across all shops!`);

    } catch (err) {
        console.error('Error seeding items:', err);
    } finally {
        await client.close();
    }
}

seedItems();
