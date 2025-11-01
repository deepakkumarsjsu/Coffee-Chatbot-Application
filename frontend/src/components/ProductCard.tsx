import { Product } from '../types/types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { FiShoppingCart, FiPlus, FiMinus, FiHeart } from 'react-icons/fi';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onCardClick: (product: Product) => void;
}

const ProductCard = ({ product, onCardClick }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md border border-neutral-200 hover:shadow-xl hover:border-neutral-300 transition-all duration-300 overflow-hidden group animate-fade-in cursor-pointer"
      onClick={() => onCardClick(product)}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-neutral-100 h-48">
        {product.image && product.image.trim() !== '' ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={345}
            height={192}
            fetchPriority="low"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-6xl">
            ☕
          </div>
        )}
        {product.category && (
          <div className="absolute top-2 left-2 bg-neutral-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {product.category}
          </div>
        )}
        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (inWishlist) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist(product);
            }
          }}
          className={`absolute top-2 right-2 p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 ${
            inWishlist
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white/90 text-neutral-600 hover:bg-white hover:text-red-500'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart size={18} className={inWishlist ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4 line-clamp-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-neutral-900">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Quantity Selector and Add to Cart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* Quantity Selector */}
            <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden h-[44px]">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleQuantityChange(-1);
                }}
                className="px-4 h-full hover:bg-neutral-100 transition-colors flex items-center justify-center font-semibold text-neutral-700"
                aria-label="Decrease quantity"
              >
                <FiMinus size={16} className="text-neutral-700" />
              </button>
              <span className="px-5 h-full min-w-[3rem] text-center font-medium flex items-center justify-center text-neutral-900">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleQuantityChange(1);
                }}
                className="px-4 h-full hover:bg-neutral-100 transition-colors flex items-center justify-center font-semibold text-neutral-700"
                aria-label="Increase quantity"
              >
                <FiPlus size={16} className="text-neutral-700" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking button
                handleAddToCart();
              }}
              className="flex-1 bg-neutral-800 text-white border border-transparent px-4 h-[44px] rounded-lg font-semibold hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              <FiShoppingCart size={16} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

