import type { Page } from "@playwright/test";
import type { AssetWithItems } from "../lib/api/asset";
import type { Project } from "../lib/api/project";

// Test-only in-memory API. Production code always uses the Java backend.
export async function installCharacterFixture(
  page: Page,
  options: { noModels?: boolean; failedGeneration?: boolean } = {},
) {
  const now = "2026-09-19T08:00:00";
  const state = {
    projects: [] as Project[],
    assets: [] as AssetWithItems[],
    submissions: [] as Record<string, unknown>[],
    generated: false,
    failCoverOnce: false,
    itemCreates: 0,
    historyFilters: [] as string[],
  };
  await page
    .context()
    .addCookies([
      {
        name: "auth-token",
        value: "fixture-token",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
  await page.addInitScript(() => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: "fixture-token",
          refreshToken: "fixture-refresh",
          user: {
            id: 7,
            username: "creator",
            nickname: "创作者",
            roles: ["admin"],
          },
        },
        version: 0,
      }),
    );
    localStorage.setItem("theme", "dark");
  });
  const wireAsset = (asset: AssetWithItems) => ({
    ...asset,
    properties: JSON.stringify(asset.properties),
    items: asset.items.map((item) => ({
      ...item,
      properties: JSON.stringify(item.properties),
    })),
  });
  await page.route("**/media/character-test.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#163d56"/><circle cx="300" cy="240" r="90" fill="#89dbf3"/><path d="M150 610v-160a150 150 0 0 1 300 0v160" fill="#89dbf3"/><text x="300" y="720" text-anchor="middle" font-size="28" fill="white">TEST IMAGE</text></svg>',
    }),
  );
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postDataJSON();
    const ok = (data: unknown) =>
      route.fulfill({ json: { code: 0, data, msg: "success" } });
    if (path === "/api/project/list") return ok(state.projects);
    if (path === "/api/project" && method === "POST") {
      const project = {
        id: 11,
        ...body,
        properties: JSON.parse(body.properties),
        createTime: now,
        updateTime: now,
      } as Project;
      state.projects.push(project);
      return ok(project);
    }
    if (path === "/api/project/11") return ok(state.projects[0]);
    if (path === "/api/asset/list-with-items")
      return ok(state.assets.map(wireAsset));
    if (path === "/api/asset" && method === "POST") {
      const asset = {
        id: 42 + state.assets.length,
        ...body,
        properties: JSON.parse(body.properties),
        coverUrl: null,
        items: [],
        createTime: now,
        updateTime: now,
      } as AssetWithItems;
      state.assets.push(asset);
      return ok(wireAsset(asset));
    }
    if (path.match(/^\/api\/asset\/\d+$/))
      return ok(
        wireAsset(
          state.assets.find(
            (asset) => asset.id === Number(path.split("/").pop()),
          )!,
        ),
      );
    if (path === "/api/asset" && method === "PUT") {
      if (body.coverUrl && state.failCoverOnce) {
        state.failCoverOnce = false;
        return route.fulfill({
          json: { code: 500, msg: "封面暂时保存失败，请重试" },
        });
      }
      const asset = state.assets.find((item) => item.id === body.id)!;
      Object.assign(asset, body, {
        properties: body.properties
          ? JSON.parse(body.properties)
          : asset.properties,
      });
      // Match the Java update contract: omitted fields are null in its response.
      return ok({ projectId: null, type: null, coverUrl: null, ...body });
    }
    if (path.match(/^\/api\/asset\/\d+\/items$/))
      return ok(
        state.assets
          .find((asset) => asset.id === Number(path.split("/")[3]))!
          .items.map((item) => ({
            ...item,
            properties: JSON.stringify(item.properties),
          })),
      );
    if (path === "/api/asset/item" && method === "POST") {
      state.itemCreates++;
      const item = {
        id: 101,
        ...body,
        properties: JSON.parse(body.properties),
        createTime: now,
        updateTime: now,
      };
      state.assets.find((asset) => asset.id === body.assetId)!.items.push(item);
      return ok({ ...item, properties: JSON.stringify(item.properties) });
    }
    if (path === "/api/ai/model/list-by-type" || path === "/api/ai/model/list")
      return ok(
        options.noModels
          ? []
          : [
              {
                id: 3,
                name: "验收图片模型",
                code: "fixture-image",
                modelType: 2,
                status: 1,
                defaultModel: true,
                config: JSON.stringify({
                  supportedAspectRatios: ["3:4"],
                  supportedResolutions: ["1024x1536"],
                }),
              },
            ],
      );
    if (path === "/api/ai/model/presets") return ok([]);
    if (path === "/api/generation/image/page") {
      state.historyFilters.push(url.search);
      return ok({
        total: state.generated ? 1 : 0,
        list: state.generated
          ? [
              {
                id: 50,
                taskId: "test-task",
                projectId: 11,
                prompt: state.submissions[0].prompt,
                status: options.failedGeneration ? 3 : 2,
                errorMsg: options.failedGeneration ? "模型余额不足" : null,
                createTime: now,
                updateTime: now,
              },
            ]
          : [],
      });
    }
    if (path === "/api/generation/image/submit") {
      state.submissions.push(body);
      state.generated = true;
      return ok("test-task");
    }
    if (path === "/api/generation/image/50/items")
      return ok(
        options.failedGeneration
          ? [
              {
                id: 51,
                taskId: 50,
                status: 0,
                errorMsg: "模型余额不足",
                imageUrl: null,
              },
            ]
          : [
              {
                id: 51,
                taskId: 50,
                status: 1,
                imageUrl: "/media/character-test.svg",
                thumbnailUrl: null,
              },
            ],
      );
    if (path === "/api/system/init/status")
      return ok({ initialized: true, allowRegister: false });
    if (path.startsWith("/api/system/version"))
      return ok({ currentVersion: "1.1.2", updateAvailable: false });
    if (path === "/api/ai/assistant/conversations")
      return ok({ list: [], total: 0 });
    if (path === "/api/ai/assistant/reference-options")
      return ok({ skills: [], mcpTools: [] });
    if (path === "/api/ai/pipeline/running") return ok([]);
    return route.fulfill({
      status: 404,
      json: { code: 404, msg: `Unmocked test endpoint: ${path}` },
    });
  });
  return state;
}
