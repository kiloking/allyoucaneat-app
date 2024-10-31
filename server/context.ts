import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
// import db from "@/server/db";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;
  const session = await getServerSession(req, res, authOptions);
  return {
    req: opts.req,
    res: opts.res,
    session,
    // db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
