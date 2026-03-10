import React, { useState, useRef, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Smile,
  X,
  Plus, // 🚀 Plusアイコンを追加
} from "lucide-react";
// 🔧 共通型定義をインポート
import { PostComponentType, ReplyType, StanpType } from "@/types/post";
import Link from "next/link";

type PostProps = {
  post: PostComponentType; // 🔧 専用の型を使用
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  stampList?: string[];
  currentUserId?: string | null; // 🔧 null も許可
  onRefresh?: () => void;
  currentUserName?: string;
};

// 🔧 型安全なヘルパー関数を追加
const isTemporaryReply = (id: string): boolean => {
  return id.startsWith('temp-');
};

export default function Post({
  post,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  stampList = [],
  currentUserId,
  onRefresh,
  currentUserName = "User"
}: PostProps) {
  // ローカルstate
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false); // 🚀 全リプライ表示制御
  const [showReactions, setShowReactions] = useState(false); // 🚀 リアクション表示制御 - デフォルトを false に変更
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 現在のユーザー情報を管理
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    username: string;
    icon_url?: string;
  }>({
    username: currentUserName,
    icon_url: undefined
  });
  
  // 🔧 リプライの楽観的更新用のstate
  const [localReplies, setLocalReplies] = useState<ReplyType[]>(post.replies || []);
  
  // スタンプの楽観的更新用のstate
  const [localStanps, setLocalStanps] = useState<StanpType[]>(post.stamps || []);
  
  const replyInputRef = useRef<HTMLInputElement>(null);

  // 🔧 ユーザー情報を取得する関数
  const fetchCurrentUserInfo = async () => {
    if (!currentUserId) return;
    
    try {
      const { data: userData } = await supabase
        .from("usels")
        .select("username, icon_url")
        .eq("user_id", currentUserId)
        .maybeSingle();
      
      if (userData) {
        setCurrentUserInfo({
          username: userData.username || currentUserName,
          icon_url: userData.icon_url
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // 🔧 コンポーネントマウント時にユーザー情報を取得
  React.useEffect(() => {
    fetchCurrentUserInfo();
  }, [currentUserId]);

  // 🔧 localRepliesを使用してリプライ数を計算
  const repliesCount = localReplies.length;

  // localStanpsを使用してスタンプ集計をメモ化
  const stanpCountMap = useMemo(() => {
    const map: { [url: string]: number } = {};
    localStanps.forEach((s) => {
      map[s.stanp_url] = (map[s.stanp_url] || 0) + 1;
    });
    return map;
  }, [localStanps]);

  // 🔧 リプライデータが変更された時にlocalRepliesを更新
  React.useEffect(() => {
    setLocalReplies(post.replies || []);
  }, [post.replies]);

  // スタンプデータが変更された時にlocalStanpsを更新
  React.useEffect(() => {
    setLocalStanps(post.stamps || []);
  }, [post.stamps]);

  // 🔧 楽観的更新対応のリプライ送信
  // リプライ送信後に入力欄を閉じる
  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    const trimmedText = replyText.trim();
    const tempId = `temp-${Date.now()}`;
    setReplyLoading(true);
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth?.user?.id;
      if (!user_id) {
        alert("ログインが必要です");
        return;
      }

      // 楽観的更新（現在のユーザー情報を使用）
      const optimisticReply: ReplyType = {
        id: tempId,
        post_id: Number(post.id),
        user_id: user_id,
        text: trimmedText,
        created_at: new Date().toISOString(),
        username: currentUserInfo.username,
        user_icon_url: currentUserInfo.icon_url
      };

      setLocalReplies(prev => [...prev, optimisticReply]);
      
      // 🚀 入力欄をリセット（ボタンに戻る）
      setReplyText("");
      setShowReplyInput(false);

      // DB更新
      const insertObj = {
        post_id: Number(post.id),
        user_id: user_id,
        text: trimmedText,
        created_at: new Date().toISOString(),
      };

      const { error, data } = await supabase
        .from("replies")
        .insert(insertObj)
        .select();

      if (error) {
        console.error("replies insert error:", error);
        alert("リプライ送信に失敗しました: " + error.message);
        
        // エラー時は楽観的更新を取り消し
        setLocalReplies(prev => 
          prev.filter(reply => reply.id !== tempId)
        );
        
        // 入力を復元
        setReplyText(trimmedText);
        setShowReplyInput(true);
      } else {
        // 成功時は実際のIDに更新
        if (data && data[0]) {
          setLocalReplies(prev => 
            prev.map(reply => 
              reply.id === tempId 
                ? { ...reply, id: data[0].id }
                : reply
            )
          );
        }
      }
      
    } catch (error) {
      console.error("Error in handleReply:", error);
      
      // エラー時は楽観的更新を取り消し
      setLocalReplies(prev => 
        prev.filter(reply => reply.id !== tempId)
      );
      
      // 入力を復元
      setReplyText(trimmedText);
      setShowReplyInput(true);
      alert("リプライ送信中にエラーが発生しました");
    } finally {
      setReplyLoading(false);
    }
  };

  // 🔧 修正されたスタンプ追加・取り消し
  const handleAddStanp = async (stanp_url: string) => {
    // 🔧 null チェックを追加
    if (!currentUserId) {
      alert("ログインが必要です");
      return;
    }

    setLoading(true);
    
    try {
    // 既に自分が押していれば「取り消し」
      const myStanp = localStanps.find(
        (s) => s.user_id === currentUserId && s.stanp_url === stanp_url
      );

      // 🚀 楽観的更新: UIを即座に更新
      if (myStanp) {
        // ローカル状態から削除
        setLocalStanps(prev => 
          prev.filter(s => !(s.user_id === currentUserId && s.stanp_url === stanp_url))
        );
      } else {
        // ローカル状態に追加
        setLocalStanps(prev => [
          ...prev,
          { 
            id: `temp-${Date.now()}`, 
            post_id: Number(post.id), // 🔧 string を number に変換
            user_id: currentUserId, 
            stanp_url 
          }
        ]);
      }

      // バックグラウンドでDB更新
    if (myStanp) {
        const { error } = await supabase
        .from("stamp")
        .delete()
        .eq("post_id", post.id)
          .eq("user_id", currentUserId)
        .eq("stanp_url", stanp_url);
        
        if (error) {
          // エラー時は元に戻す
          setLocalStanps(post.stamps || []);
          alert("スタンプ削除に失敗しました: " + error.message);
        }
      } else {
    const { error } = await supabase.from("stamp").insert({
      post_id: post.id,
          user_id: currentUserId,
      stanp_url,
    });
        
        if (error) {
          // エラー時は元に戻す
          setLocalStanps(post.stamps || []);
      alert("スタンプ追加に失敗しました: " + error.message);
    }
      }
      
    } catch (error) {
      console.error("Error in handleAddStanp:", error);
      // エラー時は元に戻す
      setLocalStanps(post.stamps || []);
    } finally {
    setLoading(false);
    }
  };

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // 画像URLを生成
  const getImageUrl = (image_url?: string) => {
    if (!image_url) return "";
    if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
      return image_url;
    }
    const trimmed = image_url.trim();
    return `${R2_PUBLIC_URL}${trimmed}`;
  };

  // R2画像URL変換関数（ユーザーアイコン用）
  const getPublicIconUrl = (iconUrl?: string) => {
    if (!iconUrl) return "";
    
    // 既に完全なURLの場合はそのまま返す
    if (iconUrl.startsWith("http://") || iconUrl.startsWith("https://")) {
      return iconUrl;
    }
    
    // Cloudflare R2の場合の変換
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    
    // 相対パスの場合
    const trimmed = iconUrl.trim();
    return `${R2_PUBLIC_URL}${trimmed}`;
  };

  // 🚀 表示するリプライ数の制御
  const INITIAL_REPLY_COUNT = 3; // 最初に表示するリプライ数
  const displayedReplies = showAllReplies 
    ? localReplies 
    : localReplies.slice(0, INITIAL_REPLY_COUNT);
  const hiddenRepliesCount = Math.max(0, localReplies.length - INITIAL_REPLY_COUNT);

  // リアクション数を計算
  const totalReactions = Object.values(stanpCountMap).reduce((sum, count) => sum + count, 0);
  const visibleReactions = stampList.filter((url) => (stanpCountMap[url] || 0) > 0);

  // リプライ入力欄のアイコン表示部分を修正
  const renderUserIcon = (username: string, icon_url?: string, size: string = "w-7 h-7") => {
    if (icon_url) {
      return (
        <>
          <img
            src={getPublicIconUrl(icon_url)}
            alt="icon"
            className={`${size} rounded-full object-cover flex-shrink-0`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }
            }}
          />
          <div className={`${size} bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 fallback-avatar hidden`}>
            {username?.charAt(0) ?? "U"}
          </div>
        </>
      );
    }
    
    return (
      <div className={`${size} bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {username?.charAt(0) ?? "U"}
      </div>
    );
  };

  return (
    <div className="p-4 hover:bg-gray-950/50 transition-colors border-b border-gray-800/50">
      <div className="flex space-x-3">
        {/* アバター */}
        {post.user_icon_url ? (
          <Link href={`/profile/${post.user_id}`}>
            <img
              src={getPublicIconUrl(post.user_icon_url)}
              alt="icon"
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 fallback-avatar" style={{ display: 'none' }}>
              {post.displayName?.charAt(0) ?? post.username?.charAt(0) ?? "?"}
            </div>
          </Link>
        ) : (
          <Link href={`/profile/${post.user_id}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80">
              {post.displayName?.charAt(0) ?? post.username?.charAt(0) ?? "?"}
            </div>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {post.username}
            </span>
            <span className="text-gray-500 text-sm">@{post.setID}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {new Date(post.created_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button className="ml-auto text-gray-500 hover:text-white transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* 投稿内容 */}
          <div className="text-white mb-3 whitespace-pre-wrap leading-relaxed">
            <span
              dangerouslySetInnerHTML={{
                __html: (post.title ?? "").replace(
                  /#([\wぁ-んァ-ン一-龠]+)/g,
                  '<span style="color:#3b82f6">#$1</span>'
                ),
              }}
            />
          </div>

          {/* 画像表示 */}
          {post.image_url && getImageUrl(post.image_url) !== "" && (
            <div className="mb-3">
              <img
                src={getImageUrl(post.image_url)}
                alt="投稿画像"
                className="max-w-xs rounded-lg"
                style={{ maxHeight: 300 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;border:2px dashed #f87171;background:#222;color:#f87171;">画像が見つかりません</div>';
                  }
                }}
              />
            </div>
          )}

          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm hover:bg-blue-500/30 cursor-pointer transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-between max-w-md">
            {/* リプライボタン */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                showReplies ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
              }`}
              onClick={() => {
                if (localReplies.length > 0) {
                  setShowReplies(!showReplies);
                  // リプライを閉じる時は全表示もリセット
                  if (showReplies) {
                    setShowAllReplies(false);
                  }
                } else {
                  setShowReplyInput(!showReplyInput);
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }
              }}
            >
              <div className={`p-2 rounded-full transition-colors ${
                showReplies ? "bg-blue-500/10" : "group-hover:bg-blue-500/10"
              }`}>
                <MessageCircle size={20} />
              </div>
              <span className="text-sm font-medium">
                {localReplies.length > 0 ? localReplies.length : ""}
              </span>
            </button>

            {/* いいねボタン */}
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? "text-red-400" : "text-gray-500 hover:text-red-400"
              }`}
            >
              <div className={`p-2 rounded-full transition-colors ${
                liked ? "bg-red-500/10" : "group-hover:bg-red-500/10"
              }`}>
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </div>
              <span className="text-sm font-medium">{post.likes > 0 ? post.likes : ""}</span>
            </button>

            {/* 🚀 リアクションボタン（表示/非表示切り替え） */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                showReactions && totalReactions > 0 ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"
              }`}
              onClick={() => {
                if (totalReactions > 0) {
                  setShowReactions(!showReactions);
                } else {
                  setShowStampPicker(!showStampPicker);
                }
              }}
            >
              <div className={`p-2 rounded-full transition-colors ${
                showReactions && totalReactions > 0 ? "bg-yellow-500/10" : "group-hover:bg-yellow-500/10"
              }`}>
                <Smile size={20} />
              </div>
              <span className="text-sm font-medium">
                {totalReactions > 0 ? totalReactions : ""}
              </span>
            </button>

            {/* ブックマークボタン */}
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 transition-colors group ${
                bookmarked
                  ? "text-blue-400"
                  : "text-gray-500 hover:text-blue-400"
              }`}
            >
              <div className={`p-2 rounded-full transition-colors ${
                bookmarked ? "bg-blue-500/10" : "group-hover:bg-blue-500/10"
              }`}>
                <Bookmark
                  size={20}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </div>
            </button>

            {/* その他ボタン */}
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-300 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-gray-500/10 transition-colors">
                <Share size={20} />
              </div>
            </button>
          </div>

          {/* 🚀 改善されたインタラクションエリア */}
          <div className="mt-3">
            {/* 🚀 リプライがない場合の入力欄表示 */}
            {localReplies.length === 0 && showReplyInput && (
              <div className="bg-gray-900/30 border border-gray-700/30 rounded-xl p-4 mb-3">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageCircle size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-300 font-medium">リプライを追加</span>
                </div>
                
                <form
                  className="flex items-center gap-3 bg-gray-800/40 border border-blue-400/50 rounded-lg p-3 shadow-lg shadow-blue-500/10"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReply();
                  }}
                >
                  {renderUserIcon(currentUserInfo.username, currentUserInfo.icon_url)}
                  
                  <input
                    ref={replyInputRef}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
                    placeholder="リプライを入力..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replyLoading}
                    maxLength={200}
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyInput(false);
                        setReplyText("");
                      }}
                      className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                      disabled={replyLoading}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold disabled:bg-gray-600 transition-all duration-300 flex-shrink-0"
                      disabled={replyLoading || !replyText.trim()}
                    >
                      {replyLoading ? "送信中" : "送信"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 🚀 折りたたみ可能なリプライセクション */}
            {localReplies.length > 0 && showReplies && (
              <div className="bg-gray-900/30 border border-gray-700/30 rounded-xl p-4 mb-3">
                {/* リプライヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle size={16} className="text-blue-400" />
                    <span className="text-sm text-gray-300 font-medium">
                      リプライ ({localReplies.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowReplies(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* スクロール可能なリプライリスト */}
                <div className="max-h-60 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {displayedReplies.map((reply) => {
                    const isTempReply = typeof reply.id === 'string' && reply.id.startsWith('temp-');
                    
                    return (
                      <div key={reply.id} className="flex items-start gap-3">
                        {renderUserIcon(reply.username || "User", reply.user_icon_url)}
                        
                        <div className={`bg-gray-800/50 rounded-lg px-3 py-2 text-sm text-white flex-1 ${
                          isTempReply ? 'opacity-75' : ''
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-xs text-blue-300">
                              {reply.username ?? "User"}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(reply.created_at).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isTempReply && (
                              <span className="text-yellow-400 text-xs">送信中...</span>
                            )}
                          </div>
                          <div className="text-gray-200 text-sm leading-relaxed">
                            {reply.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* +○件ボタン */}
                {hiddenRepliesCount > 0 && !showAllReplies && (
                  <button
                    onClick={() => setShowAllReplies(true)}
                    className="mt-3 w-full text-center py-2 text-blue-400 hover:text-blue-300 text-sm transition-colors hover:bg-blue-500/5 rounded-lg border border-blue-400/20"
                  >
                    +{hiddenRepliesCount}件のリプライを表示
                  </button>
                )}

                {/* 折りたたむボタン */}
                {showAllReplies && hiddenRepliesCount > 0 && (
                  <button
                    onClick={() => setShowAllReplies(false)}
                    className="mt-3 w-full text-center py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors hover:bg-gray-500/5 rounded-lg border border-gray-600/20"
                  >
                    リプライを折りたたむ
                  </button>
                )}

                {/* 🚀 動的なリプライ追加ボタン/入力欄 */}
                <div className="mt-4 pt-3 border-t border-gray-700/30">
                  {!showReplyInput ? (
                    // 🚀 リプライ追加ボタン
                    <button
                      onClick={() => {
                        setShowReplyInput(true);
                        setTimeout(() => replyInputRef.current?.focus(), 100);
                      }}
                      className="flex items-center justify-center space-x-2 w-full py-3 text-blue-400 hover:text-blue-300 text-sm transition-all duration-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/10 group transform hover:scale-105"
                    >
                      <MessageCircle size={16} className="group-hover:rotate-12 transition-transform" />
                      <span>リプライを追加</span>
                    </button>
                  ) : (
                    // 🚀 リプライ入力欄（ボタンが変化）
                    <form
                      className="flex items-center gap-3 bg-gray-800/40 border border-blue-400/50 rounded-lg p-3 shadow-lg shadow-blue-500/10"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleReply();
                      }}
                    >
                      {renderUserIcon(currentUserInfo.username, currentUserInfo.icon_url)}
                      
                      <input
                        ref={replyInputRef}
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
                        placeholder="リプライを入力..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={replyLoading}
                        maxLength={200}
                      />
                      <div className="flex items-center space-x-2">
                        {/* キャンセルボタン */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowReplyInput(false);
                            setReplyText("");
                          }}
                          className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                          disabled={replyLoading}
                        >
                          キャンセル
                        </button>
                        {/* 送信ボタン */}
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold disabled:bg-gray-600 transition-all duration-300 flex-shrink-0"
                          disabled={replyLoading || !replyText.trim()}
                        >
                          {replyLoading ? "送信中" : "送信"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* 🚀 リアクションセクション（表示/非表示対応） - 条件を調整 */}
            {showReactions && (
              <div className="mt-3">
                <div className="bg-gray-900/30 border border-gray-700/30 rounded-xl p-4">
                  {/* リアクションヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Smile size={16} className="text-yellow-400" />
                      <span className="text-sm text-gray-300 font-medium">
                        リアクション ({totalReactions})
                      </span>
                    </div>
                    <button
                      onClick={() => setShowReactions(false)}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* リアクション一覧と追加ボタン */}
                  <div className="flex flex-wrap gap-3">
                    {/* 既存のリアクション */}
                    {visibleReactions.map((url) => {
                      const count = stanpCountMap[url] || 0;
                      const isMine =
                        !!currentUserId &&
                        localStanps.some(
                          (s) => s.user_id === currentUserId && s.stanp_url === url
                        );
                      
                      return (
                        <button
                          key={url}
                          className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-base border-2 ${
                            isMine
                              ? "bg-blue-500/20 border-blue-400/60 text-blue-300 shadow-lg shadow-blue-500/20"
                              : "bg-gray-800/50 border-gray-600/40 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/60"
                          } ${loading ? 'opacity-50' : 'hover:scale-110 hover:shadow-lg'}`}
                          onClick={() => handleAddStanp(url)}
                          disabled={loading}
                        >
                          <img
                            src={getImageUrl(url)}
                            alt="stamp"
                            className="w-10 h-10 object-contain"
                          />
                          <span className="font-bold text-base min-w-[20px] text-center">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* 🚀 リアクション追加ボタン（常に表示） */}
                    <button
                      onClick={() => setShowStampPicker(!showStampPicker)}
                      className="flex items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-gray-600/60 text-gray-400 hover:border-gray-500/80 hover:text-gray-300 hover:bg-gray-800/30 transition-all duration-300 group"
                      title="リアクションを追加"
                    >
                      <Plus size={24} className="group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 リアクションがない場合の追加ボタンも削除 */}

            {/* 🚀 改善されたスタンプピッカー（モーダル風） */}
            {showStampPicker && (
              <>
                {/* 背景オーバーレイ */}
                <div 
                  className="fixed inset-0 bg-black/50 z-30"
                  onClick={() => setShowStampPicker(false)}
                />
                
                {/* ピッカー本体 */}
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-6 min-w-[350px] max-w-[90vw] max-h-[80vh] overflow-y-auto z-40">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Smile size={20} className="text-yellow-400" />
                      <span className="text-white font-bold text-lg">リアクションを選択</span>
                    </div>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-all"
                      onClick={() => setShowStampPicker(false)}
                    >
                      ×
                    </button>
                  </div>

                  {/* スタンプグリッド */}
                  <div className="grid grid-cols-5 gap-4 mb-6"> {/* gap-2 → gap-4 */}
                    {stampList.map((url) => {
                      const count = stanpCountMap[url] || 0;
                      const isMine = !!currentUserId && localStanps.some(
                        (s) => s.user_id === currentUserId && s.stanp_url === url
                      );
                      
                      return (
                        <button
                          key={url}
                          className={`relative w-16 h-16 flex items-center justify-center rounded-xl transition-all duration-300 ${
                            isMine
                              ? "bg-blue-500/20 border-2 border-blue-400/50 shadow-lg"
                              : "bg-gray-800/40 border border-gray-600/30 hover:bg-gray-700/40"
                          } ${loading ? 'opacity-50' : 'hover:scale-110'}`}
                          onClick={() => handleAddStanp(url)}
                          disabled={loading}
                        >
                          <img
                            src={getImageUrl(url)}
                            alt="stamp"
                            className="w-12 h-12 object-contain" // 🚀 ピッカー内でも大きく（w-8 h-8 → w-12 h-12）
                          />
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold"> {/* 🚀 カウント表示も大きく */}
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 使用中スタンプ（コンパクト表示） */}
                  {Object.keys(stanpCountMap).filter(url => stanpCountMap[url] > 0).length > 0 && (
                    <div className="border-t border-gray-700/50 pt-4">
                      <div className="text-sm text-gray-400 mb-3">この投稿のリアクション</div>
                      <div className="flex flex-wrap gap-2">
                        {stampList
                          .filter((url) => (stanpCountMap[url] || 0) > 0)
                          .map((url) => (
                            <div
                              key={url}
                              className="flex items-center space-x-1.5 bg-gray-800/60 rounded-full px-3 py-1.5"
                            >
                              <img
                                src={getImageUrl(url)}
                                alt="used-stamp"
                                className="w-4 h-4 object-contain"
                              />
                              <span className="text-xs text-white font-medium">
                                {stanpCountMap[url]}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


