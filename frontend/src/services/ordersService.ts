import { ref, get, set, remove, DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import { Order } from '../types/types';

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot: DataSnapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      // Convert Firebase object to array, filter by userId, and sort by date
      const orders: Order[] = Object.keys(ordersData)
        .map((key) => ({
          id: key,
          ...ordersData[key],
        }))
        .filter((order) => order.userId === userId) // Filter by userId on client side
        .sort((a, b) => {
          // Sort by createdAt date, newest first
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      
      return orders;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Failed to fetch orders. Please try again later.');
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot: DataSnapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return {
        id: orderId,
        ...snapshot.val(),
      };
    }
    return null;
  } catch (error) {
    throw new Error('Failed to fetch order. Please try again later.');
  }
};

// Admin functions
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot: DataSnapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const orders: Order[] = Object.keys(ordersData)
        .map((key) => ({
          id: key,
          ...ordersData[key],
        }))
        .sort((a, b) => {
          // Sort by createdAt date, newest first
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      
      return orders;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Failed to fetch orders. Please try again later.');
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}/status`);
    await set(orderRef, status);
  } catch (error) {
    throw new Error('Failed to update order status. Please try again later.');
  }
};

export const updateOrder = async (orderId: string, orderData: Partial<Order>): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const currentOrder = await fetchOrderById(orderId);
    
    if (!currentOrder) {
      throw new Error('Order not found');
    }
    
    // Merge current order with updates, but exclude id from orderData
    const { id, ...orderDataWithoutId } = orderData;
    const updatedOrder = {
      ...currentOrder,
      ...orderDataWithoutId,
    };
    
    // Remove id from the data before saving (Firebase doesn't need it in the data)
    const { id: orderIdField, ...orderToSave } = updatedOrder;
    
    await set(orderRef, orderToSave);
  } catch (error) {
    throw new Error('Failed to update order. Please try again later.');
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await remove(orderRef);
  } catch (error) {
    throw new Error('Failed to delete order. Please try again later.');
  }
};

