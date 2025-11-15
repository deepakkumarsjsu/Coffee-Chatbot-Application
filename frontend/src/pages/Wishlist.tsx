import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { FiHeart, FiShoppingCart, FiArrowLeft, FiTrash2, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show spinner for minimum 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your wishlist" />;
  }

  if (wishlistItems.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-neutral-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-neutral-300/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-neutral-200/25 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-neutral-200/50 p-10 sm:p-12 md:p-16 max-w-lg w-full text-center overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900"></div>
          
          {/* Icon Container */}
          <div className="relative mb-8">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200"></div>
              {/* Middle Ring */}
              <div className="absolute inset-2 rounded-full bg-white border-4 border-neutral-300 shadow-inner"></div>
              {/* Icon Container */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center shadow-2xl">
                <FiHeart size={56} className="text-white fill-white" />
              </div>
              {/* Floating Particles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-neutral-400 rounded-full blur-sm"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-neutral-500 rounded-full blur-sm"></div>
              <div className="absolute top-1/2 -left-3 w-2 h-2 bg-neutral-300 rounded-full blur-sm"></div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-visible">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 mb-4 tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent leading-[1.2] py-1">
              Your Wishlist is Empty
            </h2>
          </div>
          <p className="text-lg sm:text-xl text-neutral-600 mb-10 font-semibold leading-relaxed">
            No favorites saved yet.<br />
            <span className="text-neutral-500">Start adding products you love to your wishlist!</span>
            </p>

          {/* Action Button */}
          <div className="relative">
            <button
              onClick={() => navigate('/')}
              className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white px-10 py-4 sm:px-12 sm:py-5 rounded-2xl font-black text-base sm:text-lg shadow-2xl"
            >
              <span className="flex items-center justify-center gap-3">
                <FiHeart size={20} className="fill-white" />
              Browse Products
              </span>
            </button>
            {/* Button Glow */}
            <div className="absolute inset-0 bg-neutral-900 rounded-2xl blur-xl opacity-30 -z-10"></div>
          </div>

          {/* Decorative Bottom Elements */}
          <div className="mt-12 flex items-center justify-center gap-2 text-neutral-400">
            <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
            <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
          </div>
          </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <button
                onClick={() => navigate('/')}
              className="p-2.5 sm:p-3 hover:bg-neutral-100 rounded-xl transition-all duration-300 hover:scale-110 group flex-shrink-0 shadow-sm hover:shadow-md"
              aria-label="Back to home"
              >
              <FiArrowLeft size={20} className="text-neutral-700 group-hover:text-neutral-900 transition-colors" />
              </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 tracking-tight mb-2 sm:mb-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent pb-2 leading-[1.1] overflow-visible">
                My Wishlist
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 font-semibold">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                  </p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={clearWishlist}
                className="px-4 sm:px-5 py-2.5 sm:py-3 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 font-bold border-2 border-neutral-300 hover:border-neutral-400 flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                <FiTrash2 size={16} />
                Clear All
              </button>
            )}
          </div>
          
          {/* Wishlist Summary Stats */}
          {wishlistItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-900 rounded-xl">
                    <FiHeart className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Items</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">{wishlistItems.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-900 rounded-xl">
                    <FiPackage className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Value</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">
                      ${wishlistItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {wishlistItems.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden group animate-fade-in relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Decorative overlay */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Product Image */}
              <div className="relative overflow-hidden bg-neutral-100 h-48 sm:h-56">
                {product.image && product.image.trim() !== '' ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width={345}
                    height={224}
                    fetchPriority="low"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-5xl sm:text-6xl">
                    ☕
                  </div>
                )}
                {product.category && (
                  <div className="absolute top-3 left-3 bg-neutral-900 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg">
                    {product.category}
                  </div>
                )}
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="absolute top-3 right-3 p-2.5 bg-white text-red-500 rounded-full shadow-xl hover:bg-red-50 transition-all duration-300 border-2 border-red-200 hover:border-red-300"
                  aria-label="Remove from wishlist"
                >
                  <FiHeart size={18} className="fill-current text-red-500" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5">
                <div className="text-base sm:text-lg font-black text-neutral-900 mb-2 line-clamp-2 min-h-[3rem] tracking-tight">
                  {product.name}
                </div>
                {product.description && (
                  <p className="text-xs sm:text-sm text-neutral-600 mb-3 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl sm:text-2xl font-black text-neutral-900">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-neutral-900 text-white py-3 rounded-xl font-black hover:bg-neutral-950 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  <FiShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Wishlist;

