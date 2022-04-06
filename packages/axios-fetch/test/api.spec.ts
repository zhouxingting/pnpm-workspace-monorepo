import axios from "../src/index";
import { test, expect, describe } from "vitest";

describe('static api', function () {
  test('should have request method helpers', function () {
    expect(typeof axios.get).toEqual('function');
    expect(typeof axios.post).toEqual('function');
  });

  test('should have promise method helpers', function () {
    var promise = axios({url: '/test'});

    expect(typeof promise.then).toEqual('function');
    expect(typeof promise.catch).toEqual('function');
  });

  test('should have defaults', function () {
    expect(typeof axios.defaults).toEqual('object');
    expect(typeof axios.defaults.headers).toEqual('object');
  });

  test('should have interceptors', function () {
    expect(typeof axios.interceptors.request).toEqual('object');
    expect(typeof axios.interceptors.response).toEqual('object');
  });

  test('should have factory method', function () {
    expect(typeof axios.create).toEqual('function');
  });

  test('should have CanceledError, CancelToken, and isCancel properties', function () {
    expect(typeof axios.CancelToken).toEqual('function');
  });
});

describe('instance api', function () {
  var instance = axios.create();

  test('should have request methods', function () {
    expect(typeof instance.get).toEqual('function');
    expect(typeof instance.post).toEqual('function');
  });

  test('should have interceptors', function () {
    expect(typeof instance.interceptors.request).toEqual('object');
    expect(typeof instance.interceptors.response).toEqual('object');
  });
});
