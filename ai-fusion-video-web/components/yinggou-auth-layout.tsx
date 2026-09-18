"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  className?: string;
  children: React.ReactNode;
  showSuccess?: boolean;
  successTitle?: string;
  successSubtitle?: string;
  onTransitionComplete?: () => void;
}

export function AuthLayout({
  children,
  className,
  showSuccess,
  successTitle = "操作成功",
  successSubtitle = "正在进入创作工作台…",
  onTransitionComplete,
}: AuthLayoutProps) {
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => onTransitionComplete?.(), 600);
    return () => clearTimeout(timer);
  }, [showSuccess, onTransitionComplete]);

  return (
    <div
      className={cn(
        "dark relative flex min-h-screen flex-col bg-background text-foreground",
        className,
      )}
    >
      <header className="flex items-center gap-3 p-6">
        <Image src="/yinggou-mark.svg" alt="映构" width={40} height={40} />
        <div>
          <p className="text-xl font-semibold">映构</p>
          <p className="text-xs text-muted-foreground">
            从角色开始，构建你的影像世界
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">{children}</div>
      </main>
      {showSuccess && (
        <div
          role="status"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
        >
          <Check className="size-12 text-primary" />
          <h1 className="text-2xl font-semibold">{successTitle}</h1>
          <p className="text-muted-foreground">{successSubtitle}</p>
        </div>
      )}
    </div>
  );
}
