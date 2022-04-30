// deno-lint-ignore-file no-explicit-any
import type { ApiResponse, InputFileProxy as Typegram } from "@grammyjs/types";
import { isFileLike, StreamFile } from "./stream-file.js";
import { fetch, FormData, RequestInit } from "undici";
import createDebug from "debug";

const debug = createDebug("telegraf:client");

type TelegrafTypegram = Typegram<StreamFile>;
export type Telegram = TelegrafTypegram["Telegram"];
export type Opts = TelegrafTypegram["Opts"];

interface Api {
  readonly root: URL;
  readonly mode: "bot" | "user";
}

interface ClientOptions {
  readonly api?: Api;
}

const defaultApi: Api = {
  mode: "bot",
  root: new URL("https://api.telegram.org"),
};

function stringify(value: unknown) {
  if (typeof value === "string") return value;
  if (isFileLike(value)) return value;
  return JSON.stringify(value);
}

function serialize(payload: Record<string, any>) {
  const formData = new FormData();
  const attach = (entry: any, index: number) => {
    const result = { ...entry };
    if (isFileLike(entry.media)) {
      const id = entry.type + index;
      result.media = `attach://${id}`;
      formData.append(id, entry.media);
    }
    if (isFileLike(entry.thumb)) {
      const id = "thumb" + index;
      result.thumb = `attach://${id}`;
      formData.append(id, entry.thumb);
    }
    return result;
  };

  for (let [key, value] of Object.entries(payload)) {
    if (key === "media") {
      value = value.map(attach);
    }
    if (value != null) formData.append(key, stringify(value));
  }
  return formData;
}

function redactToken(error: Error): never {
  error.message = error.message.replace(
    /\/(bot|user)(\d+):[^/]+\//,
    "/$1$2:[REDACTED]/",
  );
  throw error;
}

export class Client {
  constructor(
    readonly token: string,
    private readonly options: ClientOptions = {},
  ) {}

  readonly call = async <M extends keyof Telegram>(
    method: M,
    payload: Opts[M],
    signal?: AbortSignal,
  ): Promise<ApiResponse<ReturnType<Telegram[M]>>> => {
    debug("HTTP call", method, payload);
    const body = serialize(payload);
    const api = this.options.api ?? defaultApi;
    const url = new URL(`./${api.mode}${this.token}/${method}`, api.root);
    const init: RequestInit = { body, signal, method: "post" };
    const res = await fetch(url.href, init).catch(redactToken);
    if (res.status >= 500) {
      return {
        ok: false,
        error_code: res.status,
        description: res.statusText,
      };
    }
    return await res.json() as ApiResponse<ReturnType<Telegram[M]>>;
  };
}
