import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

export function createContext(opts: CreateNextContextOptions) {
  return {
    req: opts.req,
    res: opts.res,
  };
}

export type Context = ReturnType<typeof createContext>;
