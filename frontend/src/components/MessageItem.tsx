import { MessageInterface } from '../types/types';
import chatbotImage from '../../assets/unnamed.jpg';

interface Message {
    message: MessageInterface;
}

const MessageItem = ({message}:Message) => {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (message?.role == 'user') {
    return (
        <div
            className='flex flex-row justify-end mb-5 mr-4 animate-slide-in-right'
        >
            <div className='max-w-[80%] md:max-w-[70%]'>
                <div className='self-end p-4 rounded-2xl bg-neutral-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group'>
                    <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000'></div>
                    <p className='text-base leading-relaxed whitespace-pre-wrap break-words relative z-10'>
                        {message?.content}
                    </p>
                </div>
                <div className='text-sm text-neutral-500 mt-2 mr-1 text-right flex items-center justify-end gap-1'>
                    <span>{getCurrentTime()}</span>
                    <span>•</span>
                    <span>You</span>
                </div>
            </div>
        </div>
    )
  } else {
    return (
        <div
            className='w-[80%] md:w-[70%] ml-4 mb-5 animate-slide-in-left'
        >
            <div className='flex items-start gap-3'>
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
                    <div className='flex self-start p-4 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-neutral-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-neutral-300 relative overflow-hidden group'>
                        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-300 via-neutral-400 to-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                        <p className='text-base text-neutral-700 leading-relaxed whitespace-pre-wrap break-words relative z-10'>
                            {message?.content}
                        </p>
                    </div>
                    <div className='text-sm text-neutral-500 mt-2 ml-1 flex items-center gap-1'>
                        <span>Merry's Assistant</span>
                        <span>•</span>
                        <span>{getCurrentTime()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
  }
}

export default MessageItem

