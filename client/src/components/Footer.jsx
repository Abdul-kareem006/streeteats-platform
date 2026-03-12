import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>
                            <span className="ml-2 text-xl font-bold">StreetEats</span>
                        </div>
                        <p className="mt-3 text-gray-400 text-sm leading-relaxed">
                            India's B2B platform connecting street food vendors with trusted raw material suppliers. Compare prices, find verified sources, and order ingredients — all in one place.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Quick Links</h3>
                        <ul className="mt-4 space-y-2.5">
                            <li><Link to="/" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Home</Link></li>
                            <li><Link to="/prices" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Compare Prices</Link></li>
                            <li><Link to="/register/vendor" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Vendor Registration</Link></li>
                            <li><Link to="/register/supplier" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Supplier Registration</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Contact</h3>
                        <ul className="mt-4 space-y-2.5">
                            <li className="flex items-center text-gray-400 text-sm">
                                <MapPin className="h-4 w-4 mr-2 text-orange-500" /> India
                            </li>
                            <li className="flex items-center text-gray-400 text-sm">
                                <Phone className="h-4 w-4 mr-2 text-orange-500" /> +91 98765 43210
                            </li>
                            <li className="flex items-center text-gray-400 text-sm">
                                <Mail className="h-4 w-4 mr-2 text-orange-500" /> support@streeteats.in
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} StreetEats. Empowering street food vendors with affordable raw material sourcing.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
