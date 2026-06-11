import { Notification as NotificationType } from '@/types';
import { Heart, UserPlus, AtSign, MessageCircle, Bookmark, Bell, ArrowRight } from 'lucide-react';

// 拡張された通知タイプ
interface EnhancedNotification extends NotificationType {
  user_info?: {
    username: string;
    icon_url?: string;
    setID: string;
  } | null; // 🔧 | null を追加
}

interface NotificationProps {
  notification: EnhancedNotification;
  onMarkAsRead: (id: string) => void;
}

// R2のパブリックURL（環境変数から取得、フォールバックとして新しいデフォルトを使用）
const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-8a72d0656f234f4f8b057562db9d565a.r2.dev").replace(/\/$/, "") + "/";

// 画像URL変換関数
const getPublicIconUrl = (iconUrl?: string) => {
  if (!iconUrl) return "";
  if (iconUrl.includes("cloudflarestorage.com")) {
    const filename = iconUrl.split("/").pop();
    if (!filename) return "";
    return `${R2_PUBLIC_URL}${filename}`;
  }
  return iconUrl;
};

export default function Notification({ notification, onMarkAsRead }: NotificationProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'たった今';
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-400" />;
      case 'follow':
        return <UserPlus size={20} className="text-blue-400" />;
      case 'mention':
        return <AtSign size={20} className="text-green-400" />;
      case 'reply':
        return <MessageCircle size={20} className="text-purple-400" />;
      case 'bookmark':
        return <Bookmark size={20} className="text-yellow-400" />;
      case 'system':
        return <Bell size={20} className="text-gray-400" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  const getAvatarLetter = (username: string) => {
    if (!username || username.length === 0) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // ユーザー情報を取得（user_infoがあれば使用、なければフォールバック）
  const displayName = notification.user_info?.username || notification.displayName || 'ユーザー';
  const username = notification.user_info?.setID || notification.username || 'user';
  const iconUrl = notification.user_info?.icon_url;

  // 🔧 動的にメッセージを生成
  const generateMessage = () => {
    if (notification.type === 'like' && notification.user_info?.username) {
      return `${notification.user_info.username}さんがあなたの投稿にいいねしました`;
    }
    // 元のメッセージをフォールバックとして使用
    return notification.message;
  };

  return (
    <div 
      className={`p-4 hover:bg-gray-900/50 transition-colors border-b border-gray-800 cursor-pointer ${
        !notification.read ? 'bg-blue-500/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex space-x-3">
        {/* 通知アイコン */}
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* 通知内容 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                {notification.type !== 'system' && (
                  <>
                    {/* ユーザーアイコン */}
                    {iconUrl ? (
                      <img
                        src={getPublicIconUrl(iconUrl)}
                        alt="ユーザーアイコン"
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold ${iconUrl ? 'hidden' : ''}`}
                    >
                      {getAvatarLetter(displayName)}
                    </div>
                  </>
                )}
                <span className="font-semibold text-white text-sm">
                  {displayName}
                </span>
                {notification.type !== 'system' && (
                  <span className="text-gray-500 text-sm">@{username}</span>
                )}
              </div>
              
              <h3 className="text-white font-medium mb-1">{notification.title}</h3>
              {/* 🔧 動的に生成されたメッセージを使用 */}
              <p className="text-gray-300 text-sm mb-2">{generateMessage()}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">
                  {formatDate(notification.created_at)}
                </span>
                {notification.action_url && (
                  <ArrowRight size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* 未読マーク */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
