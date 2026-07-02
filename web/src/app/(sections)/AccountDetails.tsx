'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, History, Heart, Settings, LogOut } from 'lucide-react';

// ---------------- Account Details Form ----------------
const AccountDetailsContent = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <section
            className="bg-background rounded-xl shadow-lg p-5 md:p-8 border border-border"
            aria-labelledby="account-heading"
        >
            <h1 id="account-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Account Details
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8 text-sm md:text-base">
                {/* Personal Information */}
                <fieldset className="border-t border-border pt-4">
                    <legend className="text-lg font-semibold text-muted-foreground mb-4">
                        Personal Information
                    </legend>

                    <div className="mb-5">
                        <label htmlFor="full-name" className="block text-muted-foreground mb-1">Full Name</label>
                        <input
                            type="text"
                            id="full-name"
                            defaultValue="Eleanor Vance"
                            className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-5">
                        <div className="flex-1">
                            <label htmlFor="email" className="block text-muted-foreground mb-1">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                defaultValue="eleanor.v@example.com"
                                className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="phone" className="block text-muted-foreground mb-1">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                defaultValue="+1 (555) 123-4567"
                                className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Shipping Address */}
                <fieldset className="border-t border-border pt-4">
                    <legend className="text-lg font-semibold text-muted-foreground mb-4">
                        Shipping Address
                    </legend>

                    <div className="mb-5">
                        <label htmlFor="address" className="block text-muted-foreground mb-1">Address</label>
                        <input
                            type="text"
                            id="address"
                            defaultValue="123 Diamond Avenue"
                            className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                        <div>
                            <label htmlFor="city" className="block text-muted-foreground mb-1">City</label>
                            <input
                                type="text"
                                id="city"
                                defaultValue="Crystal City"
                                className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                            />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-muted-foreground mb-1">State / Province</label>
                            <input
                                type="text"
                                id="state"
                                defaultValue="CA"
                                className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                            />
                        </div>
                        <div>
                            <label htmlFor="zip" className="block text-muted-foreground mb-1">Zip / Postal Code</label>
                            <input
                                type="text"
                                id="zip"
                                defaultValue="90210"
                                className="w-full p-2.5 border border-border rounded-lg focus:ring-brand-500 focus:border-brand-500 transition duration-150"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Submit */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-brand-500 text-background text-sm md:text-base font-semibold rounded-lg shadow hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300 transition-all duration-300 transform hover:scale-105"
                    >
                        Update Information
                    </button>
                </div>
            </form>
        </section>
    );
};

// ---------------- Sidebar Navigation ----------------
const navItems = [
    { name: 'Account Details', icon: User, href: '/account/details' },
    { name: 'Order History', icon: History, href: '/account/history' },
    { name: 'Wishlist', icon: Heart, href: '/account/wishlist' },
    { name: 'Preferences', icon: Settings, href: '/account/preferences' },
];

const AccountPage = () => {
    const pathname = usePathname();

    return (
        <main className="container mx-auto px-4 py-8 md:py-10">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <aside className="w-full md:w-64" aria-label="Account Menu">
                    <nav className="bg-background rounded-xl shadow-md p-4 md:p-6 border border-border">
                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const active = pathname.includes(item.href);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-300
                        ${active
                                                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm scale-[1.03]'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]'
                                                }`}
                                        >
                                            <item.icon
                                                className={`w-5 h-5 mr-3 transition-transform duration-300 ${active ? 'scale-110 text-brand-600' : ''}`}
                                            />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                            <li className="pt-3 border-t mt-3">
                                <Link
                                    href="/logout"
                                    className="flex items-center p-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium transition-all duration-300"
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main Form */}
                <div className="flex-grow min-w-0">
                    <AccountDetailsContent />
                </div>
            </div>
        </main>
    );
};

export default AccountPage;
