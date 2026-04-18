"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Image, Smile, Calendar, MapPin, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PostFormProps {
  onPostAdded?: () => void;
  onOptimisticPost?: (newPost: any) => void;
  onOptimisticUpdate?: (tempId: string, realPost: any) => void; // 🚀 楽観的更新の置き換え用
  r2PublicUrl?: string;
}

export default function PostForm({ 
  onPostAdded, 
  onOptimisticPost, 
  onOptimisticUpdate, 
  r2PublicUrl 
}: PostFormProps) {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  // ユーザープロフィール情報
  const [userProfile, setUserProfile] = useState<{
    icon_url?: string;
    username?: string;
    introduction?: string;
  } | null>(null);

  // R2のパブリック開発URL
  const R2_PUBLIC_URL = r2PublicUrl || "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

  // R2画像URL変換関数
  function getPublicIconUrl(iconUrl?: string) {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    return iconUrl;
  }

  useEffect(() => {
    // ログインユーザーのUID取得とプロフィール情報取得
    const fetchUserProfile = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('PostForm: 認証エラー:', authError);
          return;
        }

        const uid = authData?.user?.id ?? null;
        setUserId(uid);
        
        if (!uid) return;

        // ユーザーデータを取得
        const { data: userRow, error: userError } = await supabase
          .from("usels")
          .select("icon_url, username, introduction")
          .eq("user_id", uid)
          .maybeSingle();

        if (userError) {
          console.error('PostForm: ユーザーデータ取得エラー:', userError);
          return;
        }

        if (userRow) {
          setUserProfile({
            icon_url: userRow.icon_url,
            username: userRow.username,
            introduction: userRow.introduction,
          });
        } else {
          setUserProfile({
            icon_url: undefined,
            username: user?.user_metadata?.username || user?.email?.split('@')[0],
            introduction: undefined,
          });
        }
      } catch (error) {
        console.error('PostForm: プロフィール情報取得で予期しないエラー:', error);
      }
    };

    fetchUserProfile();
  }, [user]);


  const handleImageUpload = async (file: File): Promise<string | null> => {
    const uniqueFileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.jpg`;
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 400;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas
            .toDataURL("image/jpeg", 0.7)
            .split(",")[1];
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: compressedBase64,
              fileName: uniqueFileName,
            }),
          });
          resolve(r2PublicUrl + uniqueFileName);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // 🚀 送信状態管理

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // 🔧 重複送信防止
    
    if (!userId) return;

    // 🚀 一時的IDを事前に生成（スコープを広げる）
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      setIsSubmitting(true);

      if (!text.trim()) return;

      // 🚀 現在の値を保存（フォームリセット前に）
      const currentText = text;
      const currentTags = [...tags];
      const currentImageFile = imageFile;

      // 🚀 楽観的更新：UIを即座に更新
      const tempPost = {
        id: tempId,
        user_id: userId,
        username: userProfile?.username || "User",
        title: currentText,
        created_at: new Date().toISOString(),
        tags: currentTags,
        replies: 0, // 数値として設定
        likes: 0,
        bookmarked: false,
        image_url: currentImageFile ? "uploading..." : null,
        user_icon_url: userProfile?.icon_url,
        displayName: userProfile?.username,
        setID: userProfile?.username || "user",
        liked: false,
        // 🚀 楽観的更新用の追加データ
        replies_data: [],
        stamps_data: [],
        isOptimistic: true // 楽観的更新フラグ
      };

      // 🚀 UIを即座に更新
      if (onOptimisticPost) {
        onOptimisticPost(tempPost);
      }

      // 🚀 フォームを即座にリセット
      setText("");
      setTags([]);
      setImageFile(null);

      // 🔧 バックグラウンドで実際の投稿処理（ローディングなし）
      let imageUrl = null;
      if (currentImageFile) {
        try {
          imageUrl = await handleImageUpload(currentImageFile);
        } catch (error) {
          console.error("画像アップロードエラー:", error);
          // 画像アップロード失敗時は楽観的更新を修正
          if (onOptimisticUpdate) {
            onOptimisticUpdate(tempId, { ...tempPost, image_url: null });
          }
        }
      }

      const newPost = {
        title: currentText,
        tags: currentTags,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        user_id: userId,
      };

      const { data: insertedData, error } = await supabase
        .from("todos")
        .insert([newPost])
        .select() // 🚀 挿入されたデータを取得
        .single();
      
      if (error) {
        console.error("投稿エラー:", error);
        // 🚨 エラーの場合は楽観的更新を削除
        if (onOptimisticUpdate) {
          onOptimisticUpdate(tempId, null); // null = 削除
        }
        return;
      }

      // 🎉 投稿成功 - 楽観的更新を実際のデータで置き換え
      if (onOptimisticUpdate && insertedData) {
        const realPost = {
          ...tempPost,
          id: insertedData.id.toString(), // 実際のID
          image_url: imageUrl,
          isOptimistic: false
        };
        onOptimisticUpdate(tempId, realPost);
      }

      // 🚀 全体再取得は行わない！

    } catch (error) {
      console.error("投稿処理で予期しないエラー:", error);
      // �� エラー時は楽観的更新を削除（tempIdがスコープ内で利用可能）
      if (onOptimisticUpdate) {
        onOptimisticUpdate(tempId, null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractTags = (text: string) => {
    const tagMatches = text.match(/#([^\s#]+)/g);
    return tagMatches ? tagMatches.map((tag) => tag.substring(1)) : [];
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setTags(extractTags(value));
  };

  // ユーザーアイコンのレンダリング関数
  const renderUserIcon = () => {
    if (userProfile?.icon_url) {
      const iconUrl = getPublicIconUrl(userProfile.icon_url);
      
      return (
        <div className="relative">
          <img
            src={iconUrl}
            alt={userProfile.username || "ユーザー"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // 画像読み込みに失敗した場合はデフォルトアイコンを表示
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* フォールバックアイコン */}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold absolute top-0 left-0" style={{ display: 'none' }}>
            {userProfile?.username?.charAt(0)?.toUpperCase() || 
             user?.email?.charAt(0)?.toUpperCase() || 
             'U'}
          </div>
        </div>
      );
    }

    // アイコンがない場合のデフォルト表示
    return (
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold">
        {userProfile?.username?.charAt(0)?.toUpperCase() || 
         user?.email?.charAt(0)?.toUpperCase() || 
         'U'}
      </div>
    );
  };

  return (
    <>
      <div className="border-b border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            {/* ユーザーアイコン */}
            {renderUserIcon()}

            <div className="flex-1">
              <div className="relative w-full min-h-[120px]">
                <div
                  className="pointer-events-none w-full text-xl min-h-[120px] absolute top-0 left-0 z-0 px-3 py-2"
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html: text.replace(
                      /#([\wぁ-んァ-ン一-龠]+)/g,
                      '<span style="color:#3b82f6">#$1</span>'
                    ),
                  }}
                />
                <textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={
                    user
                      ? "今何してる？"
                      : "投稿するにはログインorサインアップしてください"
                  }
                  className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-xl min-h-[120px] relative z-10 px-3 py-2"
                  rows={3}
                  maxLength={280}
                  style={{ background: "transparent" }}
                />
              </div>

              {/* タグプレビュー */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                {/* モバイル: アイコンを小さく、レスポンシブ対応 */}
                <div className="flex items-center space-x-2 lg:space-x-4 text-blue-400">
                  <button
                    type="button"
                    className="hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="画像を追加"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Image size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                  />
                  {/* モバイルでは一部のアイコンを非表示 */}
                  <button
                    type="button"
                    className="hidden sm:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="投票を追加"
                  >
                    <BarChart3 size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <button
                    type="button"
                    className="hidden sm:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="絵文字を追加"
                  >
                    <Smile size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <button
                    type="button"
                    className="hidden lg:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="スケジュールを追加"
                  >
                    <Calendar size={20} />
                  </button>
                  <button
                    type="button"
                    className="hidden lg:block hover:bg-blue-500/10 p-2 rounded-full transition-colors"
                    aria-label="場所を追加"
                  >
                    <MapPin size={20} />
                  </button>
                </div>

                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="text-xs lg:text-sm text-gray-500">{text.length}/280</div>
                  <button
                    type="submit"
                    disabled={!text.trim() || isSubmitting} // 🔧 送信中は無効化
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 lg:px-6 py-2 rounded-full font-semibold transition-colors text-sm lg:text-base flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>投稿中...</span>
                      </>
                    ) : (
                      <span>投稿</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

    </>
  );
}
