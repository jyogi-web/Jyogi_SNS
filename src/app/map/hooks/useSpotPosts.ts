"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { SpotPost, NewSpotData } from "../types";
import { mockSpotPosts } from "../data/mockData";

export function useSpotPosts() {
  const [posts, setPosts] = useState<SpotPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("spot_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (dbError) throw dbError;
      setPosts(data as SpotPost[]);
    } catch {
      setPosts(mockSpotPosts);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const submitPost = async (
    newSpot: NewSpotData,
    userId: string,
    username: string,
    userIconUrl?: string
  ): Promise<boolean> => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: SpotPost = {
      id: tempId,
      user_id: userId,
      username,
      user_icon_url: userIconUrl,
      ...newSpot,
      likes: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
    };
    setPosts((prev) => [optimistic, ...prev]);

    try {
      const { data, error: dbError } = await supabase
        .from("spot_posts")
        .insert({
          user_id: userId,
          username,
          user_icon_url: userIconUrl ?? null,
          ...newSpot,
          likes: 0,
          liked_by: [],
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? (data as SpotPost) : p))
      );
      return true;
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      return false;
    }
  };

  const toggleLike = async (postId: string, userId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.liked_by.includes(userId);
        return {
          ...p,
          likes: liked ? p.likes - 1 : p.likes + 1,
          liked_by: liked
            ? p.liked_by.filter((id) => id !== userId)
            : [...p.liked_by, userId],
        };
      })
    );

    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.liked_by.includes(userId);
    const newLikedBy = liked
      ? post.liked_by.filter((id) => id !== userId)
      : [...post.liked_by, userId];

    await supabase
      .from("spot_posts")
      .update({ likes: liked ? post.likes - 1 : post.likes + 1, liked_by: newLikedBy })
      .eq("id", postId);
  };

  return { posts, loading, error, submitPost, toggleLike, refetch: fetchPosts };
}
