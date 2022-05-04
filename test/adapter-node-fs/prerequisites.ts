// deno-lint-ignore-file no-explicit-any
import { process } from "https://deno.land/std@0.137.0/node/process.ts"

(globalThis as any).process = process
