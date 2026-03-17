// ============================================================
// Húsfélagið.is — Notification Bell Component
// Shows unread badge + popover dropdown with recent notifications
// ============================================================

import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useMyNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  type AppNotification,
} from '@/hooks/useNotifications';

// ============================================================
// Helpers
// ============================================================
function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Rétt í þessu';
  if (diffMins < 60) return `${diffMins} mín síðan`;
  if (diffHours < 24) return `${diffHours} klst síðan`;
  if (diffDays === 1) return 'Í gær';
  if (diffDays < 7) return `${diffDays} dögum síðan`;
  return date.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'invite_sent': return '📨';
    case 'bid_received': return '📋';
    case 'bid_accepted': return '✅';
    case 'bid_rejected': return '❌';
    case 'bid_request_closed': return '🔒';
    case 'system': return 'ℹ️';
    default: return '🔔';
  }
}

// ============================================================
// Single Notification Item
// ============================================================
interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
      onClick={() => {
        if (!notification.is_read) onRead(notification.id);
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">
          {getNotificationIcon(notification.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" aria-label="Ólesið" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// Bell Component
// ============================================================
export function NotificationBell() {
  const { data: notifications = [], isLoading } = useMyNotifications(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Tilkynningar${unreadCount > 0 ? `, ${unreadCount} ólesnar` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground border-background border-2 rounded-full"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Tilkynningar</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {unreadCount} ólesnar
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Merkja allt sem lesið
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Engar tilkynningar</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Þú munt fá tilkynningar hér þegar eitthvað gerist
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                Sýni {notifications.length} nýjustu tilkynningar
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
