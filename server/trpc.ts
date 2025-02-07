import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const procedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  // console.log("Session in isAuthed:", ctx.session);
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

// 角色檢查中間件
// const hasRole = (allowedRoles: string[]) =>
//   t.middleware(({ ctx, next }) => {
//     if (
//       !ctx.session?.user?.role ||
//       !allowedRoles.includes(ctx.session.user.role)
//     ) {
//       throw new TRPCError({ code: "FORBIDDEN" });
//     }
//     return next({ ctx });
//   });

export const authedProcedure = t.procedure.use(isAuthed);
// export const adminProcedure = authedProcedure.use(hasRole(["ADMIN"]));
// export const managerProcedure = authedProcedure.use(
//   hasRole(["ADMIN", "MANAGER"])
// );

// 公共程序（如登錄和註冊）可以被任何人訪問。
// authedProcedure 只能被已登錄的用戶訪問。
// managerProcedure 只能被 ADMIN 和 MANAGER 訪問。
// adminProcedure 只能被 ADMIN 訪問。
