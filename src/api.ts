import type { Client, Opts, TelegramP } from "./client.js";

export const createApi = (client: Readonly<Client>): TelegramP =>
  new Proxy({}, {
    get:
      <M extends keyof Opts>(_: unknown, method: M) =>
      async (payload: Opts[M]) => {
        const result = await client.call({ method, payload: payload ?? {} });
        if (!result.ok) throw result;
        return result.result;
      },
  }) as TelegramP;
