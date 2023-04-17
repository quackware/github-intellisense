#!/usr/bin/env -S deno run -A --no-check --no-config

import { serve } from "https://deno.land/std@0.183.0/http/mod.ts";
import { QuackError } from "./deps.ts";
import Index from "./index.json" assert { type: "json" };
import { createApi } from "./src/api.ts";

async function main() {
  const api = createApi(Index);
  return await serve(api.fetch, {
    port: Number(Deno.env.get("PORT") ?? 8081),
    onListen(params) {
      console.log(`Listening on ${params.hostname}:${params.port}`);
    },
    onError(error) {
      const err = QuackError.fromUnknown(error);
      console.error(err);
      return new Response(null, { status: 500 });
    },
  });
}

main().catch(console.error);
