export type Method =
  | "get"
  | "GET"
  | "delete"
  | "DELETE"
  | "head"
  | "HEAD"
  | "options"
  | "OPTIONS"
  | "post"
  | "POST"
  | "put"
  | "PUT"
  | "patch"
  | "PATCH"
  | "purge"
  | "PURGE"
  | "link"
  | "LINK"
  | "unlink"
  | "UNLINK";

export type ResponseType = "json" | "text"

export type Headers = {
  [name: string]: string;
};

export type Options = {
  url?: string;
  method?: Method;
  headers?: Headers;
  body?: FormData | string | ArrayBuffer | Blob | URLSearchParams;
  responseType?: ResponseType;
  params?: Record<string, any> | URLSearchParams;
  paramsSerializer?: (params: Options['params']) => string;
  withCredentials?: boolean;
  auth?:  {
    username: string;
    password: string;
  };
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  validateStatus?: (status: number) => boolean;
  transformRequest?: Transformer[];
  transformResponse?: Transformer[];
  baseURL?: string;
  /**
   * Custom window.fetch implementation
   */
  fetch?: typeof window.fetch;
  data?: any;
  cancelToken?: AbortSignal;
}

export type AxiosResponse<T> = {
  status: number;
  statusText: string;
  /**
   * the request configuration
   */
  config: Options;
  data: T;
  headers: Headers;
  redirect: boolean;
  url: string;
  type: ResponseType;
  body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean;
}

export interface AxiosFetchInterceptorManager<V> {
  handlers: any[];
  use(
    onFulfilled: (value: V) => V | Promise<V>,
    onRejected: (error: any) => any
  ): number;
  eject(id: number): void;
}

export interface Canceler {
  (abort: AbortController['abort']): void;
}

export interface CancelToken {
  new (c: Canceler): AbortSignal;
  source: () => {
    token: AbortSignal;
    cancel: AbortController['abort'];
  };
}

export interface AxiosFetchInstance {
  <T = any>(config: Options): Promise<AxiosResponse<T>>
  <T = any>(url: string | Options, config?: Options): Promise<AxiosResponse<T>>
  interceptors: {
    request: AxiosFetchInterceptorManager<Options>,
    response: AxiosFetchInterceptorManager<any>
  }
  CancelToken: CancelToken;
  defaults: Options;
  post<T = any>(
    url: string,
    data?: any,
    config?: Options
  ): Promise<AxiosResponse<T>>;
  get<T = any>(url: string, config?: Options): Promise<AxiosResponse<T>>;
}

export interface AxiosFetchStatic extends AxiosFetchInstance {
  create(defaultConfig?: Options): AxiosFetchInstance
}
