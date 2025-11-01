import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import logoImage from '../../assets/logo_final.jpg';

const signupSchema = z.object({
  displayName: z.string().min(1, 'Full name is required').min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim())
    .pipe(z.string().email('Please enter a valid email address')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data.email, data.password, data.displayName);
      navigate('/');
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden flex items-start justify-center p-4 pt-4 pb-6 font-nunito">

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Enhanced Logo/Brand Section */}
        <div className="text-center mb-4 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-2 relative">
            <img 
              src={logoImage} 
              alt="Merry's Coffee Shop Logo" 
              className="w-28 h-28 md:w-32 md:h-32 object-contain relative z-10"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-1 tracking-tight animate-slide-in-up bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent pb-1 leading-[1.1] overflow-visible">
            Join Us Today
          </h1>
          <p className="text-neutral-600 font-semibold text-sm md:text-base tracking-wide">Create your account at Merry's Coffee Shop</p>
        </div>

        {/* Enhanced Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 p-4 md:p-5 animate-slide-in-up relative overflow-hidden">
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
            {/* Enhanced Full Name Field */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-black text-neutral-900 tracking-wide uppercase">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FiUser className="text-neutral-500" size={20} />
                </div>
                <input
                  id="displayName"
                  type="text"
                  {...register('displayName')}
                  className={`w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base hover:border-neutral-400 ${
                    errors.displayName && touchedFields.displayName ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.displayName && touchedFields.displayName && (
                <p className="text-red-500 text-sm font-semibold ml-1">{errors.displayName.message}</p>
              )}
            </div>

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
              {errors.password && touchedFields.password ? (
                <p className="text-red-500 text-sm font-semibold ml-1">{errors.password.message}</p>
              ) : (
              <p className="text-xs text-neutral-600 font-semibold ml-1">Must be at least 6 characters</p>
              )}
            </div>

            {/* Enhanced Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-black text-neutral-900 tracking-wide uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FiLock className="text-neutral-500" size={20} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base hover:border-neutral-400 ${
                    errors.confirmPassword && touchedFields.confirmPassword ? 'border-red-500' : 'border-neutral-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && touchedFields.confirmPassword && (
                <p className="text-red-500 text-sm font-semibold ml-1">{errors.confirmPassword.message}</p>
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
                  <span className="text-base">Creating account...</span>
                </div>
              ) : (
                <>
                  <FiUserPlus size={22} />
                  <span className="text-lg">Create Account</span>
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
              <span className="px-4 bg-white text-neutral-600 font-black uppercase tracking-wider">Already have an account?</span>
            </div>
          </div>

          {/* Enhanced Sign In Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-neutral-900 font-black text-base transition-all duration-300 hover:text-neutral-700 hover:underline"
            >
              <span>Sign in instead</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>

        {/* Enhanced Footer */}
        <p className="text-center text-neutral-500 text-xs mt-4 font-semibold">
          © 2024 Merry's Coffee Shop. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default Signup;
