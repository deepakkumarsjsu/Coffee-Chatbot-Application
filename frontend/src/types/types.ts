// Message Interface
export interface MessageInterface {
    role: string;
    content: string;
    memory?: any;
}

// Product Interface
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

// Cart Item Interface
export interface CartItem {
    product: Product;
    quantity: number;
}

// Order Item Interface (simplified structure stored in Firebase)
export interface OrderItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image?: string;
}

// Order Interface
export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: 'preparing' | 'completed' | 'cancelled';
    createdAt: string;
    customerName?: string;
    customerEmail?: string;
}

