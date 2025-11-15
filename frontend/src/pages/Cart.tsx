import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiShoppingBag, FiPackage } from 'react-icons/fi';
import { ref, push } from 'firebase/database';
import { database } from '../config/firebase';
import toast from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show spinner for minimum 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // Show payment modal instead of placing order directly
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      const orderData = {
        userId: currentUser?.uid || 'anonymous',
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || '', // Include product image
        })),
        total: getTotalPrice(),
        status: 'preparing',
        createdAt: new Date().toISOString(),
        customerName: currentUser?.displayName || 'Guest',
        customerEmail: currentUser?.email || '',
        paymentStatus: 'paid',
      };

      const ordersRef = ref(database, 'orders');
      await push(ordersRef, orderData);

      clearCart(true); // Clear cart silently
      toast.success('Order placed successfully! Your cart has been cleared.');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your cart" />;
  }

  if (cartItems.length === 0) {
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
                <FiShoppingBag size={56} className="text-white" />
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
              Your Cart is Empty
            </h2>
          </div>
          <p className="text-lg sm:text-xl text-neutral-600 mb-10 font-semibold leading-relaxed">
            Looks like you haven't added anything yet.<br />
            <span className="text-neutral-500">Start exploring our delicious coffee collection!</span>
          </p>

          {/* Action Button */}
          <div className="relative">
          <button
            onClick={() => navigate('/')}
              className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white px-10 py-4 sm:px-12 sm:py-5 rounded-2xl font-black text-base sm:text-lg shadow-2xl"
          >
              <span className="flex items-center justify-center gap-3">
                <FiShoppingBag size={20} />
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
                Shopping Cart
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 font-semibold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

          {/* Cart Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-neutral-900 rounded-xl">
                  <FiShoppingBag className="text-white" size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Items</p>
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-neutral-900 rounded-xl">
                  <FiPackage className="text-white" size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Unique Products</p>
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900">{cartItems.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-neutral-900 rounded-xl">
                  <FiShoppingBag className="text-white" size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Subtotal</p>
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900">${getTotalPrice().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.product.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden animate-fade-in relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-md ring-2 ring-neutral-200">
                  {item.product.image && item.product.image.trim() !== '' ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={96}
                      height={96}
                      fetchPriority="low"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                      }}
                    />
                  ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-2xl sm:text-3xl">
                      ☕
                    </div>
                  )}
                </div>

                {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2 w-full sm:w-auto">
                      <div className="font-black text-neutral-900 text-base sm:text-lg mb-1">
                    {item.product.name}
                      </div>
                  {item.product.description && (
                        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 mb-2">
                    {item.product.description}
                  </p>
                  )}
                      <p className="text-base sm:text-lg font-black text-neutral-900">
                    ${item.product.price.toFixed(2)}
                        <span className="text-xs font-medium text-neutral-500 ml-1">each</span>
                  </p>
                </div>

                    {/* Quantity Controls and Remove */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                {/* Quantity Controls */}
                      <div className="flex items-center border-2 border-neutral-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-2 hover:bg-neutral-100 transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >
                          <FiMinus size={16} className="text-neutral-700" />
                    </button>
                        <span className="px-4 py-2 min-w-[3rem] text-center font-black text-base bg-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-3 py-2 hover:bg-neutral-100 transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >
                          <FiPlus size={16} className="text-neutral-700" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                        className="p-2.5 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-300 border-2 border-transparent hover:border-neutral-300"
                    aria-label="Remove from cart"
                  >
                        <FiTrash2 size={18} />
                  </button>
                </div>

                {/* Item Total */}
                    <div className="text-right bg-neutral-50 px-4 py-2.5 rounded-lg border-2 border-neutral-200 w-full sm:w-auto sm:min-w-[120px]">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
                      <p className="text-xl sm:text-2xl font-black text-neutral-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 p-5 sm:p-6 md:p-7 lg:sticky lg:top-24 animate-fade-in">
              <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b-2 border-neutral-200">
                <div className="p-2 bg-neutral-900 rounded-lg">
                  <FiShoppingBag className="text-white" size={18} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Order Summary</h2>
              </div>

              <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-xl p-4 sm:p-5 space-y-3 mb-5 sm:mb-6 border-2 border-neutral-200">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-wide">
                    Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-sm sm:text-base font-black text-neutral-800">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-wide">Tax & Fees (10%)</span>
                  <span className="text-sm sm:text-base font-black text-neutral-800">${(getTotalPrice() * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-neutral-300 pt-3 mt-3 flex justify-between items-center bg-neutral-900 -mx-4 sm:-mx-5 px-4 sm:px-5 py-3 rounded-b-xl">
                  <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Total</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">${(getTotalPrice() * 1.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
              <button
                onClick={handlePlaceOrder}
                  className="w-full bg-neutral-900 text-white py-3.5 sm:py-4 rounded-xl font-black text-base sm:text-lg hover:bg-neutral-950 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                  <FiShoppingBag size={18} />
                Place Order
              </button>

              <button
                onClick={() => clearCart()}
                  className="w-full bg-white text-neutral-700 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-neutral-100 transition-all duration-300 border-2 border-neutral-300 hover:border-neutral-400 text-sm sm:text-base"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={getTotalPrice() * 1.1}
        onPaymentSuccess={handlePaymentSuccess}
        cartItems={cartItems}
      />
    </main>
  );
};

export default Cart;

