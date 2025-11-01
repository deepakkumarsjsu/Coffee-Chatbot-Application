import { FiCoffee } from 'react-icons/fi';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message = 'Loading...' }: LoadingSpinnerProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Animated Coffee Cup Spinner */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
          </div>
          
          {/* Middle rotating ring (reverse) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-transparent border-r-neutral-700 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Inner coffee cup */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-full flex items-center justify-center shadow-2xl">
              <FiCoffee 
                className="text-white animate-pulse" 
                size={32}
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
          </div>
          <div className="absolute top-1/4 right-0 translate-x-2">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="absolute bottom-1/4 left-0 -translate-x-2">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
            {message}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

