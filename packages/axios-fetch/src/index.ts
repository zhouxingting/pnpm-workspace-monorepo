/** 只实现axios核心逻辑 */

import createError from "./createError";
import Interceptor from "./interceptor";
import { AxiosFetchStatic, AxiosResponse, Options, Headers } from "./typing";

const defaultConfig: Options = {};

/** 深度合并 */
export function deepMerge(..._arg: any[]): any {
  let result = {};
  const assignValue = (value, key) => {
    if (
      toString.call(result[key]) === "[object Object]" &&
      toString.call(value) === "[object Object]"
    ) {
      result[key] = deepMerge(result[key], value);
    } else if (toString.call(value) === "[object Object]") {
      result[key] = deepMerge({}, value);
    } else if (Array.isArray(value)) {
      result[key] = value.slice();
    } else {
      result[key] = value;
    }
  };
  for (let i = 0; i < arguments.length; i++) {
    /** 兼容axios中的forEach方法 */
    if (Array.isArray(arguments[i])) {
      arguments[i].forEach((element, index) => {
        assignValue(element, index);
      });
    } else {
      for (let key in arguments[i]) {
        assignValue(arguments[i][key], key);
      }
    }
  }
  return result;
}

/** 将所有的key值转换为大写或者小写 */

/** 创建Axios实例, 采用闭包的方式获取default config配置 */
function createInstance(defaultConfig: Options = {}): AxiosFetchStatic {
  /** 这里面需要做的几件事：
   * 1：合并config文件
   * 2：定义fetch方法
   * 3：定义get / post等方法
   * 4：定义拦截器
   * 5：定义cancel方法
   */
  redAxios.get = (url: string, config: Options) =>
    redAxios(
      url,
      deepMerge({}, config, { method: "get", data: (config || {}).data })
    );

  redAxios.post = (url: string, data: any, config: Options) =>
    redAxios(url, deepMerge({}, config, { method: "post", data: data }));

  redAxios.interceptors = {
    request: new Interceptor(),
    response: new Interceptor(),
  };

  function redAxios(url: string | Options, config: Options = {}) {
    if (typeof url === "string") {
      config = config || {};
      config.url = url;
    } else {
      config = url;
      url = config.url;
    }

    let response = { config } as AxiosResponse<any>;

    /** 合并配置 */
    let options = deepMerge(defaultConfig, config);

    //请求拦截
    redAxios.interceptors.request.handlers.forEach((handler) => {
      if (handler) {
        const resultConfig = handler.onFulfilled(options);
        if (resultConfig) {
          options = resultConfig;
        }
      }
    });

    const customHeaders: Headers = {};
    let data = options.data;

    /** 转换请求数据 */
    (options.transformRequest || []).map((f) => {
      data = f(data, options.headers) || data;
    });

    /** 默认使用json格式 */
    if (data && toString.call(data) === "[object Object]") {
      data = JSON.stringify(data);
      customHeaders["content-type"] = "application/json";
    }

    /** 防xsrf攻击 */
    const m =
      typeof document !== "undefined" &&
      document.cookie.match(
        RegExp("(^|; )" + options.xsrfCookieName + "=([^;]*)")
      );
    if (m) customHeaders[options.xsrfHeaderName] = m[2];

    if (options.auth) {
      customHeaders.authorization = options.auth;
    }

    if (options.baseURL) {
      url = url.replace(/^(?!.*\/\/)\/?(.*)$/, options.baseURL + "/$1");
    }

    /** 处理params参数 */
    if (options.params) {
      const divider = ~url.indexOf("?") ? "&" : "?";
      const query = options.paramsSerializer
        ? options.paramsSerializer(options.params)
        : options.params instanceof URLSearchParams
        ? options.params
        : new URLSearchParams(options.params);
      url += divider + query;
    }

    /** 转换header的大小写 */
    const Headers = {},
      mergeHeaders = deepMerge(config.headers, customHeaders);
    Object.keys(mergeHeaders).forEach(function storeLowerName(key) {
      Headers[key.toLowerCase()] = mergeHeaders[key];
    });

    /** 定义接口请求 */
    const fetchFunc = options.fetch || fetch;
    return fetchFunc(url, {
      method: options.method || "get",
      headers: deepMerge(config.headers, customHeaders),
      credentials: config.withCredentials ? "include" : "same-origin",
      signal: options.cancelToken,
      body: data,
    }).then((res) => {
      for (const i in res) {
        if (typeof res[i] !== "function") response[i] = res[i];
      }

      const ok = options.validateStatus
        ? options.validateStatus(res.status)
        : res.ok;

      if (options.responseType === "stream") {
        response.data = res.body;
        return response;
      }
      const responseType = res.headers
        .get("content-type")
        .includes("application/json")
        ? "json"
        : "text";

      return res[options.responseType || responseType]().then((rd) => {
        response.data = rd;

        if (ok) {
          /** 响应成功拦截 */
          redAxios.interceptors.response.handlers.forEach((handler) => {
            response = (handler && handler.onFulfilled(response)) || response;
          });

          /** 转换数据 */
          response.data = (options.transformResponse || []).reduce(
            (pre, f) => f(pre, options.headers) || rd,
            rd
          );

          return response;
        }

        const error = Promise.reject(
          createError(
            "Request failed with status code" + res.status,
            response.config,
            rd.code,
            response
          )
        );

        redAxios.interceptors.response.handlers.forEach((handler) => {
          if (handler && handler.onRejected) {
            handler.onRejected(error);
          }
        });

        return error;
      });
    });
  }

  function CancelToken(c) {
    if (typeof c !== "function") {
      throw new TypeError("executor must be a function.");
    }
    const ac = new AbortController();
    c(ac.abort.bind(ac));

    return ac.signal;
  }

  CancelToken.source = () => {
    const ac = new AbortController();
    return {
      token: ac.signal,
      cancel: ac.abort.bind(ac),
    };
  };

  redAxios.CancelToken = CancelToken as any;
  redAxios.defaults = defaultConfig;
  redAxios.create = createInstance;

  return redAxios;
}

export default createInstance(defaultConfig);
