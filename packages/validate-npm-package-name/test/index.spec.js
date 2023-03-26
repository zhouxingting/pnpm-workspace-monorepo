import validate from "../lib/index";
import { describe, test, expect } from "vitest";

describe("validate-npm-package-name-zxt", () => {
  test("normal package name", () => {
    expect(validate("some-package")).toEqual({
      validForNewPackages: true,
      validForOldPackages: true,
    });
  });

  test("node package name", () => {
    expect(validate("http")).toEqual({
      validForNewPackages: false,
      validForOldPackages: true,
      warnings: ["不能是node核心模块"],
    });
  });
});
