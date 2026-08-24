export const FIRESTORE_TIMEOUT_MS = 8000;
export const AUTH_WRITE_TIMEOUT_MS = 5000;

export function withTimeout(promise, ms = FIRESTORE_TIMEOUT_MS, message = "Request timed out.") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "timeout";
      reject(error);
    }, ms);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    timeout,
  ]);
}
