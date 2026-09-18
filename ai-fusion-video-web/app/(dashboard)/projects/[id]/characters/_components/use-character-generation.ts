"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generationApi,
  type ImageGenerationTask,
  type ImageGenerationItem,
  type ImageGenerationSubmitReq,
} from "@/lib/api/generation";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { characterCategory } from "@/lib/character-profile";

export interface CharacterGenerationEntry {
  task: ImageGenerationTask;
  items: ImageGenerationItem[];
}

export function useCharacterGeneration(projectId: number, assetId: number) {
  const [entries, setEntries] = useState<CharacterGenerationEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(12);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const page = await generationApi.pageImageTasks(1, limit, {
          projectId,
          category: characterCategory(assetId),
        });
        const next = await Promise.all(
          page.list.map(async (task) => ({
            task,
            items: await generationApi.listImageItems(task.id),
          })),
        );
        if (cancelled) return;
        setEntries(next);
        setTotal(page.total);
        setError("");
        if (page.list.some((task) => task.status === 0 || task.status === 1)) {
          timer = setTimeout(() => void load(), 4000);
        }
      } catch (cause) {
        if (!cancelled) setError(getApiErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId, assetId, limit, revision]);

  const submit = async (
    request: Omit<ImageGenerationSubmitReq, "projectId" | "category">,
  ) => {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      await generationApi.submitImage({
        ...request,
        projectId,
        category: characterCategory(assetId),
      });
      setLoading(true);
      reload();
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return {
    entries,
    total,
    loading,
    error,
    submitting,
    submit,
    reload,
    loadMore: () => setLimit((value) => value + 12),
    active: entries.some(({ task }) => task.status === 0 || task.status === 1),
  };
}
