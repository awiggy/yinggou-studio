import { expect, test, type Page } from "@playwright/test";
import { installCharacterFixture } from "./character-fixture";

async function createRole(page: Page) {
  await page.goto("/studio");
  await page.getByRole("button", { name: "新建创作项目" }).click();
  await page
    .getByLabel("项目名称", { exact: true })
    .fill("城市另一端 · 验收项目");
  await page.getByLabel("一句话介绍").fill("一位摄影师与一座城市的故事");
  await page.getByRole("button", { name: "创建并设定角色" }).click();
  await expect(page).toHaveURL(/\/projects\/11\/characters$/);
  await page.getByLabel("角色名称", { exact: false }).fill("林川");
  await page.getByLabel("外貌特征").fill("黑色短发，身形修长，右眉有一颗小痣");
  await page
    .getByLabel("服装与配饰")
    .fill("米白色风衣，棕色皮靴，挂着一台复古相机");
  await page.getByRole("button", { name: "创建角色", exact: true }).click();
  await expect(page.getByRole("button", { name: "保存设定" })).toBeDisabled();
}

test("create project and character, generate, confirm and recover after reload", async ({
  page,
}, testInfo) => {
  const state = await installCharacterFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: /你的故事/, level: 1 }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("studio.png"),
    fullPage: true,
    animations: "disabled",
  });
  await createRole(page);
  await page.getByLabel("性格与气质").fill("坚定而好奇");
  await page.getByRole("button", { name: "保存设定" }).click();
  await expect(
    page.getByRole("button", { name: "生成角色图片" }),
  ).toBeEnabled();
  await page
    .getByRole("heading", { name: "角色创作", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("character-editor.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "生成角色图片" }).click();
  await page.getByRole("button", { name: "设为角色形象" }).click();
  await expect(page.getByText("林川的形象已确认")).toBeVisible();
  expect(state.submissions).toHaveLength(1);
  expect(state.submissions[0]).toMatchObject({
    projectId: 11,
    category: "yinggou-character:42",
    modelId: 3,
    count: 1,
  });
  expect(state.submissions[0].prompt).toContain("米白色风衣");
  expect(
    state.historyFilters.every(
      (query) =>
        query.includes("projectId=11") &&
        query.includes("category=yinggou-character%3A42"),
    ),
  ).toBeTruthy();
  expect(state.assets[0].items).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel("外貌特征")).toHaveValue(
    "黑色短发，身形修长，右眉有一颗小痣",
  );
  await expect(page.getByText("林川的形象已确认")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "当前角色形象" }),
  ).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath("character-confirmed.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("missing model preserves editable character and gives configuration entry", async ({
  page,
}) => {
  const state = await installCharacterFixture(page, { noModels: true });
  await createRole(page);
  await expect(page.getByText("还没有可用的图片模型")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "配置图片模型" }),
  ).toHaveAttribute("href", "/settings/ai-models");
  await page.getByLabel("性格与气质").fill("沉稳而好奇");
  await page.getByRole("button", { name: "保存设定" }).click();
  await page.reload();
  await expect(page.getByLabel("性格与气质")).toHaveValue("沉稳而好奇");
  expect(state.submissions).toHaveLength(0);
});

test("failed generation explains error without selecting an invalid image", async ({
  page,
}) => {
  await installCharacterFixture(page, { failedGeneration: true });
  await createRole(page);
  await page.getByRole("button", { name: "生成角色图片" }).click();
  await expect(page.getByText("模型余额不足").first()).toBeVisible();
  await expect(page.getByText("正在绘制角色形象…")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "设为角色形象" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "生成角色图片" }),
  ).toBeEnabled();
});

test("retrying a partial image save does not duplicate the asset item", async ({
  page,
}) => {
  const state = await installCharacterFixture(page);
  await createRole(page);
  state.failCoverOnce = true;
  await page.getByRole("button", { name: "生成角色图片" }).click();
  await page.getByRole("button", { name: "设为角色形象" }).click();
  await expect(page.getByText("封面暂时保存失败，请重试")).toBeVisible();
  await page.getByRole("button", { name: "设为角色形象" }).click();
  await expect(page.getByText("林川的形象已确认")).toBeVisible();
  expect(state.itemCreates).toBe(1);
  expect(state.assets[0].items).toHaveLength(1);
});

test("unsaved character changes block generation and require discard confirmation", async ({
  page,
}) => {
  await installCharacterFixture(page);
  await createRole(page);
  await page.getByLabel("外貌特征").fill("尚未保存的修改");
  await expect(
    page.getByRole("button", { name: "生成角色图片" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "新建角色", exact: true }).click();
  await expect(page.getByText("尚未保存的角色设定会丢失。")).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByLabel("外貌特征")).toHaveValue("尚未保存的修改");
});

test("login page shows own brand and keeps the form within viewport", async ({
  page,
}, testInfo) => {
  await page.route("**/api/system/init/status", (route) =>
    route.fulfill({
      json: { code: 0, data: { initialized: true, allowRegister: false } },
    }),
  );
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "欢迎回来" })).toBeVisible();
  await expect(page.getByPlaceholder("用户名")).toBeVisible();
  await expect(page.getByRole("img", { name: "映构" })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("login.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
