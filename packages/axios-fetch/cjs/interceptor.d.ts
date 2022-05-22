import { AxiosFetchInterceptorManager } from "./typing";
declare class Interceptor implements AxiosFetchInterceptorManager<any> {
    handlers: any[];
    use(onFulfilled: (value: any) => any, onRejected: (error: any) => any): number;
    eject(id: number): void;
}
export default Interceptor;
