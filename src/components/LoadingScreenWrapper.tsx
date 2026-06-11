"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";

interface LoadingScreenWrapperProps {
  children: React.ReactNode;
}

export default function LoadingScreenWrapper({ children }: LoadingScreenWrapperProps) {
  const { loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthWaitTimedOut, setIsAuthWaitTimedOut] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      return;
    }

    // 認証初期化が想定外に長引いた場合でも、アプリ全体がブロックされないようにする
    const timeoutId = window.setTimeout(() => {
      setIsAuthWaitTimedOut(true);
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const isReady = !authLoading || isAuthWaitTimedOut;

  return (
    <>
      {isLoading && <LoadingScreen isReady={isReady} onComplete={handleLoadingComplete} />}
      {!isLoading && children}
    </>
  );
}
