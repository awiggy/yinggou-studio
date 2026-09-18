"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { aiModelApi, type AiModel, type ModelPreset } from "@/lib/api/ai-model";
import type { AssetWithItems } from "@/lib/api/asset";
import type { ImageGenerationItem } from "@/lib/api/generation";
import { confirmCharacterImage } from "@/lib/api/character";
import { getApiErrorMessage } from "@/lib/api/api-error";
import {
  buildCharacterPrompt,
  profileFromAsset,
} from "@/lib/character-profile";
import { resolveGenerationCapabilities } from "@/lib/generation-capabilities";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudioSelect } from "@/components/dashboard/studio-select";
import { CharacterImageHistory } from "./character-image-history";
import { useCharacterGeneration } from "./use-character-generation";

interface CharacterImageStudioProps {
  asset: AssetWithItems;
  dirty: boolean;
  onConfirmed: () => Promise<void>;
}

export function CharacterImageStudio({
  asset,
  dirty,
  onConfirmed,
}: CharacterImageStudioProps) {
  const [models, setModels] = useState<AiModel[]>([]);
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsRevision, setModelsRevision] = useState(0);
  const [modelError, setModelError] = useState("");
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState(() =>
    buildCharacterPrompt(profileFromAsset(asset)),
  );
  const [ratioChoice, setRatioChoice] = useState("");
  const [resolutionChoice, setResolutionChoice] = useState("");
  const [selecting, setSelecting] = useState<number | null>(null);
  const selectionInFlight = useRef(false);
  const isAdmin = useAuthStore(
    (state) => state.user?.roles?.includes("admin") ?? false,
  );
  const generation = useCharacterGeneration(asset.projectId, asset.id);

  useEffect(() => {
    let cancelled = false;
    Promise.all([aiModelApi.listByType(2), aiModelApi.presets(2)])
      .then(([list, modelPresets]) => {
        if (cancelled) return;
        const available = list.filter((model) => model.status === 1);
        setModels(available);
        setPresets(modelPresets);
        setModelId(
          String(
            available.find((model) => model.defaultModel)?.id ??
              available[0]?.id ??
              "",
          ),
        );
        setModelError("");
      })
      .catch((cause) => {
        if (!cancelled) setModelError(getApiErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modelsRevision]);

  const model = models.find((candidate) => String(candidate.id) === modelId);
  const capabilities = useMemo(
    () => (model ? resolveGenerationCapabilities(model, presets) : null),
    [model, presets],
  );
  const ratios = capabilities?.supportedAspectRatios ?? [];
  const resolutions = capabilities?.supportedResolutions ?? [];
  const ratio = ratios.includes(ratioChoice) ? ratioChoice : ratios[0];
  const resolution = resolutions.includes(resolutionChoice)
    ? resolutionChoice
    : resolutions[0];
  const needsReference =
    !!capabilities &&
    (capabilities.minReferenceImages > 0 || capabilities.minImageInputs > 0);
  const disabled =
    !model ||
    modelsLoading ||
    !!modelError ||
    needsReference ||
    dirty ||
    !prompt.trim() ||
    generation.loading ||
    generation.submitting ||
    generation.active ||
    !!generation.error;

  const generate = async () => {
    if (disabled || !model) return;
    setError("");
    try {
      await generation.submit({
        modelId: model.id,
        prompt: prompt.trim(),
        count: 1,
        ratio,
        resolution,
      });
      toast.success("已提交生成，结果会保存在这个角色的生成历史中");
    } catch (cause) {
      setError(
        `${getApiErrorMessage(cause)}。如遇网络中断，请先刷新生成历史，确认是否已提交。`,
      );
      generation.reload();
    }
  };

  const selectImage = async (
    item: ImageGenerationItem,
    sourcePrompt: string,
  ) => {
    if (selectionInFlight.current) return;
    selectionInFlight.current = true;
    setSelecting(item.id);
    setError("");
    try {
      await confirmCharacterImage(asset.id, item, sourcePrompt);
      await onConfirmed();
      toast.success("角色形象已保存，可在分镜中引用");
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      selectionInFlight.current = false;
      setSelecting(null);
    }
  };

  return (
    <section className="min-w-0 space-y-5 rounded-xl border border-border/30 bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <ImagePlus className="size-4" />
            02 / 角色形象
          </p>
          <h2 className="text-xl font-semibold">把设定，变成看得见的角色</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          title="刷新生成历史"
          aria-label="刷新生成历史"
          onClick={generation.reload}
        >
          <RefreshCw />
        </Button>
      </header>
      {modelError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>模型加载失败：{modelError}</p>
          <Button
            variant="outline"
            onClick={() => setModelsRevision((value) => value + 1)}
          >
            重新加载模型
          </Button>
        </div>
      ) : !modelsLoading && models.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-border/20 bg-background/70 p-4">
          <p className="font-medium">还没有可用的图片模型</p>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "在 AI 配置中添加图片模型，设定已保存，可以稍后继续。"
              : "请联系管理员配置图片模型，角色设定已保存。"}
          </p>
          {isAdmin && (
            <Link
              href="/settings/ai-models"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings2 />
              配置图片模型
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="character-model">图片模型</Label>
            <StudioSelect
              id="character-model"
              value={modelId}
              placeholder={modelsLoading ? "正在加载模型…" : "选择图片模型"}
              disabled={modelsLoading || generation.submitting}
              onChange={setModelId}
              items={models.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="character-ratio">画面比例</Label>
              <StudioSelect
                id="character-ratio"
                value={ratio ?? null}
                items={ratios.map((value) => ({ value, label: value }))}
                onChange={setRatioChoice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="character-resolution">画面尺寸</Label>
              <StudioSelect
                id="character-resolution"
                value={resolution ?? null}
                items={resolutions.map((value) => ({ value, label: value }))}
                onChange={setResolutionChoice}
              />
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              查看和调整生成提示词
            </summary>
            <Label htmlFor="character-prompt" className="sr-only">
              生成提示词
            </Label>
            <Textarea
              id="character-prompt"
              className="mt-3"
              rows={8}
              value={prompt}
              maxLength={12000}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </details>
          {needsReference && (
            <p className="text-sm text-muted-foreground">
              这个模型需要参考图。首次创建形象请选择支持文生图的模型。
            </p>
          )}
          {dirty && (
            <p className="text-sm text-muted-foreground">
              角色设定有修改，请先保存后再生成。
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              每次生成 1 张，费用按模型服务商计费。
            </p>
            <Button
              variant="image"
              disabled={disabled}
              onClick={() => void generate()}
            >
              {generation.submitting || generation.active ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImagePlus />
              )}
              {generation.submitting
                ? "提交中…"
                : generation.active
                  ? "正在生成…"
                  : "生成角色图片"}
            </Button>
          </div>
        </div>
      )}
      {(error || generation.error) && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error || `生成历史加载失败：${generation.error}。请点击刷新重试。`}
        </p>
      )}
      {generation.loading && generation.entries.length === 0 ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          加载生成历史…
        </p>
      ) : (
        !generation.error && (
          <CharacterImageHistory
            entries={generation.entries}
            coverUrl={asset.coverUrl}
            selecting={selecting}
            onSelect={(item, sourcePrompt) =>
              void selectImage(item, sourcePrompt)
            }
          />
        )
      )}
      {generation.total > generation.entries.length && (
        <Button
          className="w-full"
          variant="ghost"
          onClick={generation.loadMore}
        >
          查看更多生成记录
        </Button>
      )}
    </section>
  );
}
