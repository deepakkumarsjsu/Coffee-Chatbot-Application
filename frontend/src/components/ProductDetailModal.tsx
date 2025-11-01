import { Product } from '../types/types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { FiX, FiShoppingCart, FiPlus, FiMinus, FiHeart } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  const inWishlist = product ? isInWishlist(product.id) : false;

  // Reset quantity when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <FiX size={24} className="text-neutral-700" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Product Image */}
          <div className="relative overflow-hidden bg-neutral-100 rounded-xl h-64 md:h-96">
            {product.image && product.image.trim() !== '' ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                width={600}
                height={400}
                fetchPriority="high"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-9xl">
                ☕
              </div>
            )}
            {product.category && (
              <div className="absolute top-4 left-4 bg-neutral-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {product.category}
              </div>
            )}
            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (inWishlist) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist(product);
                }
              }}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                inWishlist
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white/90 text-neutral-600 hover:bg-white hover:text-red-500'
              }`}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart size={20} className={inWishlist ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-neutral-800 mb-4">
                {product.name}
              </h2>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">Description</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-neutral-900">
                  ${product.price.toFixed(2)}
                </span>
              </div>

            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border-2 border-neutral-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-4 py-3 hover:bg-neutral-100 transition-colors flex items-center justify-center leading-tight"
                    aria-label="Decrease quantity"
                  >
                    <FiMinus size={20} />
                  </button>
                  <span className="px-6 py-3 min-w-[4rem] text-center font-semibold text-lg leading-tight">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-4 py-3 hover:bg-neutral-100 transition-colors flex items-center justify-center leading-tight"
                    aria-label="Increase quantity"
                  >
                    <FiPlus size={20} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-neutral-800 text-white border-2 border-transparent px-4 py-3 rounded-lg font-semibold hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl leading-tight"
                >
                  <FiShoppingCart size={20} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;

