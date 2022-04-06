import { deepMerge } from "../src/index";
import { test, expect, describe } from "vitest";

describe("deepMerge", function () {
  test("should be immutable", function () {
    var a: any = {};
    var b: any = { foo: 123 };
    var c: any = { bar: 456 };

    deepMerge(a, b, c);

    expect(typeof a.foo).toEqual("undefined");
    expect(typeof a.bar).toEqual("undefined");
    expect(typeof b.bar).toEqual("undefined");
    expect(typeof c.foo).toEqual("undefined");
  });

  test("should merge recursively", function () {
    var a = { foo: { bar: 123 } };
    var b = { foo: { baz: 456 }, bar: { qux: 789 } };

    expect(deepMerge(a, b)).toEqual({
      foo: {
        bar: 123,
        baz: 456,
      },
      bar: {
        qux: 789,
      },
    });
  });

  test("should replace properties with arrays", function () {
    expect(deepMerge({}, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] });
    expect(deepMerge({ a: 2 }, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] });
    expect(deepMerge({ a: { b: 2 } }, { a: [1, 2, 3] })).toEqual({
      a: [1, 2, 3],
    });
  });

  test("should replace properties with cloned arrays", function () {
    var a = [1, 2, 3];
    var d = deepMerge({}, { a: a });

    expect(d).toEqual({ a: [1, 2, 3] });
    expect(d.a).not.toBe(a);
  });
});
