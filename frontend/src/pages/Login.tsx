import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { checkAndCacheAdminStatus } from '../utils/adminCheck';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { auth } from '../config/firebase';
import logoImage from '../../assets/logo_final.jpg';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim())
    .pipe(z.string().email('Please enter a valid email address')),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormData) => {
    // Prevent multiple simultaneous submissions
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;
    
    try {
      await login(data.email, data.password);
      
      // Check admin status after successful login
      const user = auth.currentUser;
      if (user) {
        const isAdmin = await checkAndCacheAdminStatus(user.uid);
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
      navigate('/');
      }
    } catch (error) {
      // Error is already handled in AuthContext with user-friendly messages
    } finally {
      isSubmittingRef.current = false;
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
            Welcome Back
          </h1>
          <p className="text-neutral-600 font-semibold text-base md:text-lg tracking-wide">Sign in to continue to Merry's Coffee Shop</p>
        </div>

        {/* Enhanced Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 p-6 md:p-8 animate-slide-in-up relative overflow-hidden">
          
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

            {/* Enhanced Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-black text-neutral-900 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FiLock className="text-neutral-500" size={20} />
                  </div>
              <input
                id="password"
                type="password"
                {...register('password')}
                  className={`w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base hover:border-neutral-400 ${
                    errors.password && touchedFields.password ? 'border-red-500' : 'border-neutral-300'
                  }`}
                placeholder="••••••••"
              />
              </div>
              {errors.password && touchedFields.password && (
                <p className="text-red-500 text-sm font-semibold ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Enhanced Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-sm text-neutral-700 font-bold transition-all duration-200 hover:text-neutral-900 hover:underline"
              >
                Forgot password?
              </Link>
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
                  <span className="text-base">Signing in...</span>
                </div>
            ) : (
              <>
                  <FiLogIn size={22} />
                  <span className="text-lg">Sign In</span>
              </>
            )}
          </button>
        </form>

          {/* Enhanced Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-neutral-600 font-black uppercase tracking-wider">New to our shop?</span>
            </div>
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="text-center">
          <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-neutral-900 font-black text-base transition-all duration-300 hover:text-neutral-700 hover:underline"
          >
              <span>Create an account</span>
              <span className="text-xl">→</span>
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

export default Login;
