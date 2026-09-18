"use client";

import { Check, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveMediaUrl } from "@/lib/api/client";
import type { ImageGenerationItem } from "@/lib/api/generation";
import type { CharacterGenerationEntry } from "./use-character-generation";

interface CharacterImageHistoryProps {
  entries: CharacterGenerationEntry[];
  coverUrl: string | null;
  selecting: number | null;
  onSelect: (item: ImageGenerationItem, prompt: string) => void;
}

export function CharacterImageHistory({
  entries,
  coverUrl,
  selecting,
  onSelect,
}: CharacterImageHistoryProps) {
  if (entries.length === 0)
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 p-6 text-center">
        <ImagePlus className="size-9 text-muted-foreground" />
        <p className="font-medium">让文字里的角色，第一次出现</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          选择图片模型，生成第一张角色图。满意后将它设为角色形象，后续分镜就能引用。
        </p>
      </div>
    );

  return (
    <div className="space-y-4" aria-live="polite">
      {entries.map(({ task, items }) => (
        <section
          key={task.taskId}
          className="space-y-3 rounded-lg border border-border/20 bg-background/70 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{new Date(task.createTime).toLocaleString("zh-CN")}</span>
            <span className="flex items-center gap-1">
              {(task.status === 0 || task.status === 1) && (
                <Loader2 className="size-3 animate-spin" />
              )}
              {task.status === 0
                ? "排队中"
                : task.status === 1
                  ? "生成中"
                  : task.status === 2
                    ? "已完成"
                    : "未完成"}
            </span>
          </div>
          {task.errorMsg && (
            <p className="break-words text-sm text-destructive">
              {task.errorMsg}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) =>
              item.imageUrl && item.status === 1 ? (
                <div key={item.id} className="min-w-0 space-y-3">
                  <a
                    href={resolveMediaUrl(item.imageUrl) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="打开角色图片原图"
                  >
                    <SafeImage
                      src={resolveMediaUrl(item.imageUrl) ?? undefined}
                      alt="生成的角色形象"
                      className="aspect-[3/4] w-full rounded-lg bg-muted object-contain"
                    />
                  </a>
                  <Button
                    className="w-full"
                    variant={
                      coverUrl === item.imageUrl ? "secondary" : "outline"
                    }
                    disabled={selecting !== null || coverUrl === item.imageUrl}
                    onClick={() => onSelect(item, task.prompt)}
                  >
                    {selecting === item.id ? (
                      <Loader2 className="animate-spin" />
                    ) : coverUrl === item.imageUrl ? (
                      <Check />
                    ) : (
                      <ImagePlus />
                    )}
                    {coverUrl === item.imageUrl
                      ? "当前角色形象"
                      : "设为角色形象"}
                  </Button>
                </div>
              ) : (
                <div
                  key={item.id}
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground"
                >
                  {item.status === 2 || task.status === 3 ? (
                    <RefreshCw className="size-6" />
                  ) : (
                    <Loader2 className="size-6 animate-spin" />
                  )}
                  <p className="break-words">
                    {item.errorMsg ||
                      (item.status === 2 || task.status === 3
                        ? "图片生成未完成，请查看错误信息后重试。"
                        : "正在绘制角色形象…")}
                  </p>
                </div>
              ),
            )}
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">查看本次提示词</summary>
            <p className="mt-2 whitespace-pre-wrap break-words leading-6">
              {task.prompt}
            </p>
          </details>
        </section>
      ))}
    </div>
  );
}
