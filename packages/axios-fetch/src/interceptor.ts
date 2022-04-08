import { AxiosFetchInterceptorManager } from "./typing";

class Interceptor implements AxiosFetchInterceptorManager<any> {
  handlers = [];
  use(
    onFulfilled: (value: any) => any,
    onRejected: (error: any) => any
  ): number {
    this.handlers.push({ onFulfilled, onRejected });
    return this.handlers.length - 1;
  }
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
}

export default Interceptor;
