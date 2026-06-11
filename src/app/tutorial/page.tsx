"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { TUTORIAL_FEATURES } from "./data";
import { TutorialFeature } from "@/types/tutorial";
import { useRouter } from "next/navigation";

function FeatureCard({ feature }: { feature: TutorialFeature }) {
  return (
    <li>
      <Link
        href={`/tutorial/${feature.id}`}
        className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 rounded-2xl px-5 py-4 transition-colors"
      >
        <span className="text-4xl">{feature.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{feature.title}</p>
          <p className="text-gray-400 text-sm truncate">
            {feature.shortDescription}
          </p>
        </div>
        <span className="text-gray-500 text-lg">›</span>
      </Link>
    </li>
  );
}

export default function TutorialPage() {
  const router = useRouter();
  const basicFeatures = TUTORIAL_FEATURES.filter((f) => f.category === "basic");
  const otherFeatures = TUTORIAL_FEATURES.filter((f) => f.category === "feature");

  const handleResetTutorials = () => {
    if (process.env.NODE_ENV !== "development") return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith("tutorial_modal_"))
      .forEach((key) => localStorage.removeItem(key));

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">使い方ガイド</h1>
            <p className="text-gray-400 text-sm">各機能の使い方を確認しよう</p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleResetTutorials}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <RotateCcw size={16} />
            チュートリアルを再表示する
          </button>
        )}

        {/* 基本操作 */}
        <section className="mb-8">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 px-1">
            基本操作
          </h2>
          <ul className="flex flex-col gap-2">
            {basicFeatures.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </ul>
        </section>

        {/* 各機能 */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 px-1">
            各機能
          </h2>
          <ul className="flex flex-col gap-2">
            {otherFeatures.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
