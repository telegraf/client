# `@telegraf/client`

Low-level library for performing [Telegram Bot API] calls.

Provides [`StreamFile`] for uploading arbitrary streams. Other objects with
compatible interface (such as `File` provided by `fetch-blob`, `undici`, or
`formdata-node`) should work as well.

```js
const { File } = require("formdata-node");
const { Client } = require("@telegraf/client");

const document = new File(["42"], "answer.txt");
const client = new Client(process.env.BOT_TOKEN);

await client.call("sendDocument", { chat_id, document });
```

[`StreamFile`]: https://github.com/telegraf/client/blob/main/src/stream-file.ts
[Telegram Bot API]: https://core.telegram.org/bots/api
