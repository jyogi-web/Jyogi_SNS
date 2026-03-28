"use client";

import Link from "next/link";

export default function TutorialCompletePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="text-8xl mb-6">🎉</div>
      <h1 className="text-white text-3xl font-bold mb-3">
        チュートリアル完了！
      </h1>
      <p className="text-gray-300 text-base leading-relaxed max-w-sm mb-8">
        じょぎSNSの基本機能を学びました。
        さっそく投稿して、部員と交流してみましょう！
      </p>

      <Link
        href="/"
        className="w-full max-w-sm py-3 rounded-full bg-blue-600 text-white font-semibold text-center hover:bg-blue-500 transition-colors block"
      >
        タイムラインへ
      </Link>

      <Link
        href="/tutorial"
        className="mt-4 text-gray-500 text-sm hover:text-gray-300 transition-colors"
      >
        もう一度見る
      </Link>
    </div>
  );
}
