import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationService } from '../services/notification.service';
import { Notification, NotificationType } from '../types/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  user: any;
  theme: string;
}

const NotificationDropdown = ({ user, theme }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme-specific styles
  const textColor = theme === 'dark' ? 'text-[#C1A461]' : 'text-gray-900';
  const bgColor = theme === 'dark' ? 'bg-[#1B2228]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-[#C1A461]/20' : 'border-gray-200';
  const mutedTextColor = theme === 'dark' ? 'text-[#C1A461]/60' : 'text-gray-600';
  const hoverBgColor = theme === 'dark' ? 'hover:bg-[#C1A461]/10' : 'hover:bg-gray-50';

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [notificationData, count] = await Promise.all([
        NotificationService.getUserNotifications(user.id),
        NotificationService.getUnreadCount(user.id)
      ]);
      
      setNotifications(notificationData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification click and navigation
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type and related data
    let navigationPath = '';
    
    switch (notification.type) {
      case 'comment_reply':
      case 'bounty_comment':
        // Navigate to bounty details page where comments are displayed
        if (notification.related_bounty_id) {
          navigationPath = `/bounty/${notification.related_bounty_id}`;
        }
        break;
        
      case 'submission_accepted':
      case 'submission_rejected':
        // Navigate to bounty details page
        if (notification.related_bounty_id) {
          navigationPath = `/bounty/${notification.related_bounty_id}`;
        }
        break;
        
      case 'bounty_completed':
        // Navigate to bounty details page  
        if (notification.related_bounty_id) {
          navigationPath = `/bounty/${notification.related_bounty_id}`;
        }
        break;
        
      default:
        // Fallback navigation
        if (notification.related_bounty_id) {
          navigationPath = `/bounty/${notification.related_bounty_id}`;
        } else if (notification.related_submission_id) {
          navigationPath = `/mysubmission`;
        }
    }

    // Close dropdown and navigate
    setIsOpen(false);
    
    if (navigationPath) {
      navigate(navigationPath);
      // Add a small delay and scroll to comments section if it's a comment notification
      if (notification.type === 'comment_reply' || notification.type === 'bounty_comment') {
        setTimeout(() => {
          const commentsSection = document.querySelector('[data-comments-section]');
          if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // If no specific navigation available, show a message
      toast.info('No direct link available for this notification');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'submission_accepted':
        return '🎉';
      case 'submission_rejected':
        return '📝';
      case 'bounty_completed':
        return '✅';
      case 'comment_reply':
        return '💬';
      case 'bounty_comment':
        return '💬';
      case 'sponsor_comment':
        return '👑';
      default:
        return '📢';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Subscribe to real-time notifications
      const channel = NotificationService.subscribeToNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notifications
        toast.success(`${newNotification.title}`, {
          duration: 4000,
          icon: getNotificationIcon(newNotification.type)
        });
      });

      return () => {
        if (channel) {
          channel.unsubscribe();
        }
      };
    }
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${textColor} hover:${textColor} p-2`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.2rem] h-5 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 ${bgColor} ${borderColor} border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden`}>
          {/* Header */}
          <div className={`px-4 py-3 border-b ${borderColor} flex justify-between items-center`}>
            <h3 className={`font-semibold ${textColor}`}>Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className={`${mutedTextColor} hover:${textColor} text-xs`}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className={`${mutedTextColor} hover:${textColor}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className={`p-4 text-center ${mutedTextColor}`}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className={`p-4 text-center ${mutedTextColor}`}>
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${hoverBgColor} ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''} group cursor-pointer transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1">
                            <h4 className={`font-medium text-sm ${textColor} ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {(notification.related_bounty_id || notification.related_submission_id) && (
                              <ExternalLink className={`h-3 w-3 ${mutedTextColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className={`${mutedTextColor} hover:${textColor} p-1`}
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className={`${mutedTextColor} hover:text-red-500 p-1`}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className={`text-sm ${mutedTextColor} mt-1`}>
                          {/* Show comment content preview for comment notifications */}
                          {(notification.type === 'comment_reply' || notification.type === 'bounty_comment' || notification.type === 'sponsor_comment') ? (
                            <div className="space-y-1">
                              <p className="line-clamp-1 font-medium text-xs uppercase tracking-wide opacity-75">
                                {notification.type === 'sponsor_comment' ? 'Sponsor Comment' : 'Comment'}
                              </p>
                              <p className="line-clamp-2 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 italic">
                                "{notification.message}"
                              </p>
                            </div>
                          ) : (
                            <p className="line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs ${mutedTextColor}`}>
                            {formatDate(notification.created_at)}
                          </span>
                          <div className="flex items-center gap-2">
                            {(notification.related_bounty_id || notification.related_submission_id) && (
                              <span className={`text-xs ${mutedTextColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                {notification.type === 'comment_reply' || notification.type === 'bounty_comment' || notification.type === 'sponsor_comment' 
                                  ? 'Click to view comment' 
                                  : 'Click to view details'}
                              </span>
                            )}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;