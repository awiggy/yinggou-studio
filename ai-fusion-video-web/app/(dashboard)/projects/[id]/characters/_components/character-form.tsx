"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import type { Asset } from "@/lib/api/asset";
import {
  profileFromAsset,
  VISUAL_STYLES,
  FRAMINGS,
  type CharacterProfile,
} from "@/lib/character-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudioSelect } from "@/components/dashboard/studio-select";

interface CharacterFormProps {
  asset: Asset | null;
  projectStyle: string;
  saving: boolean;
  onSave: (profile: CharacterProfile) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}

export function CharacterForm({
  asset,
  projectStyle,
  saving,
  onSave,
  onDirtyChange,
}: CharacterFormProps) {
  const [profile, setProfile] = useState(() =>
    profileFromAsset(asset, projectStyle),
  );
  const [saved, setSaved] = useState(() => JSON.stringify(profile));
  const dirty = saved !== JSON.stringify(profile);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  const update = (key: keyof CharacterProfile, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const styles = VISUAL_STYLES.some(
    (style) => style.value === profile.visualStyle,
  )
    ? VISUAL_STYLES
    : [
        ...VISUAL_STYLES,
        { value: profile.visualStyle, label: profile.visualStyle },
      ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !profile.name.trim()) return;
    await onSave(profile);
    setSaved(JSON.stringify(profile));
  };

  return (
    <form
      onSubmit={(event) => void submit(event).catch(() => {})}
      className="rounded-xl border border-border/30 bg-card p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <UserRound className="size-4" />
            01 / 角色设定
          </p>
          <h2 className="text-xl font-semibold">
            {asset ? asset.name : "你的第一个主角，从这里开始"}
          </h2>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {asset ? (dirty ? "待保存" : "已保存") : "新角色"}
        </span>
      </div>
      <fieldset disabled={saving} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="character-name">
            角色名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="character-name"
            required
            maxLength={100}
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="例如：林川"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="character-gender">性别</Label>
            <StudioSelect
              id="character-gender"
              value={profile.gender}
              onChange={(v) => update("gender", v)}
              items={[
                { value: "unknown", label: "不限定 / 非人类" },
                { value: "male", label: "男性" },
                { value: "female", label: "女性" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="character-age">年龄</Label>
            <Input
              id="character-age"
              maxLength={100}
              value={profile.age}
              onChange={(e) => update("age", e.target.value)}
              placeholder="例如：25 岁左右"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-identity">身份 / 职业</Label>
          <Input
            id="character-identity"
            maxLength={200}
            value={profile.identity}
            onChange={(e) => update("identity", e.target.value)}
            placeholder="例如：生活在近未来城市的独立摄影师"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-appearance">外貌特征</Label>
          <Textarea
            id="character-appearance"
            rows={3}
            maxLength={3000}
            value={profile.appearance}
            onChange={(e) => update("appearance", e.target.value)}
            placeholder="脸型、五官、发型、身材，以及让人记住的细节……"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-clothing">服装与配饰</Label>
          <Textarea
            id="character-clothing"
            rows={2}
            maxLength={2000}
            value={profile.clothing}
            onChange={(e) => update("clothing", e.target.value)}
            placeholder="例如：米白色风衣、深色长裤、棕色皮靴，胸前挂着复古相机"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="character-personality">性格与气质</Label>
          <Input
            id="character-personality"
            maxLength={500}
            value={profile.personality}
            onChange={(e) => update("personality", e.target.value)}
            placeholder="例如：安静、好奇，遇到困难时很坚定"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="character-style">视觉风格</Label>
            <StudioSelect
              id="character-style"
              value={profile.visualStyle}
              items={styles}
              onChange={(v) => update("visualStyle", v)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="character-framing">形象构图</Label>
            <StudioSelect
              id="character-framing"
              value={profile.framing}
              items={FRAMINGS}
              onChange={(v) => update("framing", v)}
            />
          </div>
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">
            补充角色背景
          </summary>
          <Label htmlFor="character-description" className="sr-only">
            角色背景
          </Label>
          <Textarea
            id="character-description"
            className="mt-3"
            rows={3}
            maxLength={3000}
            value={profile.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="经历、动机、人物关系……"
          />
        </details>
        <div className="flex items-center justify-between gap-4 border-t border-border/20 pt-4">
          <p className="text-xs text-muted-foreground">
            先保存设定，再生成角色形象。
          </p>
          <Button
            type="submit"
            disabled={saving || !profile.name.trim() || (!!asset && !dirty)}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {asset ? "保存设定" : "创建角色"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
