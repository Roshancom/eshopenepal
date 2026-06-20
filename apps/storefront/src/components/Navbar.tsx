import React from 'react';
import { ShoppingCart, User, Package2, LogOut } from 'lucide-react';
import { useAuth, useCart } from '@eshopnepal/shared';

interface NavbarProps {
  navigate: (path: string) => void;
  currentPath: string;
}

export const Navbar: React.FC<NavbarProps> = ({ navigate, currentPath }) => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900 cursor-pointer"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Package2 size={18} />
          </span>
          <span>eShopNepal</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <button
            onClick={() => navigate('/products')}
            className={`cursor-pointer hover:text-indigo-600 transition-colors ${currentPath === '/products' ? 'text-indigo-600' : ''}`}
          >
            Products
          </button>
          {user && (
            <button
              onClick={() => navigate('/dashboard')}
              className={`cursor-pointer hover:text-indigo-600 transition-colors ${currentPath === '/dashboard' ? 'text-indigo-600' : ''}`}
            >
              My Orders
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
            aria-label="Cart"
          >
            <ShoppingCart size={22} />
            {getCartCount() > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                {getCartCount()}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <User size={16} />
                </div>
                <span className="max-w-[120px] truncate">{user.username}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-1.5 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 px-4 py-2 transition-colors cursor-pointer shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
