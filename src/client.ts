// deno-lint-ignore-file no-explicit-any
import type { ApiResponse, Typegram } from "typegram";
import { isFileLike, StreamFile } from "./stream-file.js";
import createDebug from "debug";

const debug = createDebug("telegraf:client");

export type TelegrafTypegram = Typegram<InputFile>;
export type Telegram = TelegrafTypegram["Telegram"];

export type InputFile = Blob | StreamFile;
export type TelegramP = TelegrafTypegram["TelegramP"];
export type Opts = TelegrafTypegram["Opts"];
export type Ret = {
  [M in keyof Opts]: ReturnType<Telegram[M]>;
};

interface Api {
  readonly root: URL;
  readonly mode: "bot" | "user";
}

export interface ClientOptions {
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

export interface Invocation<M extends keyof Opts> {
  method: M;
  payload: Opts[M];
  signal?: AbortSignal;
}

export class Client {
  readonly options: Required<ClientOptions>;

  constructor(
    readonly token: string,
    options: ClientOptions = {},
  ) {
    this.options = { api: options.api || defaultApi };
  }

  async call<M extends keyof Telegram>(
    { method, payload, signal }: Invocation<M>,
  ): Promise<ApiResponse<Ret[M]>> {
    debug("HTTP call", method, payload);
    const body = serialize(payload);
    const api = this.options.api;
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
    return await res.json() as ApiResponse<Ret[M]>;
  }
}
