import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { fetchProducts } from '../services/productsService';
import { Product } from '../types/types';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import ChatWidget from '../components/ChatWidget';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiShoppingCart, FiLogOut, FiSearch, FiFilter, FiPackage, FiSettings, FiUser, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import logoImage from '../assets/bestlogo.jpg';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { logout, currentUser, isAdmin, userProfile } = useAuth();
  const { getTotalItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const isFetchingRef = useRef(false); // Prevent duplicate fetches
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Show spinner for minimum 1 second on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Prevent duplicate fetches (especially in React StrictMode)
    if (isFetchingRef.current) {
      return;
    }

    let isMounted = true; // Flag to prevent state updates if component unmounts
    isFetchingRef.current = true; // Mark as fetching
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await fetchProducts();
        
        // Deduplicate by ID first
        let uniqueProducts = fetchedProducts.filter((product, index, self) =>
          index === self.findIndex((p) => p.id === product.id)
        );
        
        // Also deduplicate by name+price in case same product has different IDs
        uniqueProducts = uniqueProducts.filter((product, index, self) =>
          index === self.findIndex((p) => 
            p.name === product.name && 
            p.price === product.price &&
            p.description === product.description
          )
        );
        
        if (isMounted) {
          setProducts(uniqueProducts);
          setFilteredProducts(uniqueProducts);
        }
      } catch (error: any) {
        if (isMounted) {
          toast.error(error.message || 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        isFetchingRef.current = false; // Reset fetching flag
      }
    };

    loadProducts();
    
    // Cleanup function
    return () => {
      isMounted = false;
      isFetchingRef.current = false; // Reset on unmount
    };
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Handle click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  if (isPageLoading) {
    return <LoadingSpinner message="Loading products" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-md border-b border-neutral-200/80 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-8">
          {/* Top Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between gap-2 h-14 sm:h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 cursor-pointer flex-shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                src={logoImage}
                alt="Merry's Way Coffee Roasters"
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-20 lg:w-20 object-contain"
                loading="eager"
                decoding="async"
                width={80}
                height={80}
                fetchPriority="high"
              />
            </div>

            {/* Search Bar - Always Visible */}
            <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-2xl mx-1 sm:mx-2 md:mx-4 lg:mx-8">
              <div className="relative group w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100/50 to-neutral-50/50 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative">
                  <FiSearch className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 z-10 group-hover:text-neutral-600 transition-colors" size={14} />
                <input
                  type="text"
                    placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 sm:pl-10 md:pl-12 pr-2 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-3 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-400 outline-none transition-all duration-300 text-xs sm:text-sm md:text-base text-neutral-900 placeholder-neutral-400 font-medium shadow-sm hover:shadow-md focus:shadow-lg hover:border-neutral-300"
                />
                </div>
              </div>
            </div>

            {/* User Actions - Always Visible */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              {/* Admin Dashboard Button (only for admins) */}
              {currentUser && isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="relative p-1.5 sm:p-2 md:p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg sm:rounded-xl transition-all duration-300 group border-2 border-transparent hover:border-neutral-200"
                  aria-label="Admin Dashboard"
                  title="Admin Dashboard"
                >
                  <FiSettings size={16} className="sm:w-5 sm:h-5 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              )}
              
              {/* Wishlist Button */}
              <button
                onClick={() => navigate('/wishlist')}
                className="relative p-1.5 sm:p-2 md:p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg sm:rounded-xl transition-all duration-300 border-2 border-transparent hover:border-neutral-200"
                aria-label="View wishlist"
                title="Wishlist"
              >
                <FiHeart size={16} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[8px] sm:text-[9px] md:text-[10px] font-black rounded-full w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 flex items-center justify-center shadow-lg pointer-events-none border-2 border-white">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              
              {/* Order History Button */}
              <button
                onClick={() => navigate('/orders')}
                className="p-1.5 sm:p-2 md:p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg sm:rounded-xl transition-all duration-300 border-2 border-transparent hover:border-neutral-200"
                aria-label="View order history"
                title="Order History"
              >
                <FiPackage size={16} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-1.5 sm:p-2 md:p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg sm:rounded-xl transition-all duration-300 border-2 border-transparent hover:border-neutral-200"
                aria-label="View cart"
                title="Shopping Cart"
              >
                <FiShoppingCart size={16} className="sm:w-5 sm:h-5 md:w-5 md:h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-[8px] sm:text-[9px] md:text-[10px] font-black rounded-full w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 flex items-center justify-center shadow-lg pointer-events-none border-2 border-white">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* User Profile & Logout */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 pl-1 sm:pl-2 md:pl-3 ml-1 sm:ml-2 md:ml-3 border-l border-neutral-200 relative" ref={profileDropdownRef}>
                {/* Profile Picture Button */}
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center cursor-pointer"
                  title="View Profile"
                >
                  {/* Profile Picture or Initials - Circular */}
                  {userProfile?.photoURL || currentUser?.photoURL ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-neutral-300 shadow-md ring-2 ring-white hover:ring-neutral-400 transition-all duration-300">
                      <img
                        src={userProfile?.photoURL || currentUser?.photoURL || undefined}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 rounded-full flex items-center justify-center border-2 border-neutral-300 shadow-md ring-2 ring-white hover:ring-neutral-400 transition-all duration-300 relative overflow-hidden">
                      {/* Decorative background */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-white rounded-full blur-lg"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-full blur-md"></div>
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-black text-white relative z-10">
                        {(currentUser?.displayName || currentUser?.email || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-neutral-200/50 overflow-hidden z-50 animate-fade-in">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b border-neutral-200 px-4 py-4">
                      <div className="flex items-center gap-3">
                        {/* Large Profile Picture */}
                        {userProfile?.photoURL || currentUser?.photoURL ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-300 shadow-lg ring-2 ring-white">
                            <img
                              src={(userProfile?.photoURL || currentUser?.photoURL) || undefined}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 rounded-full flex items-center justify-center border-2 border-neutral-300 shadow-lg ring-2 ring-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                              <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full blur-xl"></div>
                              <div className="absolute bottom-0 left-0 w-6 h-6 bg-white rounded-full blur-lg"></div>
                            </div>
                            <span className="text-xl font-black text-white relative z-10">
                              {(currentUser?.displayName || currentUser?.email || 'U')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-neutral-900 truncate">
                            {currentUser?.displayName || 'User'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 group"
                      >
                        <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-neutral-200 transition-colors">
                          <FiUser className="text-neutral-700" size={18} />
                        </div>
                        <span className="font-semibold text-sm">View Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/orders');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 group"
                      >
                        <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-neutral-200 transition-colors">
                          <FiPackage className="text-neutral-700" size={18} />
                        </div>
                        <span className="font-semibold text-sm">Order History</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/wishlist');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 group"
                      >
                        <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-neutral-200 transition-colors">
                          <FiHeart className="text-neutral-700" size={18} />
                        </div>
                        <span className="font-semibold text-sm">Wishlist</span>
                        {wishlistItems.length > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {wishlistItems.length}
                          </span>
                        )}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 group"
                        >
                          <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-neutral-200 transition-colors">
                            <FiSettings className="text-neutral-700" size={18} />
                          </div>
                          <span className="font-semibold text-sm">Admin Dashboard</span>
                        </button>
                      )}
                      <div className="border-t border-neutral-200 my-1"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors duration-200 group"
                      >
                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                          <FiLogOut className="text-red-600" size={18} />
                        </div>
                        <span className="font-semibold text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Logout Button - Only show when dropdown is not visible */}
                {!showProfileDropdown && (
                  <button
                    onClick={handleLogout}
                    className="p-1.5 sm:p-2 md:p-2.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-300 border-2 border-transparent hover:border-red-200"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <FiLogOut size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Category Filter */}
        <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-neutral-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 text-neutral-900">
            <div className="p-1.5 sm:p-2 bg-neutral-100 rounded-lg sm:rounded-xl">
              <FiFilter size={18} className="text-neutral-700" />
            </div>
            <span className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight">Category:</span>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                  selectedCategory === category
                    ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-900/20 scale-105'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900 shadow-sm'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mb-6 sm:mb-8 text-sm sm:text-base font-bold text-neutral-900 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 inline-block border border-neutral-200/50 shadow-md animate-fade-in">
            Showing <span className="text-neutral-800 font-extrabold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
            {filteredProducts.length !== products.length && <span className="text-neutral-600 font-medium"> (of {products.length} total)</span>}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-32 md:py-40">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-6 sm:mb-8"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">Loading products...</p>
              <p className="text-xs sm:text-sm text-neutral-500 px-4">Please wait while we fetch the best coffee for you</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 sm:py-32 md:py-40 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 shadow-xl px-4">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">☕</div>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-3 sm:mb-4 tracking-tight">No products found</p>
            <p className="text-neutral-600 max-w-md mx-auto text-base sm:text-lg">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Products will appear here once added to the database'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 animate-fade-in">
            {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onCardClick={handleProductCardClick}
                />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Home;

