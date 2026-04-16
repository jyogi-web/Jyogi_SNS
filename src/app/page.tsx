"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PostForm from "@/components/PostForm";
import Post from "@/components/Post";
import MobileNavigation from "@/components/MobileNavigation";
import MobileExtendedNavigation from "@/components/MobileExtendedNavigation";
import { supabase } from "@/utils/supabase/client";
import PWAInstaller from "@/components/PWAInstaller";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { useAuth } from "@/contexts/AuthContext";
// 🔧 共通型定義をインポート
import { PostType, ReplyType, StanpType } from "@/types/post";
import TutorialModal from "@/components/TutorialModal";
import {
  getHomeFeedCache,
  setHomeFeedCache,
  HOME_FEED_CACHE_TTL_MS,
  HomeFeedUserMapType,
} from "@/lib/homeFeedCache";

// 砂時計アイコン（Lucide ReactのSVGをインラインで利用）


// 🗑️ ローカルの型定義を削除（インポートした型を使用）
// type ReplyType = { ... } ← 削除
// type StanpType = { ... } ← 削除  
// type PostType = { ... } ← 削除

// R2のパブリック開発URL
const R2_PUBLIC_URL = "https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/";

type UserMapType = HomeFeedUserMapType;

type FetchTodosOptions = {
  silent?: boolean;
};

export default function Home() {
  // state定義
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostType[]>(() => getHomeFeedCache()?.posts ?? []);
  const [loading, setLoading] = useState(() => !getHomeFeedCache());
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [stampList, setStampList] = useState<string[]>(() => getHomeFeedCache()?.stampList ?? []);
  const [userMap, setUserMap] = useState<UserMapType>(() => getHomeFeedCache()?.userMap ?? {});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 楽観的更新用のstate
  const [optimisticPosts, setOptimisticPosts] = useState<PostType[]>([]);

  // タブのstate
  const [activeTab, setActiveTab] = useState<"newest" | "output_ch">("newest");

  // 🚀 fetchTodos関数への参照を保持
  const fetchTodosRef = useRef<((options?: FetchTodosOptions) => Promise<void>) | null>(null);

  // 楽観的更新ハンドラー
  const handleOptimisticPost = useCallback((newPost: PostType) => {
    setOptimisticPosts(prev => [newPost, ...prev]);
  }, []);

  // 🚀 楽観的更新の置き換え/削除ハンドラー
  const handleOptimisticUpdate = useCallback((tempId: string, realPost: any) => {
    setOptimisticPosts(prev => {
      if (realPost === null) {
        // 削除（エラー時）
        return prev.filter(post => post.id !== tempId);
      } else {
        // 置き換え（成功時）
        return prev.map(post => 
          post.id === tempId ? realPost : post
        );
      }
    });

    // 🔧 実際のデータも更新（重複回避のため）
    if (realPost && realPost.id !== tempId) {
      setPosts(prevPosts => {
        // 同じIDの投稿が既に存在する場合は追加しない
        const exists = prevPosts.some(post => post.id === realPost.id);
        if (!exists) {
          return [realPost, ...prevPosts];
        }
        return prevPosts;
      });
    }
  }, []);

  // 投稿追加後の処理（楽観的更新をクリア）
  const handlePostAdded = useCallback(() => {
    // 🚀 楽観的更新をクリアするのみ（再取得は行わない）
    setOptimisticPosts([]);
  }, []);

  // 表示用の投稿一覧（楽観的更新 + 実際のデータ）
  const displayPosts = useMemo(() => {
    // 楽観的更新の投稿を先頭に追加
    const combined = [...optimisticPosts, ...posts];
    // 重複を除去（実際のデータが取得されたら楽観的更新を除去）
    const uniquePosts = combined.filter((post, index, arr) => 
      index === arr.findIndex(p => 
        p.id === post.id || (p.title === post.title && p.user_id === post.user_id)
      )
    );
    return uniquePosts;
  }, [optimisticPosts, posts]);

  // タブでフィルタリングされた投稿一覧
  const filteredPosts = useMemo(() => {
    if (activeTab === "output_ch") {
      return displayPosts.filter((post) => (post.tags || []).includes("成果物"));
    }
    return displayPosts;
  }, [displayPosts, activeTab]);

  // R2画像URL変換関数をメモ化
  const getPublicIconUrl = useCallback((iconUrl?: string) => {
    if (!iconUrl) return "";
    if (iconUrl.includes("cloudflarestorage.com")) {
      const filename = iconUrl.split("/").pop();
      if (!filename) return "";
      return `${R2_PUBLIC_URL}${filename}`;
    }
    return iconUrl;
  }, []);

  // 🚀 統一された最適化済み投稿取得関数
  const fetchTodos = useCallback(async (options: FetchTodosOptions = {}) => {
    const { silent = false } = options;

    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      // 1. 投稿データを取得
      const { data: todosData, error: todosError } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (todosError) {
        console.error("Error fetching todos:", todosError);
        if (!silent) {
          setError("投稿の読み込みに失敗しました");
        }
        return;
      }

      let userId: string | null = null;

      // 2. 現在のユーザーIDを取得
      try {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id ?? null;
      } catch (error) {
        console.warn("Error getting user session:", error);
      }

      if (!todosData || todosData.length === 0) {
        setPosts([]);
        setUserMap({});
        setStampList([]);
        if (userId) {
          setHomeFeedCache({
            userId,
            posts: [],
            stampList: [],
            userMap: {},
            fetchedAt: Date.now(),
          });
        }
        return;
      }

      const validTodos = todosData;

      // 3. ユーザーIDを抽出
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const userIds = Array.from(
        new Set(
          validTodos // todosDataの代わりにvalidTodosを使用
            .map((todo: any) => todo.user_id)
            .filter((id: string | null | undefined) =>
              !!id && id !== "null" && id !== "undefined" && uuidRegex.test(id)
            )
        )
      );

      // 4. 投稿IDを抽出
      const postIds = validTodos.map(todo => Number(todo.id)); // validTodosを使用
      
      // 🚀 5. 全データを並列で一括取得
      const [
        usersResult, 
        likesResult, 
        bookmarksResult, 
        repliesResult, 
        stampsResult,
        stampListResult
      ] = await Promise.all([
        // ユーザー情報
        userIds.length > 0 
          ? supabase
              .from("usels")
              .select("user_id, icon_url, username, setID")
              .in("user_id", userIds)
          : Promise.resolve({ data: [], error: null }),
        
        // いいね情報（ログイン済みの場合のみ）
        userId && postIds.length > 0
          ? supabase
              .from("likes")
              .select("post_id, on")
              .eq("user_id", userId)
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // ブックマーク情報（ログイン済みの場合のみ）
        userId && postIds.length > 0
          ? supabase
              .from("bookmarks")
              .select("post_id, on")
              .eq("user_id", userId)
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 リプライを一括取得
        postIds.length > 0
          ? supabase
              .from("replies")
              .select("id, post_id, user_id, text, created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 スタンプを一括取得
        postIds.length > 0
          ? supabase
              .from("stamp")
              .select("id, post_id, user_id, stanp_url")
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        
        // 🚀 スタンプリストを取得
        supabase
          .from("make_stamp")
          .select("make_stanp_url")
      ]);

      const { data: usersData } = usersResult;
      const { data: likesData } = likesResult;
      const { data: bookmarksData } = bookmarksResult;
      const { data: repliesData } = repliesResult;
      const { data: stampsData } = stampsResult;
      const { data: stampListData } = stampListResult;

      // 6. ユーザーマップを作成
      const userMapLocal: Record<string, any> = {};
      (usersData ?? []).forEach((user: any) => {
        userMapLocal[user.user_id] = {
          iconUrl: getPublicIconUrl(user.icon_url),
          displayName: user.username || "User",
          setID: user.setID || "",
          username: user.username || "",

        };
      });
      setUserMap(userMapLocal);

      // 7. リアクションマップを作成
      const likesMap = new Map();
      const bookmarksMap = new Map();
      
      (likesData ?? []).forEach((like: any) => {
        likesMap.set(like.post_id, like.on);
      });
      
      (bookmarksData ?? []).forEach((bookmark: any) => {
        bookmarksMap.set(bookmark.post_id, bookmark.on);
      });

      // 🚀 8. リプライマップを作成
      const repliesMap = new Map<number, ReplyType[]>();
      (repliesData ?? []).forEach((reply: any) => {
        const postId = reply.post_id;
        if (!repliesMap.has(postId)) {
          repliesMap.set(postId, []);
        }
        repliesMap.get(postId)!.push({
          ...reply,
          username: userMapLocal[reply.user_id]?.username || "User"
        });
      });

      // 🚀 9. スタンプマップを作成
      const stampsMap = new Map<number, StanpType[]>();
      (stampsData ?? []).forEach((stamp: any) => {
        const postId = Number(stamp.post_id);
        if (!stampsMap.has(postId)) {
          stampsMap.set(postId, []);
        }
        stampsMap.get(postId)!.push(stamp);
      });

      // 🚀 10. スタンプリストをグローバル状態に保存
      const stampListLocal = (stampListData ?? [])
        .map((row: any) => row.make_stanp_url)
        .filter(Boolean);
      setStampList(stampListLocal);

      // 11. 投稿データにすべての情報を統合
      const todosWithStatus = validTodos.map((todo: any) => { // validTodosを使用
        const userInfo = userMapLocal[todo.user_id] || {};
        const postIdNum = Number(todo.id);
        
        return {
          ...todo,
          liked: likesMap.get(postIdNum) || false,
          bookmarked: bookmarksMap.get(postIdNum) || false,
          user_icon_url: userInfo.iconUrl,
          displayName: userInfo.displayName,
          setID: userInfo.setID,
          username: userInfo.username || "User",
          replies: todo.replies || 0, // 🔧 数値として保持
          // 🚀 リプライとスタンプを事前に含める
          replies_data: repliesMap.get(postIdNum) || [],
          stamps_data: stampsMap.get(postIdNum) || []
        };
      });

      setPosts(todosWithStatus);
      if (userId) {
        setHomeFeedCache({
          userId,
          posts: todosWithStatus,
          stampList: stampListLocal,
          userMap: userMapLocal,
          fetchedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("fetchTodos: Unexpected error:", error);
      if (!silent) {
        setError("データの読み込み中にエラーが発生しました");
        setPosts([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [getPublicIconUrl]);

  // 🔧 fetchTodos関数をrefに設定
  useEffect(() => {
    fetchTodosRef.current = fetchTodos;
  }, [fetchTodos]);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔧 依存関係を修正した初期データ取得
  useEffect(() => {
    if (!isClient || authLoading) {
      return;
    }

    const currentUserId = user?.id ?? null;
    const cached = getHomeFeedCache();
    const isCacheForCurrentUser = !!cached && cached.userId === currentUserId;
    const isCacheFresh =
      isCacheForCurrentUser &&
      Date.now() - cached.fetchedAt < HOME_FEED_CACHE_TTL_MS;

    if (cached && isCacheForCurrentUser) {
      setPosts(cached.posts);
      setUserMap(cached.userMap);
      setStampList(cached.stampList);
      setLoading(false);

      if (!isCacheFresh) {
        fetchTodos({ silent: true });
      }
      return;
    }

    setPosts([]);
    setUserMap({});
    setStampList([]);
    fetchTodos();
  }, [isClient, authLoading, user?.id, fetchTodos]);

  // リアルタイム購読
  useEffect(() => {
    if (!isClient) return;
    
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "todos" },
        () => {
          fetchTodosRef.current?.({ silent: true });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient]); // fetchTodosを削除

  // 1秒ごとの再レンダリングを最適化
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // 時間表示のみを更新
      setPosts(prev => [...prev]);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // いいね追加/削除を最適化
  const handleLike = async (postId: string) => {
    if (!user) return;

    const userId = user.id;
    const postIdNum = Number(postId);

    try {
      // 🚀 楽観的更新: UIを即座に更新
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isCurrentlyLiked = post.liked;
            return {
              ...post,
              liked: !isCurrentlyLiked,
              likes: isCurrentlyLiked 
                ? Math.max(post.likes - 1, 0) 
                : post.likes + 1
            };
          }
          return post;
        })
      );

      // バックグラウンドでDB更新
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id, on")
        .eq("post_id", postIdNum)
        .eq("user_id", userId)
        .maybeSingle();

      if (likeError) {
        console.error("Error checking like status:", likeError);
        // エラー時は元に戻す
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                liked: !post.liked,
                likes: post.liked 
                  ? Math.max(post.likes - 1, 0) 
                  : post.likes + 1
              };
            }
            return post;
          })
        );
        return;
      }

      // 現在のlikes取得
      const { data: todoData } = await supabase
        .from("todos")
        .select("likes, user_id")
        .eq("id", postIdNum)
        .single();
      const currentLikes = todoData?.likes ?? 0;
      const postOwnerId = todoData?.user_id;

      if (likeData?.on) {
        // いいね解除
        await Promise.all([
          supabase
            .from("likes")
            .update({ on: false })
            .eq("post_id", postIdNum)
            .eq("user_id", userId),
          supabase
            .from("todos")
            .update({ likes: Math.max(currentLikes - 1, 0) })
            .eq("id", postIdNum)
        ]);
      } else {
        // いいね処理
        const isNewLike = !likeData;

        if (likeData) {
          // 再いいね
          await Promise.all([
            supabase
              .from("likes")
              .update({ on: true })
              .eq("post_id", postIdNum)
              .eq("user_id", userId),
            supabase
              .from("todos")
              .update({ likes: currentLikes + 1 })
              .eq("id", postIdNum)
          ]);
        } else {
          // 新規いいね
          await Promise.all([
            supabase.from("likes").insert({
              post_id: postIdNum,
              user_id: userId,
              created_at: new Date().toISOString(),
              on: true,
            }),
            supabase
              .from("todos")
              .update({ likes: currentLikes + 1 })
              .eq("id", postIdNum)
          ]);
        }

        // いいね通知を送信（新規いいねの場合のみ）
        if (isNewLike && postOwnerId && postOwnerId !== userId) {
          try {
            await fetch("/api/send-like-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                postId: postIdNum,
                likerId: userId,
                postOwnerId: postOwnerId,
              }),
            });
          } catch (error) {
            console.error("Error sending like notification:", error);
          }
        }
      }

      // 🚀 全体リフレッシュは行わない（楽観的更新のみ）
    } catch (error) {
      console.error("Error in handleLike:", error);
      // エラー時は元に戻す
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked: !post.liked,
              likes: post.liked 
                ? Math.max(post.likes - 1, 0) 
                : post.likes + 1
            };
          }
          return post;
        })
      );
    }
  };

  // ブックマーク追加/解除を最適化
  const handleBookmark = async (postId: string) => {
    if (!user) {
      alert("ブックマークするにはログインが必要です");
      return;
    }

    const userId = user.id;
    const postIdNum = Number(postId);

    try {
      // 🚀 楽観的更新: UIを即座に更新
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarked: !post.bookmarked
            };
          }
          return post;
        })
      );

      // バックグラウンドでDB更新
      const { data: bookmarkData } = await supabase
        .from("bookmarks")
        .select("id, on")
        .eq("post_id", postIdNum)
        .eq("user_id", userId)
        .maybeSingle();

      if (bookmarkData?.on) {
        // ブックマーク解除
        await supabase
          .from("bookmarks")
          .update({ on: false })
          .eq("post_id", postIdNum)
          .eq("user_id", userId);
      } else {
        // ブックマーク（新規 or 再ブックマーク）
        if (bookmarkData) {
          await supabase
            .from("bookmarks")
            .update({ on: true })
            .eq("post_id", postIdNum)
            .eq("user_id", userId);
        } else {
          await supabase.from("bookmarks").insert({
            post_id: postIdNum,
            user_id: userId,
            created_at: new Date().toISOString(),
            on: true,
          });
        }
      }
      
      // 🚀 全体リフレッシュは行わない（楽観的更新のみ）
    } catch (error) {
      console.error("Error in handleBookmark:", error);
      // エラー時は元に戻す
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              bookmarked: !post.bookmarked
            };
          }
          return post;
        })
      );
    }
  };

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchTodos()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <PWAInstaller />
      <TutorialModal featureId="timeline" />
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto flex lg:h-screen">
          {/* デスクトップ: 左サイドバー */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            {isClient && <Sidebar />}
          </div>
          
          {/* メインコンテンツ */}
          <div className="flex-1 max-w-2xl mx-auto lg:border-r border-gray-800 relative z-10 pb-20 lg:pb-0 lg:overflow-y-auto">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4 z-40">
              {/* モバイル: タイトルと認証ボタン */}
              <div className="lg:hidden flex items-center justify-between">
                <h1 className="text-xl font-bold">ホーム</h1>
                {isClient && (
                  <div className="flex items-center space-x-2">
                    {user ? (
                      <div className="flex items-center space-x-2">
                        {/* ユーザーアイコン */}
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.user_metadata?.displayName?.charAt(0) ||
                           user.user_metadata?.username?.charAt(0) ||
                           user.email?.charAt(0) ||
                           "U"}
                        </div>
                        <span className="text-sm text-gray-400">
                          {user.user_metadata?.displayName || 
                           user.user_metadata?.username || 
                           "ユーザー"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Link
                          href="/auth/login"
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                        >
                          ログイン
                        </Link>
                        <Link
                          href="/auth/signup"
                          className="px-3 py-1 text-sm border border-green-600 text-green-400 rounded-full hover:bg-green-900/30 transition-colors"
                        >
                          サインアップ
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* タブ */}
              {isClient && (
                <div className="flex -mx-4 -mb-4 mt-4 lg:mt-0 lg:-mb-4 border-t lg:border-t-0 border-gray-800">
                  <button
                    onClick={() => setActiveTab("newest")}
                    className={`px-3 lg:px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === "newest"
                        ? "text-white border-b-2 border-blue-500"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    新着
                  </button>
                  <button
                    onClick={() => setActiveTab("output_ch")}
                    className={`px-3 lg:px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === "output_ch"
                        ? "text-white border-b-2 border-blue-500"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    成果物紹介ch
                  </button>
                </div>
              )}
              
              {authError && (
                <div className="mt-2 bg-red-900/40 border border-red-700 text-red-200 text-sm p-3 rounded">
                  <p className="font-semibold mb-1">サインインエラー</p>
                  <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed">{authError}</pre>
                </div>
              )}
            </div>
            
            {/* 投稿フォーム */}
            {isClient && (
              <PostForm 
                onPostAdded={handlePostAdded}
                onOptimisticPost={handleOptimisticPost}
                onOptimisticUpdate={handleOptimisticUpdate} // 🚀 新しいハンドラー
                r2PublicUrl={R2_PUBLIC_URL} 
              />
            )}
            
            {/* 投稿一覧表示 */}
            <div className="relative z-10">
              {loading && filteredPosts.length === 0 ? (
                <div className="px-4 py-6 space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl border border-gray-800 bg-gray-900/40 p-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gray-800" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 w-32 rounded bg-gray-800" />
                          <div className="h-2 w-20 rounded bg-gray-800/80" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-gray-800" />
                        <div className="h-3 w-5/6 rounded bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>まだ投稿がありません</p>
                </div>
              ) : (
                filteredPosts.map((todo) => {
                  return (
                    <div key={todo.id} className="relative">
                      {/* 楽観的更新中の表示 */}
                      {todo.isOptimistic && (
                        <div className="absolute top-2 left-2 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full z-10">
                          投稿中...
                        </div>
                      )}

                      <Post
                        post={{
                          id: todo.id,
                          user_id: todo.user_id || "",
                          username:
                            userMap[todo.user_id]?.username ||
                            todo.username ||
                            "User",
                          setID: userMap[todo.user_id]?.setID || "",
                          title: todo.title,
                          created_at: todo.created_at || "",
                          tags: todo.tags || [],
                          replies: todo.replies_data || [], // 🔧 配列データを渡す
                          likes: todo.likes || 0,
                          bookmarked: todo.bookmarked || false,
                          image_url: todo.image_url || "",
                          user_icon_url: userMap[todo.user_id]?.iconUrl,
                          displayName: userMap[todo.user_id]?.displayName,
                          stamps: todo.stamps_data || []
                        }}
                        liked={todo.liked ?? false}
                        bookmarked={todo.bookmarked ?? false}
                        onLike={() => handleLike(todo.id)}
                        onBookmark={() => handleBookmark(todo.id)}
                        stampList={stampList}
                        currentUserId={user?.id || undefined} // 🔧 null を undefined に変換（または型定義を修正）
                        currentUserName={
                          user?.user_metadata?.displayName || 
                          user?.user_metadata?.username || 
                          userMap[user?.id || ""]?.username ||
                          "User"
                        }
                        onRefresh={fetchTodos}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* デスクトップ: 右サイドバー（ホームページでは非表示） */}
          <div className="hidden xl:block w-80 flex-shrink-0 h-screen overflow-y-auto">
            {/* 右サイドバーのコンテンツ */}
            <div className="p-4 space-y-6">
              <div className="bg-gray-800 rounded-2xl p-4">
                <h2 className="text-xl font-bold mb-4">トレンド</h2>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-sm">トレンド情報は準備中です</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        {isClient && <MobileNavigation />}
        {isClient && <MobileExtendedNavigation />}
      </div>
    </>
  );
}
