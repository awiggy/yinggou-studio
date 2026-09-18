"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clapperboard,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  UserRound,
  Video,
} from "lucide-react";
import { projectApi, type Project } from "@/lib/api/project";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "./_components/new-project-dialog";
import { StudioProjectList } from "./_components/studio-project-list";

const steps = [
  {
    icon: UserRound,
    title: "设定角色",
    description: "外貌、服饰、性格，让主角有自己的模样。",
  },
  {
    icon: ImagePlus,
    title: "生成形象",
    description: "把设定变成图片，选定故事里的那个人。",
  },
  {
    icon: Clapperboard,
    title: "走进分镜",
    description: "让角色进入场景，再将画面变成视频。",
  },
];

export default function StudioPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    projectApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setProjects(list);
        setError("");
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const filtered = projects.filter((project) =>
    `${project.name} ${project.description ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-8 rounded-xl border border-border/30 bg-card p-6 lg:grid-cols-[1.2fr_1fr] lg:p-8">
        <div className="flex flex-col items-start justify-center gap-5">
          <span className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground">
            <Clapperboard className="size-4" />
            映构 YINGGOU / 创作工作台
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            你的故事，
            <br />
            <span className="text-foreground">从一个角色开始。</span>
          </h1>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            用文字构想人物，用图片确定形象。
            <br />
            从第一个主角，到属于你的影像世界。
          </p>
          <Button size="lg" onClick={() => setCreating(true)}>
            <Plus />
            新建创作项目
          </Button>
        </div>
        <ol
          className="divide-y divide-border/20 lg:border-l lg:border-border/20 lg:pl-8"
          aria-label="视频创作流程"
        >
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="flex gap-4 py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border/30 bg-background/70">
                <Icon className="size-5 text-muted-foreground" />
              </span>
              <div>
                <p className="flex items-center gap-3 font-medium">
                  <span className="text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">我的创作项目</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              每个项目，都有自己的角色与故事。
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="搜索创作项目"
              className="pl-9"
              placeholder="搜索项目"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-3 text-sm text-destructive"
          >
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              重试
            </Button>
          </div>
        ) : loading ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            加载项目…
          </p>
        ) : (
          <StudioProjectList projects={filtered} searching={!!search} />
        )}
      </section>
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border/20 py-5">
        <div>
          <h2 className="font-medium">已经有灵感？直接开始生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            图片和视频工具随时可用，也可以从已有项目继续。
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/generate/image"
            className={buttonVariants({ variant: "outline" })}
          >
            <ImagePlus />
            图片生成
          </Link>
          <Link
            href="/generate/video"
            className={buttonVariants({ variant: "outline" })}
          >
            <Video />
            视频生成
          </Link>
          <Link
            href="/projects"
            className={buttonVariants({ variant: "ghost" })}
          >
            管理项目
            <ArrowRight />
          </Link>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">
        映构 · 基于开源项目{" "}
        <a
          href="https://github.com/Stonewuu/ai-fusion-video"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          融光
        </a>{" "}
        构建
      </p>
      {creating && (
        <NewProjectDialog
          onClose={() => setCreating(false)}
          onCreated={(project) =>
            router.push(`/projects/${project.id}/characters`)
          }
        />
      )}
    </div>
  );
}
