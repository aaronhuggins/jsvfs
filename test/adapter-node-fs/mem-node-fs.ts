// deno-lint-ignore-file no-explicit-any
import "./prerequisites.ts";
import { fs as memfs, Volume } from "https://cdn.skypack.dev/memfs@v3.4.1?dts";

type Dirent = InstanceType<typeof memfs.Dirent>;
type PathLike = Parameters<typeof memfs.rmdir>[0];
type IRmdirOptions = Parameters<typeof memfs.rmdir>[1];

export type { Dirent };

if (!(globalThis as any).__memfs__) {
  const volume = Volume.fromNestedJSON({ [Deno.cwd()]: {} }, Deno.cwd());
  volume.promises.rmdir = function rmdir(
    path: PathLike,
    options?: IRmdirOptions,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cb = (error: any) => {
        if (error) return reject(error);
        return resolve();
      };
      if (typeof options === "object") {
        volume.rmdir.bind(volume)(path, options, cb);
      } else {
        volume.rmdir.bind(volume)(path, cb);
      }
    });
  };
  (globalThis as any).__memfs__ = volume;
}

export const promises: Record<keyof typeof memfs.promises, any> =
  (globalThis as any).__memfs__.promises;
