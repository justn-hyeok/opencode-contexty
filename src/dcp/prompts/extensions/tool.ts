export const RANGE_FORMAT_EXTENSION = `
THE FORMAT OF COMPRESS

Use range mode when compressing contiguous conversation spans.
The tool input is an object with topic and content fields.
topic is a short 3-5 word label for the compression batch.
content is an array of range entries, each with startId, endId, and summary.
startId and endId must be boundary IDs taken from visible conversation IDs.
Boundary IDs use the mNNNN form for raw messages and the bN form for compressed blocks.
If a summary mentions a compressed block, use the exact placeholder syntax (bN).
Treat (bN) as a reserved token and use it only for semantic references.

Examples:
- startId: "m0042", endId: "m0048"
- startId: "b1", endId: "m0102"
- summary: "Reviewed the auth flow, then expanded (b1) with the new retry policy."
`;

export const MESSAGE_FORMAT_EXTENSION = `
THE FORMAT OF COMPRESS

Use message mode when compressing individual messages one by one.
The tool input is an object with topic and content fields.
topic is a short 3-5 word label for the batch or each message summary.
content is an array of message entries, each with messageId, topic, and summary.
messageId must be the raw mNNNN value only.
Ignore XML attributes and wrapper metadata when copying the ID.

Examples:
- messageId: "m0007"
- topic: "API cleanup"
- summary: "Removed the redundant cache path and kept the retry timeout at 5s."
`;

export function getCompressToolExtension(mode: 'range' | 'message'): string {
  return mode === 'message' ? MESSAGE_FORMAT_EXTENSION : RANGE_FORMAT_EXTENSION;
}
