import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllOrders, updateOrderStatus, deleteOrder, updateOrder } from '../services/ordersService';
import { Order, Product, OrderItem } from '../types/types';
import { getAllAdmins, addAdmin, removeAdmin } from '../services/adminService';
import { clearAdminCache } from '../utils/adminCheck';
import { fetchProducts } from '../services/productsService';
import { 
  FiPackage, FiEdit, FiTrash2, FiRefreshCw, FiSearch, FiFilter, FiPlus, 
  FiClock, FiCheckCircle, FiUsers, FiLogOut, FiDollarSign, 
  FiTrendingUp, FiX, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiBarChart2, FiShoppingBag, FiUser, FiMail, FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [admins, setAdmins] = useState<Array<{ userId: string; email: string; createdAt: string; expiresAt?: string }>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(3);
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    loadOrders();
    loadAdmins();
  }, [currentUser, isAdmin, navigate]);

  const loadAdmins = async () => {
    try {
      const allAdmins = await getAllAdmins();
      setAdmins(allAdmins);
    } catch (error: any) {
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const userId = prompt('Enter the user ID (Firebase UID) for this email:');
    if (!userId) return;

    try {
      await addAdmin(userId, newAdminEmail.trim());
      toast.success('Admin added successfully');
      setNewAdminEmail('');
      await loadAdmins();
      clearAdminCache(userId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove admin privileges from this user?')) {
      return;
    }

    try {
      await removeAdmin(userId);
      toast.success('Admin removed successfully');
      await loadAdmins();
      clearAdminCache(userId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove admin');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAllOrders();
      setOrders(allOrders);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteOrder(orderId);
      toast.success('Order deleted successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleSaveEdit = async (updatedOrder: Partial<Order>) => {
    if (!editingOrder) return;

    try {
      const newTotal = updatedOrder.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || editingOrder.total;
      
      await updateOrder(editingOrder.id, {
        ...updatedOrder,
        total: newTotal,
      });
      toast.success('Order updated successfully');
      setEditingOrder(null);
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/50';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50';
      case 'preparing':
        return 'bg-neutral-800 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-neutral-400 to-neutral-500 text-white';
    }
  };

  const statusOptions: Order['status'][] = ['preparing', 'completed', 'cancelled'];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to page 1 when filteredOrders change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, searchQuery, statusFilter]);

  // Calculate statistics
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, order) => sum + order.total * 1.1, 0);
  
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const totalOrders = orders.length;

  if (!currentUser || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Enhanced Header */}
      {!editingOrder && (
      <div className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-0 sm:h-20">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-semibold tracking-wide">Order Management System</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAdminManagement(!showAdminManagement)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold backdrop-blur-sm text-sm sm:text-base ${
                  showAdminManagement
                    ? 'bg-neutral-900 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-white/90 text-neutral-900 border-2 border-neutral-200 hover:bg-white hover:border-neutral-300'
                }`}
              >
                <FiUsers size={18} />
                <span className="hidden sm:inline">{showAdminManagement ? 'Hide Admins' : 'Manage Admins'}</span>
                <span className="sm:hidden">{showAdminManagement ? 'Hide' : 'Admins'}</span>
              </button>
              <button
                onClick={logout}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold bg-neutral-800 text-white hover:bg-neutral-900 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                title="Logout"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ zIndex: 10 }}>
        {/* Admin Management Section */}
        {showAdminManagement && (
          <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-neutral-200/50 p-4 sm:p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 flex items-center gap-2 sm:gap-4 tracking-tight">
                <div className="p-2 sm:p-3 bg-neutral-800 rounded-xl shadow-lg">
                  <FiUsers className="text-white" size={20} />
                </div>
                <span className="hidden sm:inline">Admin Management</span>
                <span className="sm:hidden">Admins</span>
              </h2>
            </div>
            
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-2xl border-2 border-neutral-200 shadow-md">
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-neutral-800 rounded-lg">
                  <FiPlus size={18} className="text-white" />
                </div>
                Add New Admin
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
                />
                <button
                  onClick={handleAddAdmin}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 shadow-md text-sm sm:text-base"
                >
                  Add Admin
                </button>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-3 sm:mt-4 font-medium">
                Note: You'll need to provide the user's Firebase UID when adding an admin.
              </p>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 mb-4 sm:mb-5 flex items-center gap-2">
                <FiUsers size={18} />
                Current Admins
              </h3>
              {admins.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
                  <p className="text-sm sm:text-base text-neutral-600 font-semibold">No admins found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.userId}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 text-base sm:text-lg truncate">{admin.email}</p>
                        <p className="text-xs sm:text-sm text-neutral-600 mt-1 break-words">
                          Added: {new Date(admin.createdAt).toLocaleDateString()}
                          {admin.expiresAt && (
                            <span className="ml-2 block sm:inline">
                              (Expires: {new Date(admin.expiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                      {admin.userId !== currentUser?.uid && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.userId)}
                          className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Orders Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiPackage className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{totalOrders}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">All Orders</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <FiTrendingUp size={16} />
                <span>All time</span>
              </div>
            </div>
          </div>

          {/* Preparing Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiClock className="text-white animate-spin-slow" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{preparingCount}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Preparing</p>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600 text-sm font-semibold">
                <FiRefreshCw size={16} className="animate-spin" />
                <span>In progress</span>
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-green-100/0 group-hover:from-emerald-100/30 group-hover:to-green-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-xl">
                  <FiCheckCircle className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Success</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{completedCount}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Completed</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <FiTrendingUp size={16} />
                <span>Finished</span>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiDollarSign className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Revenue</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Total Revenue</p>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600 text-sm font-semibold">
                <FiBarChart2 size={16} />
                <span>From completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-neutral-200/50 p-4 sm:p-6 md:p-8 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-extrabold text-neutral-900 mb-2 sm:mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-neutral-100 rounded-lg">
                  <FiSearch size={14} className="text-neutral-700" />
                </div>
                Search Orders
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div className="relative">
                  <FiSearch className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-neutral-400 group-hover:text-neutral-600 transition-colors z-10" size={18} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-5 py-2.5 sm:py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md focus:shadow-lg text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72">
              <label htmlFor="status-filter" className="block text-xs sm:text-sm font-extrabold text-neutral-900 mb-2 sm:mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-neutral-100 rounded-lg">
                  <FiFilter size={14} className="text-neutral-700" />
                </div>
                Filter by Status
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 font-medium appearance-none shadow-sm hover:shadow-md focus:shadow-lg pr-10 text-sm sm:text-base"
                  aria-label="Filter orders by status"
                >
                  <option value="all" className="bg-white">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-white">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <FiChevronDown className="text-neutral-500" size={18} />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadOrders}
                className="w-full lg:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-bold transform hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
          
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-bold text-neutral-700 uppercase tracking-wide">Active filters:</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                {searchQuery && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-neutral-800 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 border-2 border-neutral-200">
                    Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:bg-neutral-200 rounded-full p-1 transition-colors"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-neutral-800 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 border-2 border-neutral-200">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="hover:bg-neutral-200 rounded-full p-1 transition-colors"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-xs sm:text-sm text-neutral-700 hover:text-neutral-900 font-bold underline transition-colors ml-auto sm:ml-0"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Orders Table */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-neutral-200/50 p-16 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-900 mb-2">Loading orders...</p>
            <p className="text-sm text-neutral-500">Please wait while we fetch your data</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-neutral-200/50 p-16 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <FiPackage size={80} className="text-neutral-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">No orders found</h2>
            <p className="text-lg text-neutral-600 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No orders have been placed yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-neutral-200/50 animate-fade-in">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200">
                  <tr>
                    <th className="w-24 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Order ID</th>
                    <th className="w-48 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Customer</th>
                    <th className="w-64 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Items</th>
                    <th className="w-28 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Total</th>
                    <th className="w-32 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Status</th>
                    <th className="w-36 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Date</th>
                    <th className="w-24 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {currentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-neutral-50 transition-all duration-300 group border-b border-neutral-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-extrabold text-neutral-900 font-mono tracking-tight">
                          #{order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                          <FiUser size={16} className="text-neutral-600 flex-shrink-0" />
                          <span className="truncate">{order.customerName || 'Guest'}</span>
                        </div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1.5">
                          <FiMail size={14} className="text-neutral-500 flex-shrink-0" />
                          <span className="truncate">{order.customerEmail || 'No email'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900 font-bold flex items-center gap-2">
                          <FiShoppingBag size={16} className="text-neutral-600 flex-shrink-0" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-neutral-600 truncate mt-1.5" title={order.items.map(item => item.productName).join(', ')}>
                          {order.items.map(item => item.productName).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-extrabold text-neutral-900 flex items-center gap-2">
                          <FiDollarSign size={16} className="text-emerald-600 flex-shrink-0" />
                          ${(order.total * 1.1).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                          className={`w-full px-3 py-2 pr-7 rounded-xl text-sm font-bold border-0 focus:ring-2 focus:ring-neutral-400 outline-none transition-all duration-300 cursor-pointer appearance-none ${getStatusColor(order.status)}`}
                          aria-label={`Change status for order ${order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}`}
                        >
                          {statusOptions.map((status) => (
                              <option key={status} value={status} className="bg-white text-neutral-900">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L1 3H9L5 7Z" fill="white"/>
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900 font-bold flex items-center gap-2">
                          <FiCalendar size={16} className="text-neutral-600 flex-shrink-0" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1.5">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-2.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-neutral-300"
                            title="Edit order"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-red-200"
                            title="Delete order"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {currentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border-2 border-neutral-200 p-4 shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-extrabold text-neutral-900 font-mono tracking-tight mb-1">
                        #{order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-neutral-600 flex items-center gap-1">
                        <FiCalendar size={12} />
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                        className={`px-3 py-1.5 pr-7 rounded-lg text-xs font-bold border-0 focus:ring-2 focus:ring-neutral-400 outline-none transition-all duration-300 cursor-pointer appearance-none ${getStatusColor(order.status)}`}
                        aria-label={`Change status for order ${order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status} className="bg-white text-neutral-900">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 7L1 3H9L5 7Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FiUser size={14} className="text-neutral-600" />
                      <span className="font-bold text-neutral-900">{order.customerName || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <FiMail size={12} />
                      <span className="truncate">{order.customerEmail || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiShoppingBag size={14} className="text-neutral-600" />
                      <span className="font-bold text-neutral-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-xs text-neutral-600 line-clamp-2">
                      {order.items.map(item => item.productName).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">Total</div>
                      <div className="text-lg font-extrabold text-neutral-900 flex items-center gap-1">
                        <FiDollarSign size={16} className="text-emerald-600" />
                        ${(order.total * 1.1).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-300"
                        title="Edit order"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300"
                        title="Delete order"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-neutral-200/50 shadow-lg">
                <div className="text-xs sm:text-sm font-semibold text-neutral-600 text-center sm:text-left">
                  Showing <span className="font-extrabold text-neutral-900">{indexOfFirstOrder + 1}</span> to{' '}
                  <span className="font-extrabold text-neutral-900">
                    {Math.min(indexOfLastOrder, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-extrabold text-neutral-900">{filteredOrders.length}</span> orders
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === 1
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95'
                    }`}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 sm:gap-2">
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
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                              currentPage === page
                                ? 'bg-neutral-900 text-white shadow-lg scale-105'
                                : 'bg-white text-neutral-700 hover:bg-neutral-100 border-2 border-neutral-200 hover:border-neutral-300 hover:scale-110 active:scale-95'
                            }`}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="text-neutral-400 px-0.5 sm:px-1 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95'
                    }`}
                    aria-label="Next page"
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Order Modal */}
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Edit Order Modal Component
interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Partial<Order>) => void;
}

const EditOrderModal = ({ order, onClose, onSave }: EditOrderModalProps) => {
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');
  const [status, setStatus] = useState<Order['status']>(order.status);
  const [items, setItems] = useState(order.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ productId: '', productName: '', price: 0, quantity: 1, image: '' });
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
        
        // Update items with missing images by looking up from products
        setItems(currentItems => {
          const updatedItems = currentItems.map(item => {
            if (!item.image || item.image === '') {
              const product = fetchedProducts.find(p => p.id === item.productId);
              if (product && product.image) {
                return { ...item, image: product.image };
              }
            }
            return item;
          });
          return updatedItems;
        });
      } catch (error: any) {
        toast.error('Failed to load products');
      }
    };
    loadProducts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerName,
      customerEmail,
      status,
      items,
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], quantity };
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], price };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Order must have at least one item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setNewItem({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        quantity: newItem.quantity,
        image: selectedProduct.image || '',
      });
    }
  };

  const addNewItem = () => {
    if (!newItem.productId) {
      toast.error('Please select a product');
      return;
    }
    if (newItem.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (newItem.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const itemToAdd: OrderItem = {
      productId: newItem.productId,
      productName: newItem.productName,
      price: newItem.price,
      quantity: newItem.quantity,
      image: newItem.image || '',
    };

    setItems([...items, itemToAdd]);
    setNewItem({ productId: '', productName: '', price: 0, quantity: 1, image: '' });
    setShowAddItem(false);
    toast.success('Item added to order');
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-neutral-200 animate-slide-in-up relative flex flex-col" style={{ zIndex: 10000 }}>
        <div className="sticky top-0 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between z-10 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 flex items-center gap-2 sm:gap-4 tracking-tight">
            <div className="p-2 sm:p-3 bg-neutral-800 rounded-xl shadow-lg">
              <FiEdit className="text-white" size={18} />
            </div>
            <span className="hidden sm:inline">Edit Order</span>
            <span className="sm:hidden">Edit</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-neutral-300"
            aria-label="Close edit order modal"
          >
            <FiX size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 min-h-0">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <FiUser size={18} className="text-neutral-700" />
              </div>
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="edit-customer-name" className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                  Customer Name
                </label>
                <input
                  id="edit-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
                  aria-label="Customer name"
                />
              </div>
              <div>
                <label htmlFor="edit-customer-email" className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                  Customer Email
                </label>
                <input
                  id="edit-customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
                  aria-label="Customer email"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <label htmlFor="edit-order-status" className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
              Order Status
            </label>
            <select
              id="edit-order-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Order['status'])}
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 font-medium shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
              aria-label="Order status"
            >
              <option value="preparing" className="bg-white">Preparing</option>
              <option value="completed" className="bg-white">Completed</option>
              <option value="cancelled" className="bg-white">Cancelled</option>
            </select>
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <FiShoppingBag size={18} className="text-neutral-700" />
                </div>
                Order Items
              </h3>
              <button
                type="button"
                onClick={() => setShowAddItem(!showAddItem)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <FiPlus size={14} />
                {showAddItem ? 'Cancel' : 'Add Item'}
              </button>
            </div>

            {showAddItem && (
              <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-xl shadow-md overflow-hidden">
                <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 mb-4 sm:mb-5 uppercase tracking-wide">Add New Item</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label htmlFor="new-item-product" className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Product
                    </label>
                    <select
                      id="new-item-product"
                      value={newItem.productId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all"
                      aria-label="Select product to add to order"
                    >
                      <option value="" className="bg-white">Select a product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id} className="bg-white">
                          {product.name} - ${product.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="new-item-price" className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Price
                    </label>
                    <input
                      id="new-item-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.price || ''}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-neutral-100 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-xs sm:text-sm font-medium"
                      readOnly
                      aria-label="Item price (auto-filled)"
                    />
                    <p className="text-xs text-neutral-600 mt-1 font-medium">Auto-filled</p>
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="new-item-quantity" className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Quantity
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="new-item-quantity"
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all"
                        aria-label="Item quantity"
                      />
                      <button
                        type="button"
                        onClick={addNewItem}
                        disabled={!newItem.productId}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-300 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap flex-shrink-0"
                        aria-label="Add item to order"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-300">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <p className="font-bold text-neutral-900 text-sm sm:text-base truncate">{item.productName}</p>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 truncate">ID: {item.productId}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor={`item-quantity-${index}`} className="text-xs sm:text-sm font-bold text-neutral-700 whitespace-nowrap">Qty:</label>
                    <input
                      id={`item-quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                      className="flex-1 sm:w-20 px-3 py-2 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-xs sm:text-sm font-medium"
                      aria-label={`Quantity for ${item.productName}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor={`item-price-${index}`} className="text-xs sm:text-sm font-bold text-neutral-700 whitespace-nowrap">Price:</label>
                    <input
                      id={`item-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                      className="flex-1 sm:w-28 px-3 py-2 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-xs sm:text-sm font-medium"
                      aria-label={`Price for ${item.productName}`}
                    />
                  </div>
                  <div className="text-right sm:text-left min-w-[100px] bg-neutral-50 px-3 sm:px-4 py-2 rounded-lg border border-neutral-200 w-full sm:w-auto">
                    <p className="text-xs font-bold text-neutral-600 mb-1 uppercase tracking-wide">Total</p>
                    <p className="font-extrabold text-neutral-900 text-base sm:text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 sm:p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-red-200 self-end sm:self-auto"
                    aria-label={`Remove ${item.productName} from order`}
                  >
                    <FiTrash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl border-2 border-neutral-200 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-lg sm:text-xl font-extrabold text-neutral-900 uppercase tracking-tight">Total:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                ${(calculateTotal() * 1.1).toFixed(2)}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-neutral-600 mt-2 sm:mt-3 font-medium">
              Subtotal: ${calculateTotal().toFixed(2)} + Tax (10%): ${(calculateTotal() * 0.1).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-100 hover:border-neutral-400 transition-all duration-300 font-bold shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
