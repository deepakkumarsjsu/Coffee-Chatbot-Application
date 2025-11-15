import { useState, useEffect, useRef } from 'react';
import ChatRoom from '../pages/ChatRoom';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';
import chatbotImage from '../../assets/unnamed.jpg';
import { MessageInterface } from '../types/types';
import { useCart } from '../contexts/CartContext';

const ChatWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const welcomeMessageShown = useRef(false);
  const { clearCart } = useCart();

  // Welcome message on mount - show after 2 seconds so the intro message stays visible
  useEffect(() => {
    if (!welcomeMessageShown.current && messages.length === 0) {
      const welcomeMessage: MessageInterface = {
        role: 'assistant',
        content: "Hello! Welcome to Merry's Way Coffee Shop!\n\nI'm here to help you with:\n• Ordering your favorite coffee and pastries\n• Getting recommendations\n• Learning about our menu items\n\nHow can I assist you today?"
      };
      setTimeout(() => {
        setMessages([welcomeMessage]);
        welcomeMessageShown.current = true;
      }, 2000);
    }
  }, [messages.length]);

  const toggleChat = () => {
    if (isFullScreen) {
      setIsFullScreen(false);
      // Clear cart when exiting full screen
      clearCart(true);
    } else {
      // On mobile, go directly to full screen; on desktop, show medium widget
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setIsFullScreen(true);
        setIsExpanded(false);
      } else {
        // If closing the widget (was expanded, now closing)
        if (isExpanded) {
          clearCart(true); // Clear cart when closing widget
        }
      setIsExpanded(!isExpanded);
      }
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const minimizeToSmallest = () => {
    setIsFullScreen(false);
    setIsExpanded(false);
    // Clear cart when chat is closed
    clearCart(true); // Silent clear - no toast message
  };

  return (
    <>
      {/* Chat Widget Button (Minimized State) */}
      {!isExpanded && !isFullScreen && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
          {/* Helper Message */}
          <div className="bg-white rounded-lg shadow-xl px-4 py-2.5 border border-neutral-200 animate-slide-in-right">
            <p className="text-sm font-medium text-neutral-700 whitespace-nowrap">
              AI Assistant
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click to chat
            </p>
          </div>
          
          {/* Chat Button */}
          <button
            onClick={toggleChat}
            className="w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group p-0 border-0 bg-transparent"
            aria-label="Open chat"
          >
            <div className="relative">
              <img 
                src={chatbotImage} 
                alt="Chat" 
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </button>
        </div>
      )}

      {/* Widget Chat Window - Hidden on mobile, only show on desktop/tablet */}
      {isExpanded && !isFullScreen && (
        <div className="hidden md:flex fixed bottom-6 right-6 w-[400px] md:w-[500px] h-[600px] md:h-[700px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex-col z-50 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={chatbotImage} 
                  alt="Merry's Way Coffee Shop" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Merry's Way</h3>
                <p className="text-neutral-300 text-xs">Your Coffee Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullScreen}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Expand to full screen"
              >
                <FiMaximize2 className="text-white" size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Minimize chat"
              >
                <FiX className="text-white" size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <ChatRoom 
              isWidget={true} 
              messages={messages}
              setMessages={setMessages}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isSending={isSending}
              setIsSending={setIsSending}
              onCloseChat={minimizeToSmallest}
            />
          </div>
        </div>
      )}

      {/* Full Screen Chat Window */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-neutral-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img 
                  src={chatbotImage} 
                  alt="Merry's Way Coffee Shop" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base sm:text-lg md:text-xl truncate">Merry's Way</h3>
                <p className="text-neutral-300 text-xs sm:text-sm truncate">Your Coffee Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={toggleFullScreen}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Exit full screen"
              >
                <FiMinimize2 className="text-white" size={18} />
              </button>
              <button
                onClick={minimizeToSmallest}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Minimize to smallest"
              >
                <FiX className="text-white" size={18} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <ChatRoom 
              isWidget={false} 
              isFullScreen={true}
              messages={messages}
              setMessages={setMessages}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isSending={isSending}
              setIsSending={setIsSending}
              onCloseChat={minimizeToSmallest}
            />
          </div>
        </div>
      )}

      {/* Backdrop Overlay (when widget is open) - Only on desktop */}
      {isExpanded && !isFullScreen && (
        <div 
          className="hidden md:block fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={toggleChat}
        />
      )}
    </>
  );
};

export default ChatWidget;

