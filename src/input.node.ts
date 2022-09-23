import { basename } from "node:path";
import { createReadStream } from "node:fs";
import { StreamFile } from "./stream-file.js";

/**
 * The local file specified by path will be uploaded to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromLocalFile = (path: string, filename = basename(path)) =>
  new StreamFile(() => createReadStream(path), filename);

/**
 * The buffer will be uploaded as file to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromBuffer = (buffer: Uint8Array, name: string) =>
  new File([buffer], name);

/**
 * Contents of the stream will be uploaded as file to Telegram using multipart/form-data.
 *
 * 10 MB max size for photos, 50 MB for other files.
 */
export const fromReadableStream = (
  stream: AsyncIterable<Uint8Array>,
  filename: string,
) => new StreamFile(() => stream, filename);
