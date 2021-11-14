// deno-lint-ignore-file no-explicit-any
// @ts-expect-error "module": "node12" bug
import { Blob, FormData } from "formdata-node";
// @ts-expect-error "module": "node12" bug
import type { RequestInit } from "node-fetch";
import type { ApiResponse, InputFileProxy as Typegram } from "@grammyjs/types";
import type { StreamFile } from "./stream-file.js";

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

interface CallOptions {
  readonly signal?: AbortSignal;
}

const defaultApi: Api = {
  mode: "bot",
  root: new URL("https://api.telegram.org"),
};

function stringify(value: unknown) {
  if (typeof value === "string") return value;
  if (value instanceof Blob) return value;
  return JSON.stringify(value);
}

const attachTo = (formData: FormData) =>
  (entry: any, index: number) => {
    const result = { ...entry };
    if (entry.media instanceof Blob) {
      const id = entry.type + index;
      result.media = `attach://${id}`;
      formData.append(id, entry.media);
    }
    if (entry.thumb instanceof Blob) {
      const id = "thumb" + index;
      result.thumb = `attach://${id}`;
      formData.append(id, entry.thumb);
    }
    return result;
  };

function serialize(payload: Record<string, any>) {
  const formData = new FormData();
  for (let [key, value] of Object.entries(payload)) {
    if (key === "media") {
      value = value.map(attachTo(formData));
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
  readonly #token: string;

  constructor(token: string, private readonly options: ClientOptions = {}) {
    this.#token = token;
  }

  async call<M extends keyof Telegram>(
    method: M,
    payload: Opts[M],
    { signal }: CallOptions = {},
  ): Promise<ApiResponse<ReturnType<Telegram[M]>>> {
    const fetch = (await import("node-fetch")).default;
    const body = serialize(payload);
    const api = this.options.api ?? defaultApi;
    const url = new URL(`./${api.mode}${this.#token}/${method}`, api.root);
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
  }
}
