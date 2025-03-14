
import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { ConversationMessage } from '../../hooks/useVoiceConversation';

interface ConversationDisplayProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  isTranscribing?: boolean;
  liveTranscript?: string;
  maxHeight?: string;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  isLoading = false,
  isTranscribing = false,
  liveTranscript = '',
  maxHeight = '400px'
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or during live transcription
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, liveTranscript]);

  if (messages.length === 0 && !isLoading && !isTranscribing) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          Your conversation will appear here. Start speaking to begin.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} style={{ maxHeight }} className="p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/assistant-avatar.png" alt="AI" />
                  <AvatarFallback className="bg-blue-100 text-blue-500">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div 
                className={`relative max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.timestamp && (
                  <p className="text-[10px] opacity-70 mt-1">
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </p>
                )}
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary">ME</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {/* Live transcription */}
          {isTranscribing && liveTranscript && (
            <div className="flex justify-end gap-3">
              <div className="relative max-w-[80%] px-4 py-2 rounded-lg bg-primary/50 text-primary-foreground ml-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="h-3 w-3 animate-pulse" />
                  <span className="text-xs">Transcribing...</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{liveTranscript}</p>
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary">ME</AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center p-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ConversationDisplay;
