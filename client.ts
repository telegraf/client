import { ApiResponse, Typegram } from "https://cdn.skypack.dev/typegram@3?dts";

type TelegrafTypegram = Typegram<Blob>;
export type Telegram = TelegrafTypegram["Telegram"];
export type Opts = TelegrafTypegram["Opts"];

interface Api {
  readonly root: string;
  readonly mode: "bot" | "user";
}

interface ClientOptions {
  readonly api?: Api;
}

interface CallOptions {
  readonly signal?: AbortSignal;
}

const defaultApi: Api = { mode: "bot", root: "https://api.telegram.org" };

function stringify(value: unknown) {
  if (typeof value === "string") return value;
  if (value instanceof Blob) return value;
  return JSON.stringify(value);
}

function serialize(payload: Record<string, unknown>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value != null) formData.append(key, stringify(value));
  }
  return formData;
}

function redactToken(error: Error): never {
  error.message = error.message.replace(/:[^/]+/, ":[REDACTED]");
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
    const body = serialize(payload);
    const api = this.options.api ?? defaultApi;
    const url = new URL(`/${api.mode}${this.#token}/${method}`, api.root);
    const init: RequestInit = { body, signal, method: "post" };
    const res = await fetch(url, init).catch(redactToken);
    return await res.json();
  }
}
