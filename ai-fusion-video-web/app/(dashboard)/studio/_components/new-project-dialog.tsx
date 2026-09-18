"use client";

import { useRef, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { projectApi, type Project } from "@/lib/api/project";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { VISUAL_STYLES } from "@/lib/character-profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudioSelect } from "@/components/dashboard/studio-select";

export function NewProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visualStyle, setVisualStyle] = useState("电影写实");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !name.trim()) return;
    inFlight.current = true;
    setSaving(true);
    setError("");
    try {
      const project = await projectApi.create({
        name: name.trim(),
        description: description.trim(),
        properties: JSON.stringify({
          visualStyle,
          type: "综合视频",
          aspectRatio: "16:9",
        }),
      });
      onCreated(project);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>开始一个新故事</DialogTitle>
          <DialogDescription>
            建立项目后，就可以创建你的第一个角色。
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-col gap-5"
        >
          <fieldset
            disabled={saving}
            className="min-h-0 space-y-4 overflow-y-auto"
          >
            <div className="space-y-2">
              <Label htmlFor="studio-project-name">项目名称</Label>
              <Input
                id="studio-project-name"
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：城市另一端"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studio-project-description">一句话介绍</Label>
              <Textarea
                id="studio-project-description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="你想讲述一个怎样的故事？"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studio-project-style">角色默认风格</Label>
              <StudioSelect
                id="studio-project-style"
                value={visualStyle}
                items={VISUAL_STYLES}
                onChange={setVisualStyle}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </fieldset>
          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              取消
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              创建并设定角色
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
