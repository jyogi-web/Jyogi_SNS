"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getFeature } from "../data";

export default function FeatureTutorialPage() {
  const { feature } = useParams<{ feature: string }>();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  const data = getFeature(feature);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-gray-400">ページが見つかりません</p>
        <Link href="/tutorial" className="text-blue-400 hover:text-blue-300">
          ガイド一覧へ戻る
        </Link>
      </div>
    );
  }

  const step = data.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === data.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push("/tutorial");
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      {/* 戻るボタン */}
      <div className="w-full max-w-md mb-4 flex items-center gap-2">
        <Link
          href="/tutorial"
          className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="text-gray-400 text-sm">ガイド一覧</span>
      </div>

      {/* プログレスバー */}
      <div className="w-full max-w-md mb-6">
        <div className="flex gap-1">
          {data.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= stepIndex ? "bg-blue-500" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-2 text-right">
          {stepIndex + 1} / {data.steps.length}
        </p>
      </div>

      {/* スライドカード */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 flex flex-col items-center text-center gap-6 shadow-xl">
        <div className="text-7xl">{data.emoji}</div>
        <div>
          <p className="text-gray-400 text-sm mb-1">{data.title}</p>
          <h2 className="text-white text-2xl font-bold">{step.title}</h2>
        </div>
        <p className="text-gray-300 text-base leading-relaxed">
          {step.description}
        </p>
        <Link
          href={data.path}
          className="text-blue-400 text-sm underline underline-offset-2 hover:text-blue-300"
        >
          実際の画面を見る →
        </Link>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center gap-4 mt-6 w-full max-w-md">
        <button
          onClick={() => setStepIndex((i) => i - 1)}
          disabled={isFirst}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 text-white disabled:opacity-30 hover:bg-gray-700 transition-colors"
        >
          <ChevronRight size={22} className="rotate-180" />
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
        >
          {isLast ? "一覧に戻る" : "次へ"}
        </button>

        <div className="w-12 h-12" />
      </div>
    </div>
  );
}
