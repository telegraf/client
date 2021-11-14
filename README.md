# `@telegraf/client`

Small library for performing [Telegram Bot API] calls.

```js
const { File } = require("formdata-node");
const { Client } = require("@telegraf/client");

const document = new File(["42"], "answer.txt");
const client = new Client(process.env.BOT_TOKEN);

await client.call("sendDocument", { chat_id, document });
```

[Telegram Bot API]: https://core.telegram.org/bots/api
