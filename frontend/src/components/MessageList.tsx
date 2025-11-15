import { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import { MessageInterface } from '../types/types';
import TypingIndicator from './TypingIndicator';
import chatbotImage from '../../assets/unnamed.jpg';

interface MessageListProps {
  messages: MessageInterface[];
  isTyping: boolean;
}

const MessageList = ({messages,isTyping = false}:MessageListProps) => {

  const scrollViewRef = useRef<HTMLDivElement | null>(null)
  
  // Smooth scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    if (scrollViewRef.current) {
      const scrollContainer = scrollViewRef.current;
      // Always scroll to bottom when new messages arrive or typing indicator appears
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages, isTyping])

  return (
    <div
      ref={scrollViewRef}
      className='overflow-y-scroll h-full px-4 py-6 scroll-smooth relative min-h-0 message-list-scroll'
      style={{
        scrollbarWidth: 'auto',
        scrollbarColor: '#1F2937 #F3F4F6'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {
          messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-neutral-500 animate-fade-in">
                <div className="mb-6 relative">
                  <div className="w-24 h-24 mx-auto rounded-full bg-neutral-800 flex items-center justify-center shadow-2xl overflow-hidden">
                    <img 
                      src={chatbotImage} 
                      alt="Merry's Way Coffee Shop" 
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 rounded-full blur-xl"></div>
                </div>
                <p className="text-2xl font-semibold text-neutral-900 mb-2">Hi there! 👋</p>
                <p className="text-base text-neutral-600">I'm here to help you find the perfect coffee. What can I get started for you today?</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">Order Coffee</span>
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">Menu Items</span>
                  <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">Recommendations</span>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageItem key={index} message={message} />
            ))
          )
        }
      
        {isTyping && (
          <div className="w-[80%] md:w-[70%] ml-4 mb-4 animate-slide-in-left">
            <div className="flex items-start gap-3">
              <div className='relative flex-shrink-0'>
                <div className='w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden'>
                  <img 
                    src={chatbotImage} 
                    alt="Merry's Assistant" 
                    className='w-full h-full object-cover'
                  />
                </div>
                <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm'></div>
              </div>
              <div className='flex-1'>
                <div className="flex self-start p-4 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-neutral-200 shadow-md">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageList

