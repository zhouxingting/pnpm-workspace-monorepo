"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Interceptor = /** @class */ (function () {
    function Interceptor() {
        this.handlers = [];
    }
    Interceptor.prototype.use = function (onFulfilled, onRejected) {
        this.handlers.push({ onFulfilled: onFulfilled, onRejected: onRejected });
        return this.handlers.length - 1;
    };
    Interceptor.prototype.eject = function (id) {
        if (this.handlers[id]) {
            this.handlers[id] = null;
        }
    };
    return Interceptor;
}());
exports.default = Interceptor;
