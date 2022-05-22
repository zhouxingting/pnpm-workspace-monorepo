"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var enhanceError = function (error, config, code, response) {
    error.config = config;
    if (code) {
        error.code = code;
    }
    error.response = response;
    error.isCustomAxiosError = true;
    error.toJSON = function toJSON() {
        return {
            message: this.message,
            name: this.name,
            stack: this.stack,
            config: this.config,
            code: this.code,
        };
    };
    return error;
};
var createError = function (message, config, code, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, response);
};
exports.default = createError;
