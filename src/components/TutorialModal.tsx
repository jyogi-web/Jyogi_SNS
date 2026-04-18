"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Download } from "lucide-react";
import { getFeature } from "@/app/tutorial/data";

interface Props {
  featureId: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function TutorialModal({ featureId }: Props) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  const storageKey = `tutorial_modal_${featureId}`;
  const feature = getFeature(featureId);

  useEffect(() => {
    if (!feature) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) setVisible(true);
  }, [storageKey, feature]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!visible || !feature) return null;

  const step = feature.steps[stepIndex];
  const isLast = stepIndex === feature.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(storageKey, "true");
      setVisible(false);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* ヘッダー */}
        <div className="flex items-center gap-3 pr-6">
          <span className="text-3xl">{feature.emoji}</span>
          <div>
            <p className="text-gray-400 text-xs">使い方ガイド</p>
            <h2 className="text-white font-bold text-lg leading-tight">
              {feature.title}
            </h2>
          </div>
        </div>

        {/* ステップインジケーター */}
        {feature.steps.length > 1 && (
          <div className="flex gap-1">
            {feature.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        )}

        {/* ステップ内容 */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-2">{step.title}</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            {step.description}
          </p>

          {featureId === "timeline" && stepIndex === 0 && (
            <div className="mt-4 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3">
              <p className="text-blue-100 text-xs leading-relaxed mb-2">
                まずはアプリをインストールしておくと、次回からホーム画面からすぐ開けて便利です。
              </p>
              {canInstall ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  <Download size={14} />
                  アプリをインストール
                </button>
              ) : (
                <p className="text-gray-300 text-xs leading-relaxed">
                  このブラウザでは自動インストールボタンが出ない場合があります。
                  その場合は、ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選んでください。
                </p>
              )}
            </div>
          )}
        </div>

        {/* ボタン */}
        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-1 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
        >
          {isLast ? "わかった" : "次へ"}
          {!isLast && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
