import { Link } from 'react-router-dom';
import { ArrowRight, Package, Truck, ShieldCheck, Star, Users, TrendingUp, Search, Scale } from 'lucide-react';

const Home = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl animate-fade-in-up">
                                    <span className="block xl:inline">Raw materials for</span>{' '}
                                    <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent xl:inline">
                                        street food vendors
                                    </span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 animate-fade-in-up delay-100">
                                    Find trusted suppliers, compare ingredient prices, and source affordable raw materials — all in one platform built for India's street food ecosystem.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start animate-fade-in-up delay-200">
                                    <div className="rounded-xl shadow-lg shadow-orange-200/50">
                                        <Link
                                            to="/register/vendor"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:shadow-xl hover:shadow-orange-300/50 hover:-translate-y-0.5"
                                        >
                                            I'm a Vendor
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <Link
                                            to="/register/supplier"
                                            className="w-full flex items-center justify-center px-8 py-3 border-2 border-orange-200 text-base font-medium rounded-xl text-orange-700 bg-white hover:bg-orange-50 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:-translate-y-0.5"
                                        >
                                            I'm a Supplier
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <img
                        className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Fresh vegetables and raw materials at a market"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-50/80 via-transparent to-transparent lg:block hidden"></div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative -mt-10 z-20 max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <div className="px-8 py-6 text-center animate-fade-in-up">
                        <div className="flex justify-center mb-2">
                            <Users className="h-6 w-6 text-orange-500" />
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">500+</p>
                        <p className="text-sm text-gray-500 mt-1">Street Food Vendors</p>
                    </div>
                    <div className="px-8 py-6 text-center animate-fade-in-up delay-100">
                        <div className="flex justify-center mb-2">
                            <Truck className="h-6 w-6 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">1,000+</p>
                        <p className="text-sm text-gray-500 mt-1">Verified Suppliers</p>
                    </div>
                    <div className="px-8 py-6 text-center animate-fade-in-up delay-200">
                        <div className="flex justify-center mb-2">
                            <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">50,000+</p>
                        <p className="text-sm text-gray-500 mt-1">Orders Fulfilled</p>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-sm text-orange-600 font-semibold tracking-widest uppercase">How It Works</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Source raw materials the smart way
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                            No more visiting multiple markets. Compare prices, find trusted suppliers, and order ingredients from your phone.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Search,
                                title: 'Compare Prices',
                                desc: 'Search ingredients like Onions, Tomatoes, or Oil and instantly compare prices across multiple verified suppliers.',
                                gradient: 'from-orange-500 to-red-500',
                                bg: 'bg-orange-50',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Trusted Suppliers',
                                desc: 'Every supplier is admin-verified with trust scores, completed orders, and complaint history visible upfront.',
                                gradient: 'from-green-500 to-emerald-500',
                                bg: 'bg-green-50',
                            },
                            {
                                icon: Package,
                                title: 'Order & Track',
                                desc: 'Place bulk orders for raw materials, track delivery status, and report any quality or delivery issues.',
                                gradient: 'from-blue-500 to-indigo-500',
                                bg: 'bg-blue-50',
                            },
                        ].map((feature, idx) => (
                            <div
                                key={feature.title}
                                className={`relative group p-8 rounded-2xl ${feature.bg} border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                                <p className="mt-2 text-base text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
                <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl animate-fade-in-up">
                        Stop overpaying for raw materials
                    </h2>
                    <p className="mt-4 text-lg text-orange-100 animate-fade-in-up delay-100">
                        Join India's largest raw material sourcing platform for street food vendors and suppliers.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
                        <Link
                            to="/register/vendor"
                            className="inline-flex items-center justify-center px-8 py-3 border-2 border-white rounded-xl text-base font-medium text-white hover:bg-white hover:text-orange-600 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Register as Vendor
                        </Link>
                        <Link
                            to="/register/supplier"
                            className="inline-flex items-center justify-center px-8 py-3 bg-white rounded-xl text-base font-medium text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Register as Supplier
                        </Link>
                    </div>
                </div>
            </div>

            {/* Price Comparison CTA */}
            <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg mb-6">
                        <Scale className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Compare prices before you buy</h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Search any ingredient and see prices from all suppliers, sorted cheapest first. No signup needed.
                    </p>
                    <Link
                        to="/prices"
                        className="mt-8 inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-base font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200/50"
                    >
                        <Search className="h-5 w-5 mr-2" />
                        Compare Prices Now
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
