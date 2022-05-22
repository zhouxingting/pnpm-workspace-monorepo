"use strict";
/** 只实现axios核心逻辑 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = void 0;
var createError_1 = __importDefault(require("./createError"));
var interceptor_1 = __importDefault(require("./interceptor"));
var defaultConfig = {};
/** 深度合并 */
function deepMerge() {
    var _arg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _arg[_i] = arguments[_i];
    }
    var result = {};
    var assignValue = function (value, key) {
        if (toString.call(result[key]) === "[object Object]" &&
            toString.call(value) === "[object Object]") {
            result[key] = deepMerge(result[key], value);
        }
        else if (toString.call(value) === "[object Object]") {
            result[key] = deepMerge({}, value);
        }
        else if (Array.isArray(value)) {
            result[key] = value.slice();
        }
        else {
            result[key] = value;
        }
    };
    for (var i = 0; i < arguments.length; i++) {
        /** 兼容axios中的forEach方法 */
        if (Array.isArray(arguments[i])) {
            arguments[i].forEach(function (element, index) {
                assignValue(element, index);
            });
        }
        else {
            for (var key in arguments[i]) {
                assignValue(arguments[i][key], key);
            }
        }
    }
    return result;
}
exports.deepMerge = deepMerge;
/** 将所有的key值转换为大写或者小写 */
/** 创建Axios实例, 采用闭包的方式获取default config配置 */
function createInstance(defaultConfig) {
    if (defaultConfig === void 0) { defaultConfig = {}; }
    /** 这里面需要做的几件事：
     * 1：合并config文件
     * 2：定义fetch方法
     * 3：定义get / post等方法
     * 4：定义拦截器
     * 5：定义cancel方法
     */
    redAxios.get = function (url, config) {
        return redAxios(url, deepMerge({}, config, { method: "get", data: (config || {}).data }));
    };
    redAxios.post = function (url, data, config) {
        return redAxios(url, deepMerge({}, config, { method: "post", data: data }));
    };
    redAxios.interceptors = {
        request: new interceptor_1.default(),
        response: new interceptor_1.default(),
    };
    function redAxios(url, config) {
        if (config === void 0) { config = {}; }
        if (typeof url === "string") {
            config = config || {};
            config.url = url;
        }
        else {
            config = url;
            url = config.url;
        }
        var response = { config: config };
        /** 合并配置 */
        var options = deepMerge(defaultConfig, config);
        //请求拦截
        redAxios.interceptors.request.handlers.forEach(function (handler) {
            if (handler) {
                var resultConfig = handler.onFulfilled(options);
                if (resultConfig) {
                    options = resultConfig;
                }
            }
        });
        var customHeaders = {};
        var data = options.data;
        /** 转换请求数据 */
        (options.transformRequest || []).map(function (f) {
            data = f(data, options.headers) || data;
        });
        /** 默认使用json格式 */
        if (data && toString.call(data) === "[object Object]") {
            data = JSON.stringify(data);
            customHeaders["content-type"] = "application/json";
        }
        /** 防xsrf攻击 */
        var m = typeof document !== "undefined" &&
            document.cookie.match(RegExp("(^|; )" + options.xsrfCookieName + "=([^;]*)"));
        if (m)
            customHeaders[options.xsrfHeaderName] = m[2];
        if (options.auth) {
            customHeaders.authorization = options.auth;
        }
        if (options.baseURL) {
            url = url.replace(/^(?!.*\/\/)\/?(.*)$/, options.baseURL + "/$1");
        }
        /** 处理params参数 */
        if (options.params) {
            var divider = ~url.indexOf("?") ? "&" : "?";
            var query = options.paramsSerializer
                ? options.paramsSerializer(options.params)
                : options.params instanceof URLSearchParams
                    ? options.params
                    : new URLSearchParams(options.params);
            url += divider + query;
        }
        /** 转换header的大小写 */
        var Headers = {}, mergeHeaders = deepMerge(config.headers, customHeaders);
        Object.keys(mergeHeaders).forEach(function storeLowerName(key) {
            Headers[key.toLowerCase()] = mergeHeaders[key];
        });
        /** 定义接口请求 */
        var fetchFunc = options.fetch || fetch;
        return fetchFunc(url, {
            method: options.method || "get",
            headers: deepMerge(config.headers, customHeaders),
            credentials: config.withCredentials ? "include" : "same-origin",
            signal: options.cancelToken,
            body: data,
        }).then(function (res) {
            for (var i in res) {
                if (typeof res[i] !== "function")
                    response[i] = res[i];
            }
            var ok = options.validateStatus
                ? options.validateStatus(res.status)
                : res.ok;
            if (options.responseType === "stream") {
                response.data = res.body;
                return response;
            }
            var responseType = res.headers
                .get("content-type")
                .includes("application/json")
                ? "json"
                : "text";
            return res[options.responseType || responseType]().then(function (rd) {
                response.data = rd;
                if (ok) {
                    /** 响应成功拦截 */
                    redAxios.interceptors.response.handlers.forEach(function (handler) {
                        response = (handler && handler.onFulfilled(response)) || response;
                    });
                    /** 转换数据 */
                    response.data = (options.transformResponse || []).reduce(function (pre, f) { return f(pre, options.headers) || rd; }, rd);
                    return response;
                }
                var error = Promise.reject((0, createError_1.default)("Request failed with status code" + res.status, response.config, rd.code, response));
                redAxios.interceptors.response.handlers.forEach(function (handler) {
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
        var ac = new AbortController();
        c(ac.abort.bind(ac));
        return ac.signal;
    }
    CancelToken.source = function () {
        var ac = new AbortController();
        return {
            token: ac.signal,
            cancel: ac.abort.bind(ac),
        };
    };
    redAxios.CancelToken = CancelToken;
    redAxios.defaults = defaultConfig;
    redAxios.create = createInstance;
    return redAxios;
}
exports.default = createInstance(defaultConfig);
