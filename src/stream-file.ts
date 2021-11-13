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
