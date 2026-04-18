"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";

interface LoadingScreenProps {
  onComplete: () => void;
  isReady: boolean;
}

const loadingTexts = [
  "初期化中...",
  "認証情報を確認中...",
  "表示準備中...",
  "完了！"
];

// 表示するサブタイトルの候補を列挙
const subtitleOptions = [
  "脳内直結SNS",
  "お前も健康最高と叫びなさい！！",
  "出勤だいしゅき",
  "先輩の肝臓をみたい",
  "朝の20分は夜の1時間に相当する……",
  "嫌がってる人をスタンプにしないと楽しくない",
  "「50円しかない」「いちご大福串1つ」",
  "パンツ拾えよ！ちゃんとぉお゛お゛！！！",
  "酒飲み勢は普段そこそこぱー",
  "授業ちゃんと聞くとか学生に有るまじき行為",
  "自分田中将大(しょうだい)分かるよ！",
  "うんちぐらびてー",
  "愛とはお金を貸してくれること",
  "魚に人権は無いです",
  "皆さん自然に抗ってください",
  "\"脱\"脱ニート",
  "CodeRabbitがバニーだったらやる気出るのに",
  "envファイル家に忘れてきた",
  "思想が赤くない人にレフトフック",
  "いつの間にかドパガキ老害指数がぶちあがってる",
];

// カラーテーマの定義
const colorThemes = [
  {
    name: "blue-purple",
    background: "from-blue-900/30 via-black to-purple-900/30",
    radialGradient: "rgba(59,130,246,0.1)",
    glow: "bg-blue-500/40",
    particle: "bg-blue-400/30",
    iconBg: "from-blue-500 via-purple-500 to-blue-600",
    ring1: "border-blue-400/40 border-t-blue-500 border-r-purple-500",
    ring2: "border-purple-400/30 border-b-purple-500 border-l-blue-500",
    titleGradient: "from-blue-300 via-purple-300 to-blue-300",
    progressGradient: "from-blue-500 via-purple-500 to-blue-500",
    progressGlow: "from-blue-400 to-purple-400"
  },
  {
    name: "orange-red",
    background: "from-orange-900/30 via-black to-red-900/30",
    radialGradient: "rgba(249,115,22,0.1)",
    glow: "bg-orange-500/40",
    particle: "bg-orange-400/30",
    iconBg: "from-orange-500 via-red-500 to-orange-600",
    ring1: "border-orange-400/40 border-t-orange-500 border-r-red-500",
    ring2: "border-red-400/30 border-b-red-500 border-l-orange-500",
    titleGradient: "from-orange-300 via-red-300 to-orange-300",
    progressGradient: "from-orange-500 via-red-500 to-orange-500",
    progressGlow: "from-orange-400 to-red-400"
  },
  {
    name: "green-emerald",
    background: "from-green-900/30 via-black to-emerald-900/30",
    radialGradient: "rgba(16,185,129,0.1)",
    glow: "bg-green-500/40",
    particle: "bg-green-400/30",
    iconBg: "from-green-500 via-emerald-500 to-green-600",
    ring1: "border-green-400/40 border-t-green-500 border-r-emerald-500",
    ring2: "border-emerald-400/30 border-b-emerald-500 border-l-green-500",
    titleGradient: "from-green-300 via-emerald-300 to-green-300",
    progressGradient: "from-green-500 via-emerald-500 to-green-500",
    progressGlow: "from-green-400 to-emerald-400"
  },
  {
    name: "pink-purple",
    background: "from-pink-900/30 via-black to-purple-900/30",
    radialGradient: "rgba(236,72,153,0.1)",
    glow: "bg-pink-500/40",
    particle: "bg-pink-400/30",
    iconBg: "from-pink-500 via-purple-500 to-pink-600",
    ring1: "border-pink-400/40 border-t-pink-500 border-r-purple-500",
    ring2: "border-purple-400/30 border-b-purple-500 border-l-pink-500",
    titleGradient: "from-pink-300 via-purple-300 to-pink-300",
    progressGradient: "from-pink-500 via-purple-500 to-pink-500",
    progressGlow: "from-pink-400 to-purple-400"
  },
  {
    name: "cyan-blue",
    background: "from-cyan-900/30 via-black to-blue-900/30",
    radialGradient: "rgba(6,182,212,0.1)",
    glow: "bg-cyan-500/40",
    particle: "bg-cyan-400/30",
    iconBg: "from-cyan-500 via-blue-500 to-cyan-600",
    ring1: "border-cyan-400/40 border-t-cyan-500 border-r-blue-500",
    ring2: "border-blue-400/30 border-b-blue-500 border-l-cyan-500",
    titleGradient: "from-cyan-300 via-blue-300 to-cyan-300",
    progressGradient: "from-cyan-500 via-blue-500 to-cyan-500",
    progressGlow: "from-cyan-400 to-blue-400"
  },
  {
    name: "indigo-violet",
    background: "from-indigo-900/30 via-black to-violet-900/30",
    radialGradient: "rgba(99,102,241,0.1)",
    glow: "bg-indigo-500/40",
    particle: "bg-indigo-400/30",
    iconBg: "from-indigo-500 via-violet-500 to-indigo-600",
    ring1: "border-indigo-400/40 border-t-indigo-500 border-r-violet-500",
    ring2: "border-violet-400/30 border-b-violet-500 border-l-indigo-500",
    titleGradient: "from-indigo-300 via-violet-300 to-indigo-300",
    progressGradient: "from-indigo-500 via-violet-500 to-indigo-500",
    progressGlow: "from-indigo-400 to-violet-400"
  }
];

export default function LoadingScreen({ onComplete, isReady }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
  const [subtitle, setSubtitle] = useState<string>("");
  const hasCompletedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const completeTimerRef = useRef<number | null>(null);

  // パーティクル位置を固定して、進捗更新時にチラつかないようにする
  const particlePositions = useMemo(() => {
    if (!isClient) {
      return [];
    }

    return Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
  }, [isClient]);

  useEffect(() => {
    // クライアントサイドであることを確認
    setIsClient(true);
    
    // ランダムなカラーテーマを選択
    const randomTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
    setSelectedTheme(randomTheme);
    // ランダムなサブタイトルを選択
    try {
      const randomSubtitle = subtitleOptions[Math.floor(Math.random() * subtitleOptions.length)];
      setSubtitle(randomSubtitle);
    } catch (e) {
      // 万が一のフォールバック
      setSubtitle("脳内直結SNS");
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    setProgress(100);
    setIsExiting(true);

    completeTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, 600);
  }, [onComplete]);

  useEffect(() => {
    // 進捗は「待機中は 88% まで」「準備完了後に 100% まで」進める
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }

        if (isReady) {
          const readyProgress = prev + Math.random() * 18 + 8;
          return Math.min(readyProgress, 100);
        }

        const waitingCap = 88;
        if (prev >= waitingCap) {
          return prev;
        }

        const waitingStep = Math.max((waitingCap - prev) * 0.12, 0.8);
        return Math.min(prev + waitingStep, waitingCap);
      });
    }, 120);

    return () => {
      window.clearInterval(progressInterval);
    };
  }, [isReady]);

  const currentText = useMemo(() => {
    const progressPercent = Math.min(progress, 100);

    if (progressPercent >= 100) {
      return loadingTexts[3];
    }

    if (!isReady) {
      if (progressPercent < 25) {
        return loadingTexts[0];
      }
      if (progressPercent < 60) {
        return loadingTexts[1];
      }
      return loadingTexts[2];
    }

    return "最終確認中...";
  }, [progress, isReady]);

  useEffect(() => {
    if (!isReady || progress < 100) {
      return;
    }

    // 最小表示時間（1.2秒）
    const elapsed = Date.now() - startTimeRef.current;
    const waitTime = Math.max(1200 - elapsed, 0);

    const minDisplayTimer = window.setTimeout(() => {
      handleComplete();
    }, waitTime);

    return () => {
      window.clearTimeout(minDisplayTimer);
    };
  }, [isReady, progress, handleComplete]);

  useEffect(() => {
    // フォールバック: 10秒で強制完了
    const maxDisplayTimer = window.setTimeout(() => {
      handleComplete();
    }, 10000);

    return () => {
      window.clearTimeout(maxDisplayTimer);
    };
  }, [handleComplete]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current !== null) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-500 ${isExiting ? "opacity-0" : "opacity-100"}`}>
      {/* 背景エフェクト */}
      <div className={`absolute inset-0 bg-gradient-to-br ${selectedTheme.background}`}></div>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, ${selectedTheme.radialGradient} 100%)`
        }}
      ></div>
      
      {/* 浮遊するパーティクル - クライアントサイドでのみレンダリング */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden">
          {particlePositions.map((particle, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 ${selectedTheme.particle} rounded-full animate-pulse`}
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* メインロゴ */}
        <div className="relative mb-8">
          {/* 外側のグロー */}
          <div className={`absolute inset-0 ${selectedTheme.glow} rounded-full blur-2xl scale-150 animate-pulse`}></div>
          
          {/* メインアイコン - ロゴ画像を使用 */}
          <div className={`relative w-28 h-28 bg-gradient-to-br ${selectedTheme.iconBg} rounded-full flex items-center justify-center shadow-2xl p-4`}>
            <Image
              src="/JyogiIcon.png"
              alt="JyogiSNS"
              width={80}
              height={80}
              className="w-20 h-20 object-contain drop-shadow-lg"
              priority
            />
          </div>
          
          {/* 回転リング */}
          <div className={`absolute inset-0 border-4 ${selectedTheme.ring1} rounded-full animate-spin`}></div>
          <div className={`absolute inset-2 border-2 ${selectedTheme.ring2} rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        </div>

        {/* アプリ名 */}
        <h1 className={`text-5xl font-bold mb-3 bg-gradient-to-r ${selectedTheme.titleGradient} bg-clip-text text-transparent animate-pulse`}>
          JyogiSNS
        </h1>
        
        {/* サブタイトル（ランダム表示） */}
        <p className="text-gray-400 text-xl mb-10 tracking-wide">
          {subtitle || "脳内直結SNS"}
        </p>

        {/* プログレスバー */}
        <div className="w-72 h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/50">
          <div 
            className={`h-full bg-gradient-to-r ${selectedTheme.progressGradient} rounded-full transition-all duration-500 ease-out relative`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* プログレスバーのグロー効果 */}
            <div className={`absolute inset-0 bg-gradient-to-r ${selectedTheme.progressGlow} rounded-full blur-sm opacity-60`}></div>
          </div>
        </div>

        {/* ローディングテキスト */}
        <div className="mt-8 text-gray-300 text-lg font-medium">
          <div className="animate-pulse">
            {currentText}
          </div>
        </div>

        {/* プログレスパーセンテージ */}
        <div className="mt-4 text-gray-500 text-sm font-mono">
          {Math.round(Math.min(progress, 100))}%
        </div>
      </div>

      {/* カスタムCSSアニメーション */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(147, 51, 234, 0.3);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        .glow-animation {
          animation: glow 2s ease-in-out infinite;
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
