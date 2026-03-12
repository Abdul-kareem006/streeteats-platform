import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, LogOut, LayoutDashboard, Scale } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userType, setUserType] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        const type = localStorage.getItem('userType');
        setIsLoggedIn(!!user);
        setUserType(type);
    }, [location]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/login');
    };

    const dashboardPath = userType === 'admin' ? '/dashboard/admin' : userType === 'supplier' ? '/dashboard/supplier' : '/dashboard/vendor';

    const isActive = (path) => location.pathname === path;

    const linkClass = (path) =>
        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${isActive(path)
            ? 'border-orange-500 text-orange-600'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-orange-300'
        }`;

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-white shadow-md'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-orange-200 transition-all duration-300">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>
                            <span className="ml-2.5 text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                StreetEats
                            </span>
                        </Link>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
                        <Link to="/" className={linkClass('/')}>Home</Link>
                        <Link to="/inventory" className={linkClass('/inventory')}>
                            <Scale className="h-3.5 w-3.5 mr-1" />
                            Browse Inventory
                        </Link>
                        {!isLoggedIn && (
                            <Link to="/login" className={linkClass('/login')}>Login</Link>
                        )}
                        {!isLoggedIn && (
                            <div className="relative group">
                                <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                    Register ▾
                                </button>
                                <div className="absolute z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 bg-white shadow-xl rounded-xl mt-0 w-52 border border-gray-100 transition-all duration-200 transform group-hover:translate-y-0 translate-y-1">
                                    <Link to="/register/vendor" className="block px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-t-xl transition-colors">
                                        🏪 Vendor Registration
                                    </Link>
                                    <Link to="/register/supplier" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-b-xl transition-colors">
                                        🚚 Supplier Registration
                                    </Link>
                                </div>
                            </div>
                        )}
                        {isLoggedIn && (
                            <Link to={dashboardPath} className={linkClass(dashboardPath)}>
                                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                                Dashboard
                            </Link>
                        )}
                        {isLoggedIn && (
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-1.5" />
                                Logout
                            </button>
                        )}
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 transition-colors"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm">
                    <Link to="/" onClick={() => setIsOpen(false)}
                        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive('/') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}>
                        Home
                    </Link>
                    <Link to="/inventory" onClick={() => setIsOpen(false)}
                        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive('/inventory') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}>
                        Browse Inventory
                    </Link>
                    {!isLoggedIn && (
                        <Link to="/login" onClick={() => setIsOpen(false)}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive('/login') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}>
                            Login
                        </Link>
                    )}
                    {!isLoggedIn && (
                        <>
                            <Link to="/register/vendor" onClick={() => setIsOpen(false)}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors">
                                Vendor Registration
                            </Link>
                            <Link to="/register/supplier" onClick={() => setIsOpen(false)}
                                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors">
                                Supplier Registration
                            </Link>
                        </>
                    )}
                    {isLoggedIn && (
                        <Link to={dashboardPath} onClick={() => setIsOpen(false)}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive(dashboardPath) ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}>
                            Dashboard
                        </Link>
                    )}
                    {isLoggedIn && (
                        <button onClick={() => { handleLogout(); setIsOpen(false); }}
                            className="w-full text-left border-transparent text-red-500 hover:bg-red-50 hover:border-red-300 block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors">
                            Logout
                        </button>
                    )}
                </div>
            </div>

            <div className="h-[2px] bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
        </nav>
    );
};

export default Navbar;
