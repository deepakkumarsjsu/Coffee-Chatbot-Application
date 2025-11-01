import { ref, get, DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import { Product } from '../types/types';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot: DataSnapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      // Convert Firebase object to array and add IDs with defaults
      const products: Product[] = Object.keys(productsData).map((key) => {
        const productData = productsData[key];
        
        // Use image_url field from Firebase
        const imageUrl = productData.image_url || '';
        
        // Image URL validation (silent)
        
        return {
          id: key,
          name: productData.name || 'Unnamed Product',
          description: productData.description || '',
          price: productData.price || 0,
          image: imageUrl,
          category: productData.category || 'uncategorized',
        };
      });
      
      // Deduplicate products by ID to prevent duplicates
      const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
      );
      
      return uniqueProducts;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Failed to fetch products. Please try again later.');
  }
};

export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = ref(database, `products/${productId}`);
    const snapshot: DataSnapshot = await get(productRef);
    
    if (snapshot.exists()) {
      return {
        id: productId,
        ...snapshot.val(),
      };
    }
    return null;
  } catch (error) {
    throw new Error('Failed to fetch product. Please try again later.');
  }
};

