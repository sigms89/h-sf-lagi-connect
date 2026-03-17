// ============================================================
// Húsfélagið.is — Bid Message Thread Component
// Chat-like message thread for a specific bid
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { useBidMessages, useSendBidMessage } from '@/hooks/useBidMessages';
import { useAuth } from '@/hooks/useAuth';
import type { BidMessage } from '@/types/database';

// ============================================================
// Helpers
// ============================================================
function formatMessageTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// Message Bubble
// ============================================================
interface MessageBubbleProps {
  message: BidMessage;
  isMine: boolean;
}

function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
      {message.sender_name && !isMine && (
        <span className="text-xs text-muted-foreground px-1">{message.sender_name}</span>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {message.message}
      </div>
      <span className="text-[10px] text-muted-foreground px-1">
        {formatMessageTime(message.created_at)}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
interface BidMessageThreadProps {
  bidId: string;
  /** Optional label shown in card header, e.g. the bid title */
  label?: string;
}

export function BidMessageThread({ bidId, label }: BidMessageThreadProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useBidMessages(bidId);
  const sendMessage = useSendBidMessage();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setText('');
    await sendMessage.mutateAsync({ bidId, message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full min-h-[400px]">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {label ? `Skilaboð: ${label}` : 'Skilaboð'}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0 min-h-0">
        {/* Message list */}
        <ScrollArea className="flex-1 px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Engin skilaboð enn</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Byrjaðu samtal hér að neðan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === user?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skrifaðu skilaboð..."
            className="flex-1 h-9"
            disabled={sendMessage.isPending}
            aria-label="Skilaboð"
          />
          <Button
            size="sm"
            className="h-9 px-3"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            aria-label="Senda"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
