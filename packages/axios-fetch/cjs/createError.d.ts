declare const createError: (message: string, config: Record<string, any>, code: number | string, response: Record<string, any>) => Error;
export default createError;
