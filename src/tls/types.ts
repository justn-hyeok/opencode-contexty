export type TlsResult =  {
  success: boolean;
  command: string;
  output: string;
  summary: string;
}

export interface BunShellOutput {
  readonly stdout: Buffer;
  readonly stderr: Buffer;
  readonly exitCode: number;
  text(encoding?: BufferEncoding): string;
  json(): any;
  arrayBuffer(): ArrayBuffer;
  bytes(): Uint8Array;
  blob(): Blob;
}