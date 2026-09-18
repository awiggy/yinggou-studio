import Link from "next/link";
import { ArrowUpRight, Film, FolderOpen } from "lucide-react";
import type { Project } from "@/lib/api/project";
import { resolveMediaUrl } from "@/lib/api/client";
import { SafeImage } from "@/components/ui/safe-image";

export function StudioProjectList({
  projects,
  searching,
}: {
  projects: Project[];
  searching: boolean;
}) {
  if (projects.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
        <FolderOpen className="size-8 text-muted-foreground" />
        <h3 className="font-medium">
          {searching ? "没有找到匹配的项目" : "你的故事，还没有开始"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {searching
            ? "试试其他关键词。"
            : "点击「新建创作项目」，从第一个角色开始。"}
        </p>
      </div>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}/characters`}
          className="group overflow-hidden rounded-xl border border-border/30 bg-card transition-colors hover:border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {project.coverUrl ? (
            <SafeImage
              src={resolveMediaUrl(project.coverUrl) ?? undefined}
              alt={project.name}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] items-end justify-between bg-muted/40 p-5">
              <Film className="size-10 text-muted-foreground/50" />
              <span className="text-xs tracking-widest text-muted-foreground">
                映构 / PROJECT
              </span>
            </div>
          )}
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-lg font-semibold">{project.name}</h3>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
              {project.description || "从角色设定出发，构建你的影像世界。"}
            </p>
            <div className="flex items-center justify-between border-t border-border/20 pt-3 text-xs text-muted-foreground">
              <span>继续角色创作</span>
              <time dateTime={project.updateTime}>
                {new Date(project.updateTime).toLocaleDateString("zh-CN")}
              </time>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
