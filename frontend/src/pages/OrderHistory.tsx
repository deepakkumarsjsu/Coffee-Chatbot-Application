import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserOrders } from '../services/ordersService';
import { Order } from '../types/types';
import { FiArrowLeft, FiPackage, FiClock, FiCheckCircle, FiXCircle, FiLoader, FiChevronLeft, FiChevronRight, FiDollarSign, FiShoppingBag, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        // Still show spinner for 1 second
        setTimeout(() => setShowSpinner(false), 1000);
        return;
      }

      try {
        setLoading(true);
        setShowSpinner(true);
        const userOrders = await fetchUserOrders(currentUser.uid);
        setOrders(userOrders);
        
        // Ensure spinner shows for minimum 1 second
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));
        await minLoadTime;
      } catch (error: any) {
        toast.error(error.message || 'Failed to load orders');
      } finally {
        setLoading(false);
        setShowSpinner(false);
      }
    };

    loadOrders();
  }, [currentUser?.uid]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-neutral-700" size={22} />;
      case 'cancelled':
        return <FiXCircle className="text-neutral-700" size={22} />;
      case 'preparing':
        return <FiLoader className="text-neutral-700 animate-spin" size={22} />;
      default:
        return <FiClock className="text-neutral-700" size={22} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-neutral-100 text-neutral-900 border-neutral-300 shadow-neutral-200';
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-900 border-neutral-300 shadow-neutral-200';
      case 'preparing':
        return 'bg-neutral-100 text-neutral-900 border-neutral-300 shadow-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-900 border-neutral-300 shadow-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to page 1 when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showSpinner) {
    return <LoadingSpinner message="Loading your orders" />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-6 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12">
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
                Order History
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 font-semibold">Track and review all your past orders</p>
            </div>
          </div>
          
          {/* Stats Summary */}
          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-900 rounded-xl">
                    <FiShoppingBag className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Orders</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">{orders.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-900 rounded-xl">
                    <FiCheckCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">
                      {orders.filter(o => o.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-neutral-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-900 rounded-xl">
                    <FiDollarSign className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Spent</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">
                      ${orders.reduce((sum, o) => sum + (o.total * 1.1), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-32">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-4 sm:mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-base sm:text-lg font-semibold text-neutral-900 mb-1">Loading your orders...</p>
              <p className="text-xs sm:text-sm text-neutral-500">Please wait while we fetch your order history</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200/50 p-8 sm:p-12 md:p-16 text-center animate-fade-in">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <FiPackage size={48} className="text-neutral-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-neutral-200 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2 sm:mb-3 tracking-tight">No orders yet</h2>
            <p className="text-base sm:text-lg text-neutral-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">Start shopping to see your orders appear here. Discover our amazing coffee selection!</p>
            <button
              onClick={() => navigate('/')}
              className="bg-neutral-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-5">
              {currentOrders.map((order, orderIndex) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 hover:shadow-xl hover:border-neutral-300 transition-all duration-300 overflow-hidden group animate-fade-in relative"
                style={{ animationDelay: `${orderIndex * 100}ms` }}
              >
                {/* Decorative overlay */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Order Header */}
                <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 px-4 sm:px-5 py-3 sm:py-4 border-b-2 border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 bg-neutral-900 rounded-lg shadow-md">
                          <FiPackage className="text-white" size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Order #</p>
                          <p className="text-lg sm:text-xl font-black text-neutral-900 font-mono tracking-tight">
                          {order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 ml-11">
                        <FiCalendar size={12} className="text-neutral-400" />
                        <p className="text-xs sm:text-sm font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-row items-center gap-3 ml-11 sm:ml-0">
                      <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 shadow-md ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="font-black capitalize text-xs sm:text-sm">{order.status}</span>
                      </div>
                      <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-center min-w-[120px]">
                        <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-0.5">Total</p>
                        <p className="text-xl sm:text-2xl font-black tracking-tight">
                          ${(order.total * 1.1).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-neutral-200">
                    <div className="p-1.5 bg-neutral-900 rounded-lg">
                      <FiShoppingBag className="text-white" size={16} />
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">Order Items</h2>
                    <span className="ml-auto px-2.5 py-1 bg-neutral-900 text-white text-xs font-black rounded-full">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gradient-to-br from-neutral-50 to-white border-2 border-neutral-200 rounded-xl"
                      >
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-neutral-200">
                            {item.image && item.image.trim() !== '' ? (
                              <img
                                src={item.image}
                                alt={item.productName || `Product ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                  parent.innerHTML = '<span class="text-neutral-600 font-semibold text-2xl sm:text-3xl">☕</span>';
                                  }
                                }}
                              />
                            ) : (
                            <span className="text-neutral-600 font-semibold text-2xl sm:text-3xl">☕</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                          <p className="font-black text-neutral-900 truncate mb-1.5 text-sm sm:text-base">
                              {item.productName || `Product ${index + 1}`}
                            </p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="px-2 py-0.5 bg-neutral-200 text-neutral-700 font-bold rounded">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-neutral-500">×</span>
                              <span className="font-semibold text-neutral-700">${item.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-lg sm:text-xl font-black text-neutral-900">
                            ${((item.price || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t-2 border-neutral-200">
                    <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-xl p-4 sm:p-5 border-2 border-neutral-200 shadow-md">
                      <div className="space-y-2.5 mb-3">
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-wide flex items-center gap-2">
                            <FiDollarSign size={14} className="text-neutral-400" />
                            Subtotal
                          </span>
                          <span className="text-sm sm:text-base font-black text-neutral-800">${order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-wide">Tax & Fees (10%)</span>
                          <span className="text-sm sm:text-base font-black text-neutral-800">${(order.total * 0.1).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-neutral-300 bg-neutral-900 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 rounded-b-xl">
                        <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Total Amount</span>
                        <span className="text-xl sm:text-2xl font-black text-white">${(order.total * 1.1).toFixed(2)}</span>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-neutral-200 shadow-xl">
                <div className="text-sm sm:text-base font-bold text-neutral-700 text-center sm:text-left">
                  Showing <span className="font-black text-neutral-900 text-lg">{indexOfFirstOrder + 1}</span> to{' '}
                  <span className="font-black text-neutral-900 text-lg">
                    {Math.min(indexOfLastOrder, orders.length)}
                  </span>{' '}
                  of <span className="font-black text-neutral-900 text-lg">{orders.length}</span> orders
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                      currentPage === 1
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95 hover:shadow-xl'
                    }`}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={20} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[3rem] px-4 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 shadow-lg ${
                              currentPage === page
                                ? 'bg-gradient-to-br from-neutral-900 to-neutral-800 text-white shadow-xl scale-110'
                                : 'bg-white text-neutral-700 hover:bg-neutral-100 border-2 border-neutral-200 hover:border-neutral-300 hover:scale-110 active:scale-95 hover:shadow-xl'
                            }`}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="text-neutral-400 px-2 text-sm font-bold">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                      currentPage === totalPages
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95 hover:shadow-xl'
                    }`}
                    aria-label="Next page"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default OrderHistory;

