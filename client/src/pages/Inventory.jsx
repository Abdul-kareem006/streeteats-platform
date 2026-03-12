import { useState, useEffect } from 'react';
import { Search, Loader2, Package, Star, ShieldCheck, TrendingDown, MapPin } from 'lucide-react';

const getDistance = (id) => {
    if (!id) return "2.5";
    const charCode = id.charCodeAt(id.length - 1) || 0;
    return ((charCode % 8) + 1.2).toFixed(1);
};

const PriceComparison = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/all-users');
                let data; try { data = await response.json(); } catch { data = {}; }
                setSuppliers(data.suppliers || []);
            } catch (error) { console.error('Error fetching suppliers:', error); }
        };
        fetchSuppliers();
    }, []);

    const handleSearch = async (query) => {
        setShowSuggestions(false);
        if (!query || query.trim().length < 2) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const response = await fetch(`/api/search/items?q=${encodeURIComponent(query.trim())}`);
            let data; try { data = await response.json(); } catch { data = {}; }
            const enrichedItems = (data.items || []).map(item => {
                const supplierData = suppliers.find(s => s.phone === item.phone);
                return { ...item, supplier: supplierData || null };
            });
            setItems(enrichedItems);
        } catch (error) { console.error('Search failed:', error); setItems([]); }
        finally { setLoading(false); }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(searchTerm); };

    // Group items by name for comparison
    const groupedItems = items.reduce((acc, item) => {
        const key = (item.name || '').toLowerCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    for (const key of Object.keys(groupedItems)) groupedItems[key].sort((a, b) => a.price - b.price);

    const popularSearches = ['Tomatoes', 'Onions', 'Potatoes', 'Cooking Oil', 'Paneer', 'Rice'];

    const materialCategories = [
        { name: 'Vegetables & Herbs', items: ['Tomatoes', 'Onions', 'Potatoes', 'Cabbage', 'Carrots', 'Green Chilies', 'Garlic', 'Ginger', 'Lemon', 'Coriander', 'Capsicum', 'Mint'] },
        { name: 'Dairy & Poultry', items: ['Paneer', 'Cheese', 'Butter', 'Milk', 'Eggs', 'Chicken', 'Curd', 'Fresh Cream'] },
        { name: 'Staples & Flours', items: ['Basmati Rice', 'Jeera Rice', 'Wheat Flour', 'Maida', 'Besan', 'Toor Dal', 'Moong Dal', 'Cooking Oil', 'Mustard Oil', 'Sugar', 'Salt'] },
        { name: 'Spices & Condiments', items: ['Red Chili Powder', 'Turmeric', 'Garam Masala', 'Cumin', 'Black Pepper', 'Soy Sauce', 'Chili Sauce', 'Tomato Ketchup', 'Mayonnaise', 'Vinegar'] },
        { name: 'Bakery & Ready Foods', items: ['Bread', 'Pav', 'Burger Buns', 'Noodles', 'Pasta', 'Poha', 'Peanuts', 'Soya Chunks', 'Frozen Fries', 'Momo Wrappers'] },
        { name: 'Packaging Supplies', items: ['Paper Plates', 'Tissue Paper', 'Plastic Spoons', 'Wooden Forks', 'Foil Containers', 'Takeaway Bags', 'Cups', 'Cling Film'] }
    ];

    const allMaterials = [...new Set(materialCategories.flatMap(c => c.items))];

    const handleSearchTermChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
        } else {
            const filtered = allMaterials
                .filter(item => item.toLowerCase().includes(val.toLowerCase()))
                .slice(0, 8);
            setSuggestions(filtered);
            setShowSuggestions(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold">Raw Material Price Comparison</h1>
                    <p className="text-blue-100 mt-3 text-lg max-w-2xl mx-auto">
                        Search any ingredient and compare prices across verified suppliers — find the cheapest, most reliable source.
                    </p>
                    <div className="mt-8 max-w-xl mx-auto relative">
                        <Search className="absolute top-4 left-5 text-blue-300 h-5 w-5" />
                        <input type="text" placeholder="Search ingredients... e.g. Tomatoes, Rice, Cooking Oil"
                            value={searchTerm} onChange={handleSearchTermChange} onKeyDown={handleKeyDown}
                            className="w-full pl-14 pr-28 py-4 rounded-2xl text-gray-900 text-sm border-0 focus:ring-4 focus:ring-blue-300/50 shadow-xl shadow-blue-900/20 transition-all" />
                        <button onClick={() => handleSearch(searchTerm)}
                            className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                            Compare
                        </button>

                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full left-0 bg-white mt-1 rounded-xl shadow-2xl shadow-blue-900/10 border border-gray-100 max-h-60 overflow-y-auto text-left py-2">
                                {suggestions.map((suggestion, idx) => (
                                    <li key={idx}
                                        onClick={() => {
                                            setSearchTerm(suggestion);
                                            handleSearch(suggestion);
                                        }}
                                        className="px-5 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 font-medium text-sm flex items-center gap-3">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {popularSearches.map(term => (
                            <button key={term} onClick={() => { setSearchTerm(term); handleSearch(term); }}
                                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs text-white/90 hover:bg-white/20 transition-all">
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
                {loading && (
                    <div className="text-center py-16"><Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" /><p className="mt-4 text-gray-500 text-sm">Searching across all suppliers...</p></div>
                )}

                {!loading && hasSearched && items.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
                        <p className="text-sm text-gray-500 mt-1">Try "Tomatoes", "Rice", or "Oil"</p>
                    </div>
                )}

                {!loading && Object.keys(groupedItems).length > 0 && (
                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([itemName, itemList]) => (
                            <div key={itemName} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl text-white"><Package className="h-5 w-5" /></div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 capitalize">{itemName}</h2>
                                            <p className="text-xs text-gray-500">{itemList.length} supplier{itemList.length > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Cheapest first</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {itemList.map((item, idx) => {
                                        const isCheapest = idx === 0 && itemList.length > 1;
                                        const outOfStock = item.stock <= 0;
                                        return (
                                            <div key={item._id} className={`px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors ${isCheapest ? 'bg-green-50/30' : ''} ${outOfStock ? 'opacity-60' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isCheapest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>#{idx + 1}</span>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                            {item.shopname || item.supplier?.shopname || 'Unknown'}
                                                            {item.supplier?.verified && (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                                                </span>
                                                            )}
                                                            {(item.supplier?.trustScore >= 80) && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 shadow-sm whitespace-nowrap">
                                                                    ⭐ Trusted
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                                            {item.supplier && (
                                                                <>
                                                                    <span className={`font-medium ${item.supplier.trustScore >= 75 ? 'text-green-600' : item.supplier.trustScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                        Trust: {item.supplier.trustScore}%
                                                                    </span>
                                                                    <span>{item.supplier.completedOrders || 0} orders</span>
                                                                    {(item.supplier.area || item.supplier.city) && (
                                                                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {item.supplier.area}{item.supplier.city ? `, ${item.supplier.city}` : ''}</span>
                                                                    )}
                                                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px] font-medium">~{getDistance(item.supplier._id)} km</span>
                                                                </>
                                                            )}
                                                            <span>Stock: {item.stock} {item.minOrder > 1 ? `• Min: ${item.minOrder}` : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {outOfStock ? (
                                                        <span className="text-sm font-semibold text-red-500">Out of Stock</span>
                                                    ) : (
                                                        <>
                                                            <p className={`text-xl font-bold ${isCheapest ? 'text-green-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                                                                ₹{item.price}<span className="text-xs font-normal text-gray-400">/unit</span>
                                                            </p>
                                                            {isCheapest && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                                                                    <TrendingDown className="h-3 w-3" /> Best Price
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!hasSearched && !loading && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center">
                        <Search className="h-12 w-12 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900">Start building your inventory</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-8 max-w-2xl mx-auto">
                            Search for specific raw materials above, or explore our comprehensive catalog of typical street food ingredients below to check current market rates.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            {materialCategories.map((category, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                                    <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">{category.name}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {category.items.map(item => (
                                            <button key={item} onClick={() => { setSearchTerm(item); handleSearch(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm transition-all text-left">
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceComparison;
