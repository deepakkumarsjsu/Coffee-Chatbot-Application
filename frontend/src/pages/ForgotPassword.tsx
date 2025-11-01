import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import logoImage from '../../assets/logo_final.jpg';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim())
    .pipe(z.string().email('Please enter a valid email address')),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setMessage('');
    try {
      await resetPassword(data.email);
      setMessage('Check your inbox for password reset instructions');
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden flex items-center justify-center p-4 font-nunito">
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Enhanced Logo/Brand Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4 relative">
            <img 
              src={logoImage} 
              alt="Merry's Coffee Shop Logo" 
              className="w-40 h-40 md:w-48 md:h-48 object-contain relative z-10"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 mb-2 tracking-tight animate-slide-in-up bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent pb-2 leading-[1.1] overflow-visible">
            Reset Password
          </h1>
          <p className="text-neutral-600 font-semibold text-base md:text-lg tracking-wide">Enter your email to receive reset instructions</p>
        </div>

        {/* Enhanced Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 p-6 md:p-8 animate-slide-in-up relative overflow-hidden">
        {message && (
            <div className="mb-6 p-4 bg-neutral-50 border-2 border-neutral-300 rounded-xl text-neutral-800 text-sm font-semibold">
            {message}
          </div>
        )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            {/* Enhanced Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-neutral-900 tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FiMail className="text-neutral-500" size={20} />
                  </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                  className={`w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base hover:border-neutral-400 ${
                    errors.email && touchedFields.email ? 'border-red-500' : 'border-neutral-300'
                  }`}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && touchedFields.email && (
              <p className="text-red-500 text-sm font-semibold ml-1">{errors.email.message}</p>
            )}
          </div>

            {/* Enhanced Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
              className="w-full bg-neutral-900 text-white py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-950 hover:scale-[1.02] active:scale-100 mt-2"
          >
            {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-base">Sending...</span>
                </div>
            ) : (
                <span className="text-lg">Send Reset Link</span>
            )}
          </button>
        </form>

          {/* Enhanced Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
              className="inline-flex items-center gap-2 text-neutral-900 font-black text-base transition-all duration-300 hover:text-neutral-700 hover:underline"
          >
              <FiArrowLeft size={18} />
              <span>Back to Sign In</span>
          </Link>
          </div>
        </div>

        {/* Enhanced Footer */}
        <p className="text-center text-neutral-500 text-xs mt-6 font-semibold">
          © 2024 Merry's Coffee Shop. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;

