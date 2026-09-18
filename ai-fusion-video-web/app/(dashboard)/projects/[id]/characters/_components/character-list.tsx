"use client";

import { Search, UserRound } from "lucide-react";
import type { AssetWithItems } from "@/lib/api/asset";
import { resolveMediaUrl } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export function CharacterList({
  assets,
  selectedId,
  search,
  onSearch,
  onSelect,
}: {
  assets: AssetWithItems[];
  selectedId: number | null;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: number) => void;
}) {
  const filtered = assets.filter((asset) =>
    asset.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <aside className="min-w-0 space-y-4" aria-label="项目角色">
      <div className="flex items-center justify-between text-sm">
        <h2 className="font-semibold">项目角色</h2>
        <span className="text-muted-foreground">{assets.length}</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          aria-label="搜索角色"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="搜索角色"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 2xl:flex-col 2xl:overflow-visible">
        {filtered.map((asset) => (
          <button
            key={asset.id}
            type="button"
            aria-pressed={selectedId === asset.id}
            onClick={() => onSelect(asset.id)}
            className={cn(
              "flex min-w-44 shrink-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 2xl:w-full 2xl:min-w-0",
              selectedId === asset.id
                ? "border-primary/40 bg-primary/10"
                : "border-border/30 bg-card/50 hover:border-border/50 hover:bg-muted",
            )}
          >
            {asset.coverUrl ? (
              <SafeImage
                src={resolveMediaUrl(asset.coverUrl) ?? undefined}
                alt={asset.name}
                className="size-12 shrink-0 rounded-lg object-cover"
                fallbackType="avatar"
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted">
                <UserRound className="size-5 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {asset.name}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {asset.coverUrl ? "形象已确认" : "等待生成形象"}
              </span>
            </span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm leading-6 text-muted-foreground">
          {search ? "没有找到这个角色" : "角色会保存在这里，随时回来继续创作。"}
        </p>
      )}
    </aside>
  );
}
