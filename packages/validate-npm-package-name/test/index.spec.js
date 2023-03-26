import validate from "../lib/index";
import { describe, test, expect } from "vitest";

describe("validate-npm-package-name-zxt", () => {
  test("normal package name", () => {
    expect(validate("some-package")).toEqual({
      validForNewPackages: true,
      validForOldPackages: true,
    });
  });
});
