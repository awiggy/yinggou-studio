"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Film, ImagePlus, Loader2, Plus, UserRound, Check } from "lucide-react";
import { toast } from "sonner";
import { listCharacters, saveCharacter } from "@/lib/api/character";
import type { AssetWithItems } from "@/lib/api/asset";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { readProperties, type CharacterProfile } from "@/lib/character-profile";
import { resolveMediaUrl } from "@/lib/api/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useProject } from "../project-context";
import { CharacterForm } from "./_components/character-form";
import { CharacterList } from "./_components/character-list";
import { CharacterImageStudio } from "./_components/character-image-studio";

export default function CharactersPage() {
  const { project } = useProject();
  const { confirm } = useConfirm();
  const [assets, setAssets] = useState<AssetWithItems[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [profileVersion, setProfileVersion] = useState(0);
  const projectId = project?.id;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    listCharacters(projectId)
      .then((list) => {
        if (cancelled) return;
        setAssets(list);
        setSelectedId(list[0]?.id ?? null);
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
  }, [projectId, revision]);

  const refresh = useCallback(async () => {
    if (projectId) setAssets(await listCharacters(projectId));
  }, [projectId]);
  const selected = assets.find((asset) => asset.id === selectedId) ?? null;

  const select = async (id: number | null) => {
    if (saving || id === selectedId) return;
    if (
      dirty &&
      !(await confirm({
        title: "离开当前角色？",
        description: "尚未保存的角色设定会丢失。",
        confirmText: "放弃修改",
      }))
    )
      return;
    setSelectedId(id);
    setDirty(false);
    setError("");
  };

  const save = async (profile: CharacterProfile) => {
    if (!projectId) return;
    setSaving(true);
    setError("");
    try {
      const saved = await saveCharacter(projectId, profile, selected);
      setAssets((current) =>
        selected
          ? current.map((asset) => (asset.id === saved.id ? saved : asset))
          : [saved, ...current],
      );
      setSelectedId(saved.id);
      setProfileVersion((value) => value + 1);
      setDirty(false);
      toast.success(selected ? "角色设定已保存" : "角色已创建，接下来生成形象");
    } catch (cause) {
      setError(getApiErrorMessage(cause));
      throw cause;
    } finally {
      setSaving(false);
    }
  };

  if (!project)
    return (
      <p role="alert" className="py-10 text-muted-foreground">
        无法加载项目，请返回项目列表重试。
      </p>
    );
  const properties = readProperties(project.properties);
  const projectStyle =
    typeof properties.visualStyle === "string"
      ? properties.visualStyle
      : "电影写实";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-widest text-muted-foreground">
            映构 / {project.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">角色创作</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            先认识你的角色，再让故事发生。
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${project.id}/storyboards`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Film />
            前往分镜
          </Link>
          <Button
            onClick={() => void select(null)}
            disabled={saving || selectedId === null}
          >
            <Plus />
            新建角色
          </Button>
        </div>
      </header>
      <ol
        className="flex flex-wrap gap-4 border-b border-border/20 pb-4 text-sm text-muted-foreground"
        aria-label="创作流程"
      >
        <li className="flex items-center gap-2 text-foreground">
          <UserRound className="size-4" />
          1. 设定角色
        </li>
        <li className="flex items-center gap-2">
          <ImagePlus className="size-4" />
          2. 生成并确认形象
        </li>
        <li className="flex items-center gap-2">
          <Film className="size-4" />
          3. 分镜与视频
        </li>
      </ol>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-sm text-destructive"
        >
          <p>{error}</p>
          {assets.length === 0 && (
            <Button
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              重新加载
            </Button>
          )}
        </div>
      )}
      {loading ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-20"
        >
          <Loader2 className="size-5 animate-spin" />
          加载角色…
        </p>
      ) : (
        <div className="grid items-start gap-6 2xl:grid-cols-[200px_minmax(0,1fr)]">
          <CharacterList
            assets={assets}
            selectedId={selectedId}
            search={search}
            onSearch={setSearch}
            onSelect={(id) => void select(id)}
          />
          <div className="min-w-0 space-y-5">
            {selected?.coverUrl && (
              <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 p-4">
                <SafeImage
                  src={resolveMediaUrl(selected.coverUrl) ?? undefined}
                  alt={`${selected.name}已确认的形象`}
                  className="size-16 rounded-lg object-cover"
                />
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Check className="size-4 text-primary" />
                    {selected.name}的形象已确认
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    图片已保存在项目资产中，可在分镜的角色关联中选择。
                  </p>
                </div>
              </div>
            )}
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <CharacterForm
                key={selected?.id ?? "new"}
                asset={selected}
                projectStyle={projectStyle}
                saving={saving}
                onSave={save}
                onDirtyChange={setDirty}
              />
              {selected ? (
                <CharacterImageStudio
                  key={`${selected.id}-${profileVersion}`}
                  asset={selected}
                  dirty={dirty}
                  onConfirmed={refresh}
                />
              ) : (
                <section className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/40 p-6 text-center">
                  <UserRound className="size-12 text-muted-foreground/50" />
                  <h2 className="text-lg font-medium">
                    一个好角色，是故事的开始
                  </h2>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    写下名字和外貌，保存角色设定后，就可以在这里生成、比较并确认角色图片。
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
