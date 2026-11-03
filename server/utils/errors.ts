// Helpers for working with values thrown in `catch` blocks, which TypeScript
// types as `unknown`.

export const toError = (value: unknown): Error =>
  value instanceof Error
    ? value
    : new Error(typeof value === "string" ? value : JSON.stringify(value));

export const errMessage = (value: unknown): string => toError(value).message;

export const errName = (value: unknown): string => toError(value).name;

/** Mongo driver error code (e.g. 11000 for duplicate key), when present. */
export const errCode = (value: unknown): number | string | undefined => {
  if (value && typeof value === "object" && "code" in value) {
    return (value as { code?: number | string }).code;
  }
  return undefined;
};
