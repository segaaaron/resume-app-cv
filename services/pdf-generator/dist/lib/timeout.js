"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
/**
 * Wraps a promise with a hard deadline.
 * Rejects with `Error("Timeout: <label> after <ms>ms")` if the promise
 * does not settle within `ms` milliseconds.
 */
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms);
        promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
}
