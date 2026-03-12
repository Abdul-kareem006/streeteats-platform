import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, MapPin, ShoppingBag, FileText, CreditCard, Loader2, CheckCircle } from 'lucide-react';

const InputField = ({ icon: Icon, label, onChange, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="relative">
            <Icon className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
            <input
                {...props}
                className="pl-10 block w-full border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 sm:text-sm py-3 bg-white/80 transition-all duration-200 hover:border-gray-300"
                onChange={onChange}
            />
        </div>
    </div>
);

const RegisterVendor = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', password: '',
        shopname: '', shoploc: '', aadhar: '', gst: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            let data;
            try { data = await response.json(); } catch { throw new Error('Server returned an invalid response. Please try again or check your backend connection.'); }
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Track filled steps
    const personalDone = formData.fullName && formData.email && formData.phone && formData.password;
    const businessDone = formData.shopname && formData.shoploc;
    const steps = [
        { label: 'Personal', done: personalDone },
        { label: 'Business', done: businessDone },
        { label: 'Verification', done: formData.aadhar && formData.gst },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto animate-fade-in-up">
                {/* Step Progress */}
                <div className="flex items-center justify-center mb-8">
                    {steps.map((step, idx) => (
                        <div key={step.label} className="flex items-center">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300 ${step.done
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200/50'
                                : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                }`}>
                                {step.done ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${step.done ? 'text-orange-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div className={`mx-4 w-12 h-0.5 rounded-full transition-colors duration-300 ${step.done ? 'bg-orange-400' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg mb-3">
                            <ShoppingBag className="h-7 w-7 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Vendor Registration</h2>
                        <p className="mt-2 text-gray-500">Join StreetEats as a Vendor</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                <InputField icon={User} label="Full Name" type="text" name="fullName" onChange={handleChange} required />
                                <InputField icon={Mail} label="Email" type="email" name="email" onChange={handleChange} required />
                                <InputField icon={Phone} label="Phone" type="tel" name="phone" onChange={handleChange} required />
                                <InputField icon={Lock} label="Password" type="password" name="password" onChange={handleChange} required />
                            </div>
                        </div>

                        {/* Business Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Business Details</h3>
                            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InputField icon={ShoppingBag} label="Shop Name" type="text" name="shopname" onChange={handleChange} required />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputField icon={MapPin} label="Shop Location" type="text" name="shoploc" onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Verification */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Verification</h3>
                            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                                <InputField icon={CreditCard} label="Aadhar Number" type="text" name="aadhar" onChange={handleChange} required />
                                <InputField icon={FileText} label="GST Number" type="text" name="gst" onChange={handleChange} required />
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
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-300/50"
                        >
                            {loading ? (
                                <span className="flex items-center"><Loader2 className="animate-spin h-5 w-5 mr-2" /> Registering...</span>
                            ) : 'Register as Vendor'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterVendor;
