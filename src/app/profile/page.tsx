"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/utils/supabase/client";
import Image from "next/image";

// 型定義
interface FormData {
  setID: string;
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  birthDate: string;
  joinDate: string;
  following: number;
  follower: number;
  iconUrl?: string;
  bannerUrl?: string;

}

// モーダルコンポーネント
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Modal = ({ isOpen, onClose, title, message, type }: ModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // 少し遅延させてアニメーションを開始
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // アニメーション完了後にDOMから削除
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out ${
        isVisible 
          ? 'bg-black/50 opacity-100' 
          : 'bg-black/0 opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700 transition-all duration-300 ease-out transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={`transition-all duration-300 delay-100 ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
            {getIcon()}
          </div>
          <h3 className={`text-lg font-semibold text-white transition-all duration-300 delay-150 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
            {title}
          </h3>
        </div>
        <p className={`text-gray-300 mb-6 transition-all duration-300 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {message}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-full text-white font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 delay-250 ${getButtonColor()} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

function ProfilePageContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    setID: "",
    displayName: "ユーザー",
    username: "user",
    bio: "プログラミングが好きです。Next.jsとReactを勉強中です。",
    location: "東京, 日本",
    website: "https://example.com",
    birthDate: "1990-01-01",
    joinDate: "2024年1月",
    following: 150,
    follower: 1200,
    iconUrl: undefined,
    bannerUrl: undefined,

  });
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // モーダル状態
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // モーダル表示関数
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // 画像URL変換関数をメモ化
  const getPublicIconUrl = useCallback((iconUrl?: string) => {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${filename}`;
    }
    return iconUrl;
  }, []);

  const getPublicBannerUrl = useCallback((bannerUrl?: string) => {
    if (!bannerUrl) return "";
    if (bannerUrl.includes("cloudflarestorage.com")) {
      const filename = bannerUrl.split("/").pop();
      if (!filename) return "";
      return `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${filename}`;
    }
    return bannerUrl;
  }, []);

  // メモ化されたアイコンURL
  const memoizedIconUrl = useMemo(() => 
    getPublicIconUrl(formData.iconUrl), 
    [formData.iconUrl, getPublicIconUrl]
  );

  const memoizedBannerUrl = useMemo(() => 
    getPublicBannerUrl(formData.bannerUrl), 
    [formData.bannerUrl, getPublicBannerUrl]
  );

  // 初期データ取得を最適化
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // 並列でデータを取得
        const [userDataResult, postsResult, followingResult, followerResult] = await Promise.all([
          supabase
            .from("usels")
            .select("*")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("todos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", user.id),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("followed_id", user.id)
        ]);

        const { data: userData, error: userError } = userDataResult;
        const { data: userPosts, error: postsError } = postsResult;
        const { count: followingCount } = followingResult;
        const { count: followerCount } = followerResult;

        if (userError) {
          console.error("Error fetching user data:", userError);
        } else if (userData) {
          console.log('🔍 userData.created_at:', userData.created_at); // デバッグログ
          setFormData({
            setID: userData.setID || userData.username || "user",
            displayName: userData.username || userData.display_name || "ユーザー",
            username: userData.username || "user",
            bio: userData.introduction || "プログラミングが好きです。Next.jsとReactを勉強中です。",
            location: userData.place || "東京, 日本",
            website: userData.site || "https://example.com",
            birthDate: userData.birth_date || "1990-01-01",
            joinDate: userData.created_at || "2024-01-01",
            following: Number(userData.follow) || 0,
            follower: followerCount || 0,
            iconUrl: userData.icon_url,
            bannerUrl: userData.banner_url,

          });
        }

        if (postsError) {
          console.error("投稿取得エラー:", postsError);
        } else {
          setPosts(userPosts ?? []);
        }

        setFollowingCount(followingCount ?? 0);
        setFollowerCount(followerCount ?? 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      showModal("エラー", "ユーザーIDが取得できませんでした", "error");
      return;
    }
    const updateData = {
      setID: formData.setID,
      username: formData.displayName,
      introduction: formData.bio,
      place: formData.location,
      site: formData.website, // 🔧 website → site に変更
      birth_date: formData.birthDate,
      follow: Number(formData.following) || 0,

    };
    const { error } = await supabase
      .from("usels")
      .update(updateData)
      .eq("user_id", userId);
    if (error) {
      showModal("更新エラー", `プロフィールの更新に失敗しました: ${error.message}`, "error");
    } else {
      showModal("更新完了", "プロフィールが更新されました！", "success");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // 画像アップロード処理
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showModal("ファイルエラー", "画像ファイルのみアップロードできます", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showModal("サイズエラー", "画像サイズは5MB以下にしてください", "error");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      showModal("エラー", "ユーザーIDが取得できませんでした", "error");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-icon-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);
      const iconUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("usels")
        .update({ icon_url: iconUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, iconUrl }));
      showModal("アップロード完了", "アイコンが更新されました！", "success");
    } catch (error) {
      showModal("アップロードエラー", "アイコンアップロードに失敗しました", "error");
    } finally {
      setUploading(false);
    }
  };

  // バナー画像アップロード処理
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showModal("ファイルエラー", "画像ファイルのみアップロードできます", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // バナーは10MBまで
      showModal("サイズエラー", "画像サイズは10MB以下にしてください", "error");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      showModal("エラー", "ユーザーIDが取得できませんでした", "error");
      return;
    }

    setBannerUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-banner-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);
      const bannerUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("usels")
        .update({ banner_url: bannerUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, bannerUrl }));
      showModal("アップロード完了", "バナー画像が更新されました！", "success");
    } catch (error) {
      showModal("アップロードエラー", "バナー画像アップロードに失敗しました", "error");
    } finally {
      setBannerUploading(false);
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>プロフィールを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* デスクトップ: 左サイドバー */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 max-w-2xl lg:border-r border-gray-800 overflow-y-auto pb-20 lg:pb-0">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-10">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-lg lg:text-xl font-bold">
                  {formData.displayName}
                </h1>
                <p className="text-sm text-gray-400">
                  {posts.length}件の投稿
                </p>
              </div>
            </div>
          </div>

          {/* プロフィールヘッダー */}
          <div className="relative">
            {/* カバー画像 - バナー画像を表示 */}
            <div className="h-32 sm:h-48 relative">
              {memoizedBannerUrl ? (
                <Image
                  src={memoizedBannerUrl}
                  alt="banner"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  priority // 優先読み込み
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.banner-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }
                  }}
                />
              ) : null}
              
              {/* フォールバック背景 */}
              <div className="banner-fallback h-32 sm:h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative" style={{ display: memoizedBannerUrl ? 'none' : 'block' }} />
              
              {/* バナー編集ボタン */}
              <label className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors cursor-pointer">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={bannerUploading}
                />
              </label>
              
              {/* アップロード中の表示 */}
              {bannerUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">アップロード中...</div>
                </div>
              )}
            </div>

            {/* プロフィール画像と編集ボタン */}
            <div className="px-4 pb-4">
              <div className="flex justify-between items-end -mt-12 sm:-mt-16">
                <div className="relative">
                  <label className="cursor-pointer">
                    {memoizedIconUrl ? (
                      <Image
                        src={memoizedIconUrl}
                        alt="icon"
                        width={128}
                        height={128}
                        className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-black object-cover hover:opacity-80 transition-opacity"
                        referrerPolicy="no-referrer"
                        priority // 優先読み込み
                        sizes="(max-width: 768px) 80px, 128px"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-4 border-black flex items-center justify-center text-white text-2xl sm:text-4xl font-bold hover:opacity-80 transition-opacity">
                        {formData.displayName.charAt(0)}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleIconUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              
              {/* 編集ボタンを別の行に配置 */}
              <div className="flex justify-end mt-4">
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <Save size={16} />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="border border-gray-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2"
                      >
                        <X size={16} />
                        <span>キャンセル</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="border border-gray-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    >
                      <Edit3 size={16} />
                      <span>プロフィールを編集</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* プロフィール情報 */}
          <div className="px-4 pb-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    value={formData.setID}
                    onChange={(e) => handleInputChange("setID", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    場所
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ウェブサイト
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    生年月日
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      handleInputChange("birthDate", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {formData.username
                      ? formData.username
                      : (() => {
                          console.log(
                            "[プロフィール] usernameが空です",
                            formData
                          );
                          return "";
                        })()}
                  </h2>
                  <p className="text-gray-400">@{formData.setID}</p>
                </div>
                <p className="text-white">{formData.bio}</p>

                <div className="space-y-2 text-gray-400 text-sm">
                  {/* 1行目: 場所とサイトURL */}
                  <div className="flex items-center space-x-4">
                    {formData.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={16} />
                        <span>{formData.location}</span>
                      </div>
                    )}
                    {formData.website && (
                      <div className="flex items-center space-x-1">
                        <LinkIcon size={16} />
                        <a
                          href={formData.website}
                          className="text-blue-400 hover:underline"
                        >
                          {formData.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* 2行目: 誕生日と参加日 */}
                  <div className="flex items-center space-x-4">
                    {/* 誕生日 */}
                    {formData.birthDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span>
                          {(() => {
                            const date = new Date(formData.birthDate);
                            if (isNaN(date.getTime())) {
                              return "誕生日未設定";
                            }
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            return `${month}月${day}日生まれ`;
                          })()}
                        </span>
                      </div>
                    )}
                    
                    {/* 参加日 */}
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>
                        {formData.joinDate
                          ? (() => {
                              const date = new Date(formData.joinDate);
                              if (isNaN(date.getTime())) {
                                return "Tikuru24を利用してます。";
                              }
                              const year = date.getFullYear();
                              const month = date.getMonth() + 1;
                              return `${year}年${month}月から Tikuru24を利用してます。`;
                            })()
                          : "Tikuru24を利用してます。"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-6 text-sm">
                  <div className="flex space-x-1">
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-gray-400">フォロー中</span>
                  </div>
                  <div className="flex space-x-1">
                    <span className="font-semibold">{followerCount}</span>
                    <span className="text-gray-400">フォロワー</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-800 overflow-x-auto">
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-white border-b-2 border-blue-500 whitespace-nowrap">
              投稿
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              返信
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              メディア
            </button>
            <button className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-500 hover:text-white whitespace-nowrap">
              いいね
            </button>
          </div>

          {/* 投稿一覧 */}
          <div className="divide-y divide-gray-800">
            {posts.map((post) => {
              // プロフィール情報からアイコンを取得
              const publicIconUrl = getPublicIconUrl(formData.iconUrl);
              
              return (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-900/50 transition-colors"
                  style={{ cursor: 'default' }} // クリック無効化
                  onClick={(e) => e.preventDefault()} // クリックイベントを無効化
                >
                  <div className="flex space-x-3">
                    {/* 投稿アイコン表示 */}
                    {publicIconUrl ? (
                      <div className="relative">
                        <Image
                          src={publicIconUrl}
                          alt="icon"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // 画像読み込みに失敗した場合はデフォルトアイコンを表示
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* フォールバックアイコン */}
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold absolute top-0 left-0" style={{ display: 'none' }}>
                          {(formData.displayName || "U").charAt(0)}
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(formData.displayName || "U").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">
                          {formData.username || formData.displayName}
                        </span>
                        <span className="text-gray-400 text-sm">
                          @{formData.setID}
                        </span>
                        <span className="text-gray-400 text-sm">·</span>
                        <span className="text-gray-400 text-sm">
                          {post.created_at
                            ? new Date(post.created_at).toLocaleString("ja-JP")
                            : ""}
                        </span>
                      </div>
                      <p className="text-white mb-2 break-words">
                        {post.title}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <span style={{ cursor: 'default' }}>返信 {post.replies ?? 0}</span>
                        <span style={{ cursor: 'default' }}>いいね {post.likes ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* デスクトップ: 右サイドバー - 大きなデスクトップのみ */}
        <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto p-4">
          <div className="sticky top-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">おすすめユーザー</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      D
                    </div>
                    <div>
                      <div className="font-semibold">developer</div>
                      <div className="text-sm text-gray-400">@developer</div>
                    </div>
                  </div>
                  <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                    フォロー
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      <MobileNavigation />
      <MobileExtendedNavigation />
      
      {/* モーダル */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
