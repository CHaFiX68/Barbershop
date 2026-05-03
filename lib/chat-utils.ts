import "server-only";

export const MAX_MESSAGE_LEN = 2000;
export const LAST_PREVIEW_LEN = 100;

export function trimMessageBody(input: string): string {
  return input.trim().slice(0, MAX_MESSAGE_LEN);
}

export function buildPreview(body: string): string {
  return body.trim().slice(0, LAST_PREVIEW_LEN);
}
