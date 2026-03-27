"use client";

import { Heart, MapPin, Share2, Bookmark, MessageCircle, User } from "lucide-react";
import { SpotPost, SpotCategory, CATEGORY_BG } from "../types";
import { formatTimeAgo } from "../utils/helpers";

interface SpotListViewProps {
  posts: SpotPost[];
  currentUserId?: string;
  onLike: (postId: string) => void;
}

const CATEGORY_GRADIENT: Record<SpotCategory, string> = {
  グルメ: "from-orange-500/20 via-red-500/10 to-amber-500/20",
  自然: "from-green-500/20 via-emerald-500/10 to-teal-500/20",
  観光: "from-blue-500/20 via-indigo-500/10 to-purple-500/20",
  カフェ: "from-yellow-500/20 via-amber-500/10 to-orange-500/20",
  その他: "from-gray-500/20 via-slate-500/10 to-gray-600/20",
};

const CATEGORY_EMOJI: Record<SpotCategory, string> = {
  グルメ: "🍜",
  自然: "🌿",
  観光: "🗺️",
  カフェ: "☕",
  その他: "📍",
};

export default function SpotListView({ posts, currentUserId, onLike }: SpotListViewProps) {
  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const liked = currentUserId ? post.liked_by.includes(currentUserId) : false;
        return (
          <div key={post.id} className="group relative overflow-hidden">
            {/* 背景グラデーション */}
            <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENT[post.category]} opacity-50 rounded-3xl`} />

            {/* メインコンテンツ */}
            <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20">

              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* アバター */}
                  <div className="relative">
                    {post.user_icon_url ? (
                      <img
                        src={post.user_icon_url}
                        alt={post.username}
                        className="w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {post.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                  </div>

                  <div>
                    <div className="font-bold text-lg text-white">@{post.username}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-500 rounded-full" />
                      {formatTimeAgo(post.created_at)}
                    </div>
                  </div>
                </div>

                {/* カテゴリアイコン（右上） */}
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-1">{CATEGORY_EMOJI[post.category]}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${CATEGORY_BG[post.category]}`}>
                    {post.category}
                  </span>
                </div>
              </div>

              {/* 写真 */}
              {post.photo_url && (
                <div className="mb-4 rounded-2xl overflow-hidden">
                  <img
                    src={post.photo_url}
                    alt={post.title}
                    className="w-full h-56 object-cover"
                  />
                </div>
              )}

              {/* タイトル + 住所 */}
              <div className="mb-4">
                <h3 className="font-bold text-xl text-white mb-2">{post.title}</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">{post.address}</span>
                </div>
              </div>

              {/* 説明文 */}
              {post.description && (
                <div className="mb-6">
                  <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-700/30">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-100 leading-relaxed text-lg">{post.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* いいねボタン */}
                  <button
                    onClick={() => onLike(post.id)}
                    disabled={!currentUserId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${
                      liked
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-gray-700/60 text-gray-300 hover:bg-red-500/20 hover:text-red-400 border border-gray-600/50"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                    <span className="font-medium">{post.likes}</span>
                  </button>

                  {/* シェアボタン */}
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/60 text-gray-300 hover:bg-green-500/20 hover:text-green-400 border border-gray-600/50 transition-all duration-200 transform hover:scale-105">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">シェア</span>
                  </button>
                </div>

                {/* ブックマークボタン */}
                <button className="p-2 rounded-xl bg-gray-700/60 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400 border border-gray-600/50 transition-all duration-200">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* 投稿がない場合 */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📍</span>
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">まだ投稿がありません</h3>
          <p className="text-gray-500">最初のスポット投稿をしてみませんか？</p>
        </div>
      )}
    </div>
  );
}
