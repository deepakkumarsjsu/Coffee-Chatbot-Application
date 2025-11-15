import React from 'react'

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-neutral-600 font-medium">Merry is typing</span>
      <div className="flex gap-1.5 items-center">
        <span 
          className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-bounce shadow-sm"
          style={{ animationDelay: '0ms', animationDuration: '1.2s' }}
        />
        <span 
          className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-bounce shadow-sm"
          style={{ animationDelay: '200ms', animationDuration: '1.2s' }}
        />
        <span 
          className="w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-bounce shadow-sm"
          style={{ animationDelay: '400ms', animationDuration: '1.2s' }}
        />
      </div>
    </div>
  )
}

export default TypingIndicator

