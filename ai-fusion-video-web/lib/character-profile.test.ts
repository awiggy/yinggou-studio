import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCharacterPrompt,
  profileFromAsset,
  profileProperties,
  readProperties,
} from "./character-profile";

test("reads REST JSON metadata and rejects malformed or non-object data", () => {
  assert.deepEqual(readProperties('{"appearance":"黑色短发"}'), {
    appearance: "黑色短发",
  });
  assert.throws(() => readProperties("{bad"));
  assert.throws(() => readProperties("[]"));
  assert.throws(() => readProperties("null"));
});

test("saving a profile retains existing selected image and unrelated metadata", () => {
  const profile = {
    ...profileFromAsset(null),
    name: "林川",
    appearance: "黑色短发",
    description: "摄影师",
  };
  const result = profileProperties(
    profile,
    '{"selectedImageItemId":42,"relationship":"朋友"}',
  );
  assert.equal(result.selectedImageItemId, 42);
  assert.equal(result.relationship, "朋友");
  assert.equal(result.appearance, "黑色短发");
  assert.equal(result.setting, "摄影师");
  assert.equal("name" in result, false);
});

test("three-view character prompt includes all visible profile details and consistent views", () => {
  const prompt = buildCharacterPrompt({
    ...profileFromAsset(null, "国风插画"),
    name: "林川",
    gender: "male",
    age: "25岁",
    clothing: "白色风衣",
    appearance: "黑色短发",
    framing: "三视图",
  });
  for (const phrase of [
    "林川",
    "国风插画",
    "男性",
    "25岁",
    "白色风衣",
    "黑色短发",
    "正面、侧面、背面",
    "保持",
  ])
    assert.ok(prompt.includes(phrase));
  assert.ok(!prompt.includes("undefined"));
});
