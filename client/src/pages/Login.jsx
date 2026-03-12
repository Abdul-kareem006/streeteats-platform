import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, Truck, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

const Login = () => {
    const [userType, setUserType] = useState('vendor');
    const [formData, setFormData] = useState({ userId: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Clear error and form data when switching user types
    useEffect(() => {
        setError('');
        setFormData({ userId: '', password: '' });
    }, [userType]);

    // Clear error on initial mount
    useEffect(() => {
        setError('');
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoints = {
            vendor: '/api/vendor/login',
            supplier: '/api/supplier/login',
            admin: '/api/admin/login'
        };
        const endpoint = endpoints[userType];

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error('Server is not responding. Please make sure the backend is running.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('userType', userType);

            const dashboards = {
                vendor: '/dashboard/vendor',
                supplier: '/dashboard/supplier',
                admin: '/dashboard/admin'
            };
            navigate(dashboards[userType]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isVendor = userType === 'vendor';
    const isAdmin = userType === 'admin';
    const themeColor = isAdmin ? 'purple' : isVendor ? 'orange' : 'blue';

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-white to-blue-100 animate-gradient"></div>
            <div className="absolute top-20 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft"></div>
            <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft delay-300"></div>

            {/* Glassmorphism card */}
            <div className="relative max-w-md w-full space-y-8 bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-gray-200/50 border border-white/50 animate-fade-in-up">
                <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${isAdmin ? 'from-purple-500 to-violet-500' : isVendor ? 'from-orange-500 to-red-500' : 'from-blue-500 to-indigo-500'} shadow-lg mb-4 transition-all duration-500`}>
                        {isAdmin ? <Shield className="h-8 w-8 text-white" /> : isVendor ? <Store className="h-8 w-8 text-white" /> : <Truck className="h-8 w-8 text-white" />}
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your <span className="font-medium capitalize">{userType}</span> account
                    </p>
                </div>

                {/* User type toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {[{ type: 'vendor', icon: Store, label: 'Vendor', color: 'text-orange-700' },
                    { type: 'supplier', icon: Truck, label: 'Supplier', color: 'text-blue-700' },
                    { type: 'admin', icon: Shield, label: 'Admin', color: 'text-purple-700' }
                    ].map(opt => (
                        <button
                            key={opt.type}
                            onClick={() => setUserType(opt.type)}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${userType === opt.type
                                ? `bg-white ${opt.color} shadow-md`
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <opt.icon className="w-4 h-4 mr-1.5" />
                            {opt.label}
                        </button>
                    ))}
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5" />
                            <input
                                id="userId"
                                name="userId"
                                type="text"
                                autoComplete="username"
                                required
                                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 sm:text-sm bg-white/80 transition-all duration-200"
                                placeholder="Email or Phone"
                                value={formData.userId}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                className="block w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 sm:text-sm bg-white/80 transition-all duration-200"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-fade-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 ${isAdmin
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-purple-300/50'
                            : isVendor
                                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-orange-300/50'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-300/50'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                Signing in...
                            </span>
                        ) : 'Sign in'}
                    </button>
                </form>

                {userType !== 'admin' && (
                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <a href={isVendor ? '/register/vendor' : '/register/supplier'} className={`font-medium ${isVendor ? 'text-orange-600 hover:text-orange-500' : 'text-blue-600 hover:text-blue-500'} transition-colors`}>
                            Register here
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
