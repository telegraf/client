export class StreamFile {
  readonly size = NaN;
  constructor(
    readonly stream: () =>
      | AsyncIterable<Uint8Array>
      | ReadableStream<Uint8Array>,
    readonly name: string,
  ) {}
}

Object.defineProperty(StreamFile.prototype, Symbol.toStringTag, {
  value: "File",
});

// based on https://github.com/node-fetch/fetch-blob/blob/8ab587d34080de94140b54f07168451e7d0b655e/index.js#L229-L241 (MIT License)
// deno-lint-ignore no-explicit-any
export function isFileLike(value: any): value is StreamFile {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.stream === "function" &&
    typeof value.constructor === "function" &&
    value[Symbol.toStringTag] === "File"
  );
}
