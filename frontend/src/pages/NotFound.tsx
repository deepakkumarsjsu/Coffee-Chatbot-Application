import { Link } from 'react-router-dom';
import { FiHome, FiCoffee, FiArrowLeft } from 'react-icons/fi';
import logoImage from '../../assets/logo_final.jpg';

const NotFound = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden flex items-center justify-center p-4 font-nunito">
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center mb-8 animate-fade-in">
          <img 
            src={logoImage} 
            alt="Merry's Coffee Shop Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10"
          />
        </div>

        {/* 404 Content */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 p-8 md:p-12 animate-slide-in-up relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-100/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-neutral-100/50 rounded-full blur-3xl -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            {/* 404 Number */}
            <div className="mb-6">
              <h1 className="text-8xl md:text-9xl font-black text-neutral-900 mb-4 tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent">
                404
              </h1>
              <div className="flex items-center justify-center gap-2 text-neutral-400 mb-4">
                <FiCoffee size={24} />
                <span className="text-xl font-semibold">Oops!</span>
                <FiCoffee size={24} />
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4 tracking-tight">
              Page Not Found
            </h2>
            <p className="text-neutral-600 font-semibold text-lg md:text-xl mb-8 max-w-md mx-auto">
              Looks like this page went for a coffee break and never came back! The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                to="/"
                className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:bg-neutral-950 hover:scale-[1.02] active:scale-100"
              >
                <FiHome size={22} />
                <span>Go Home</span>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto bg-white text-neutral-900 border-2 border-neutral-300 px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 hover:border-neutral-400 hover:scale-[1.02] active:scale-100"
              >
                <FiArrowLeft size={22} />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-500 text-xs mt-6 font-semibold">
          © 2024 Merry's Coffee Shop. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default NotFound;

