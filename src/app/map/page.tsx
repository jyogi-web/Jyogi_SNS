"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSpotPosts } from "./hooks/useSpotPosts";
import MapHeader from "./components/MapHeader";
import SpotPostForm from "./components/SpotPostForm";
import SpotMapView from "./components/SpotMapView";
import SpotListView from "./components/SpotListView";
import { ViewMode, NewSpotData } from "./types";
import TutorialModal from "@/components/TutorialModal";

export default function MapPage() {
  const { user } = useAuth();
  const { posts, submitPost, toggleLike } = useSpotPosts();

  const [showPostForm, setShowPostForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const handleLike = (postId: string) => {
    if (user) toggleLike(postId, user.id);
  };

  // 未ログインの場合の表示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233B82F6%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>

        {/* ホームに戻るボタン */}
        <div className="fixed top-4 left-4 z-50">
          <Link
            href="/"
            className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-700/90 text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-gray-600/50 shadow-lg cursor-pointer"
          >
            <span className="font-semibold text-sm sm:text-base">ホームに戻る</span>
          </Link>
        </div>

        {/* メインコンテンツ */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            {/* アイコン */}
            <div className="flex justify-center mb-6">
              <div className="p-4 sm:p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-full border border-green-500/30 backdrop-blur-sm">
                <MapPin size={48} className="sm:w-16 sm:h-16 text-green-400" />
              </div>
            </div>

            {/* タイトル */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">
              会員限定制
            </h1>

            {/* 説明文 */}
            <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 border border-gray-600/30">
              <p className="text-gray-300 text-base sm:text-lg mb-4">
                おすすめスポットは会員様限定の<br />
                特別なサービスです
              </p>
              <p className="text-gray-400 text-sm">
                ログインして、あなたのお気に入りスポットを<br />
                写真付きで投稿・共有しましょう
              </p>
            </div>

            {/* ボタン群 */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/auth/login"
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
              >
                <MapPin size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">ログインして利用開始</span>
              </Link>

              <Link
                href="/auth/signup"
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="text-sm sm:text-base">新規会員登録</span>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">※ 会員登録は無料です</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitPost = async (data: NewSpotData) => {
    const username =
      user.user_metadata?.username ||
      user.user_metadata?.displayName ||
      user.email?.split("@")[0] ||
      "匿名";
    const iconUrl = user.user_metadata?.iconUrl as string | undefined;
    const success = await submitPost(data, user.id, username, iconUrl);
    if (success) setShowPostForm(false);
    return success;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <TutorialModal featureId="map" />
      <MapHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCreatePost={() => setShowPostForm(true)}
      />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {showPostForm && (
          <SpotPostForm
            onClose={() => setShowPostForm(false)}
            onSubmit={handleSubmitPost}
          />
        )}

        {viewMode === "map" ? (
          <SpotMapView
            posts={posts}
            currentUserId={user.id}
            onLike={handleLike}
          />
        ) : (
          <SpotListView
            posts={posts}
            currentUserId={user.id}
            onLike={handleLike}
          />
        )}
      </div>
    </div>
  );
}
