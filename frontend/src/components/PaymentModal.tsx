import { useState, useEffect, FormEvent } from 'react';
import { FiX, FiCreditCard, FiCheckCircle, FiShield, FiStar, FiPackage } from 'react-icons/fi';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import { createPaymentIntent } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { STRIPE_PUBLISHABLE_KEY } from '../config/stripeConfig';
import { CartItem } from '../types/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentSuccess: () => void;
  cartItems?: CartItem[];
}

// Initialize Stripe for nested Elements provider
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Inner component that uses the clientSecret
const PaymentForm = ({ clientSecret, total, onPaymentSuccess, onClose, userEmail, cartItems }: {
  clientSecret: string;
  total: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
  userEmail?: string;
  cartItems?: CartItem[];
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment system is not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First, submit the elements to validate the form
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        // Handle validation error
        setError(submitError.message || 'Please check your payment details.');
        toast.error(submitError.message || 'Please check your payment details.');
        setIsProcessing(false);
        return;
      }

      // Then confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin,
          payment_method_data: {
            billing_details: {
              email: userEmail || null,
              phone: '', // Not collecting phone, pass empty string
              address: {
                line1: null,
                city: null,
                state: null,
                postal_code: null,
                country: null,
              }, // Not collecting address, pass object with null values
            },
          },
        },
        redirect: 'if_required', // Only redirect if 3D Secure is required
      });

      if (stripeError) {
        // Handle payment error
        setError(stripeError.message || 'Payment failed. Please try again.');
        toast.error(stripeError.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Don't show toast here - let the order placement handle success message
        onPaymentSuccess();
        onClose();
      } else {
        setError('Payment status is unexpected. Please contact support.');
        toast.error('Payment status is unexpected. Please contact support.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing. Please try again.');
      toast.error(err.message || 'An error occurred during payment processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden py-5 payment-modal-scroll" 
        style={{ minHeight: 0 }}
        tabIndex={0}
        role="region"
        aria-label="Payment form content"
      >
        <div className="pl-6 pr-10" style={{ paddingLeft: '1.5rem', paddingRight: '2.75rem' }}>
        <form onSubmit={handleSubmit} id="payment-form" className="space-y-6">
          {/* Order Items Display */}
          {cartItems && cartItems.length > 0 && (
            <div className="bg-gradient-to-br from-white to-neutral-50/50 rounded-2xl p-6 border-2 border-neutral-200 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl shadow-lg">
                  <FiPackage className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight">Order Summary</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    {item.product.image && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-100">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                          fetchPriority="low"
                        />
                      </div>
                    )}
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-neutral-900 truncate">{item.product.name}</h4>
                          {item.product.description && (
                            <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{item.product.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-neutral-900">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold text-neutral-700 mt-1">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-200">
                        <p className="text-xs text-neutral-500">
                          ${item.product.price.toFixed(2)} each × {item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Subtotal and Total */}
              <div className="mt-5 pt-5 border-t-2 border-neutral-300 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 font-medium">Subtotal</span>
                  <span className="text-neutral-900 font-semibold">${(total / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 font-medium">Tax & Fees (10%)</span>
                  <span className="text-neutral-900 font-semibold">${(total - total / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-300">
                  <span className="text-base font-black text-neutral-900">Total</span>
                  <span className="text-2xl font-black text-neutral-900">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total Amount Display - Enhanced */}
          <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-6 border-2 border-neutral-700 shadow-2xl overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <FiStar className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-300 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-xs text-neutral-400 font-medium">Secure payment via Stripe</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black text-white tracking-tight">${total.toFixed(2)}</p>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Including all fees</p>
              </div>
            </div>
          </div>

          {/* Error Message - Enhanced */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-300 rounded-xl p-4 animate-fade-in shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-1.5 bg-red-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                </div>
                <p className="text-sm text-red-900 font-semibold flex-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Section Header - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl shadow-lg">
                <FiCreditCard className="text-white" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Payment Details</h3>
                <p className="text-sm text-neutral-500 font-medium mt-0.5">Enter your card information securely</p>
              </div>
            </div>
          </div>

          {/* Stripe Payment Element - Enhanced */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-white to-neutral-50/50 border-2 border-neutral-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  fields: {
                    billingDetails: {
                      email: 'never',
                      phone: 'never',
                      address: 'never',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Security Notice - Enhanced */}
          <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200/60 shadow-lg overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <FiShield className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-base font-black text-neutral-900 mb-2 tracking-tight">Secure Payment</p>
                <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                  Your payment information is encrypted with bank-level security. We never store your card details. 
                  Powered by <span className="font-black text-neutral-900">Stripe</span>, trusted by millions worldwide.
                </p>
              </div>
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Fixed Footer with Buttons - Enhanced */}
      <div className="sticky bottom-0 bg-gradient-to-b from-white via-white to-white border-t-2 border-neutral-200 px-6 py-5 rounded-b-3xl shadow-lg">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-4 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 font-black text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="payment-form"
            disabled={!stripe || !elements || isProcessing}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-xl font-black text-base hover:from-neutral-950 hover:via-neutral-900 hover:to-neutral-950 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {isProcessing ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <FiCheckCircle size={22} className="relative z-10" />
                <span className="relative z-10">Pay ${total.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, total, onPaymentSuccess, cartItems }: PaymentModalProps) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && total > 0) {
      const createIntent = async () => {
        try {
          setIsProcessing(true);
          const response = await createPaymentIntent(total, {
            userId: currentUser?.uid,
            customerEmail: currentUser?.email,
          });
          setClientSecret(response.clientSecret);
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Failed to initialize payment. Please try again.');
          toast.error(err.message || 'Failed to initialize payment. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };

      createIntent();
    } else {
      // Reset when modal closes
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen, total, currentUser]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border-2 border-neutral-200/50 animate-slide-in-up relative flex flex-col backdrop-blur-sm" style={{ maxHeight: '90vh', height: 'auto' }}>
        {/* Fixed Header - Enhanced */}
        <div className="flex-shrink-0 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 border-b-2 border-neutral-200 px-6 py-6 flex items-center justify-between rounded-t-3xl z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 rounded-xl shadow-xl">
              <FiCreditCard className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Complete Payment</h2>
              <p className="text-xs text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Secure checkout</p>
            </div>
          </div>
          <div className="flex items-center">
          <button
            onClick={onClose}
            disabled={isProcessing}
              className="p-2.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-neutral-200 ml-auto"
            aria-label="Close"
          >
            <FiX size={22} />
          </button>
          </div>
        </div>

         {/* Scrollable Content Area */}
         <div className="flex-1 min-h-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {error && !clientSecret ? (
            <div className="p-6 h-full flex flex-col justify-center">
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 rounded-xl p-6 mb-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-lg">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-900 font-semibold">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-6 py-4 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 font-black shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ 
              clientSecret,
              appearance: {
                variables: {
                  colorPrimary: '#1F2937',
                },
              },
            }}>
              <PaymentForm
                clientSecret={clientSecret}
                total={total}
                onPaymentSuccess={onPaymentSuccess}
                onClose={onClose}
                userEmail={currentUser?.email || undefined}
                cartItems={cartItems}
              />
            </Elements>
          ) : (
            <div className="p-6 h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-800 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiCreditCard className="text-neutral-600" size={24} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-neutral-900 mb-2 tracking-tight">Initializing Payment</p>
                  <p className="text-sm text-neutral-600 font-medium">Please wait while we set up your secure checkout...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
