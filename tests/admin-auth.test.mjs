import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const uid = "731d36d2-fa78-47d8-a050-7507c17b5733";
function load(relativePath, mocks) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loadedModule = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports,
    require(name) {
      if (name === "server-only") return {};
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return loadedModule.exports;
}
function fixture(options = {}) {
  const state = { queries: 0, identities: 0, permitted: true, ...options };
  const client = {
    auth: { async getUser() {
      state.identities++;
      if (state.authThrows) throw new Error("Sensitive provider details");
      return { data: { user: state.user === undefined ? { id: uid } : state.user }, error: state.authError ?? null };
    } },
    from(table) {
      state.queries++; assert.equal(table, "portfolio_admins");
      return { select(fields) {
        assert.equal(fields, "user_id");
        return { eq(field, value) {
          assert.equal(field, "user_id"); assert.equal(value, uid);
          return { async maybeSingle() {
            if (state.dbThrows) throw new Error("Private database details");
            return { data: state.permitted ? { user_id: state.rowId ?? uid } : null, error: state.dbError ?? null };
          } };
        } };
      } };
    },
  };
  const auth = load("../app/_lib/auth.ts", { "@/lib/supabase/server": { createClient: async () => client } });
  return { state, auth };
}
async function denied(auth, status) {
  await assert.rejects(auth.requireAdmin(), error => error instanceof auth.AdminAccessError && error.status === status && !error.message.includes("Private"));
}

test("signed-out requests fail before any permission query", async () => {
  const { state, auth } = fixture({ user: null }); await denied(auth,401); assert.equal(state.queries,0);
});
test("invalid tokens cannot reach permission queries", async () => {
  const { state, auth } = fixture({ authError: { status: 401 } }); await denied(auth,401); assert.equal(state.queries,0);
});
test("anonymous Auth users are not administrators", async () => {
  const { state, auth } = fixture({ user: { id: uid, is_anonymous: true } }); await denied(auth,401); assert.equal(state.queries,0);
});
test("a user cannot self-promote through user_metadata", async () => {
  const { auth } = fixture({ user: { id: uid, user_metadata: { role: "admin" } }, permitted: false }); await denied(auth,403);
});
test("a different user's permission is rejected", async () => {
  const { auth } = fixture({ rowId: "someone-else" }); await denied(auth,403);
});
test("verified identity and matching permission allow access", async () => {
  const { auth } = fixture(); const result = await auth.requireAdmin(); assert.equal(result.id,uid); assert.deepEqual(Object.keys(result),["id"]);
});
test("revoked permission is checked on the next operation", async () => {
  const { state, auth } = fixture(); await auth.requireAdmin(); state.permitted = false; await denied(auth,403); assert.equal(state.identities,2);assert.equal(state.queries,2);
});
test("missing table or database error fails closed", async () => {
  const { auth } = fixture({ dbError: { code: "42P01", message: "Private table details" } }); await denied(auth,503);
});
test("Auth outages are not treated as valid sessions", async () => {
  const { auth } = fixture({ authError: { status: 503 } }); await denied(auth,503);
});
test("network exceptions return no provider details", async () => {
  for (const options of [{ authThrows: true }, { dbThrows: true }]) { const { auth } = fixture(options); await denied(auth,503); }
});
test("the private API rejects denied access before reading projects", async () => {
  for (const status of [401,403,503]) {
    const route = load("../app/api/admin/projects/route.ts", {
      "@/app/_lib/http": {},
      "@/app/_lib/portfolio-validation": {},
      "@/app/_lib/portfolio-types": {},
      "@/app/_lib/portfolio-api": {
        adminClient: async () => { throw {status}; },
        failure: error => Response.json({error:"ACCESS_DENIED"},{status:error.status,headers:{"Cache-Control":"no-store"}}),
      },
    });
    const res = await route.GET(new Request("http://localhost:3000/api/admin/projects"));
    assert.equal(res.status,status); assert.equal(res.headers.get("cache-control"),"no-store");
  }
});
