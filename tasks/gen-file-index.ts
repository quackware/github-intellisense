#!/usr/bin/env -S deno run -A --unstable --no-check --no-config

import { Index, IndexContent } from "../src/types.ts";
import { $ } from "./deps.ts";

const ROOT_DIR = $.path(new URL("../../", import.meta.url).pathname);
const OUT_FILE = $.path(new URL("../index.json", import.meta.url));

async function genFileIndex() {
  $.cd(ROOT_DIR);
  const treeData: IndexContent[] =
    await $`tree --prune -h -I __tests__ -I __test__ -I '*.code-workspace' -I LICENSE -I deno.jsonc -J`.json();
  const contents = treeData[0].contents ?? [];

  const filesByRepo = contents.reduce<Index>((acc, curr) => {
    const readmePath = ROOT_DIR.join(curr.name, "README.md");
    const documentation = readmePath.readMaybeTextSync();
    acc[curr.name] = {
      items: curr.contents ?? [],
      documentation,
    };
    return acc;
  }, {});

  await Deno.writeTextFile(OUT_FILE.toFileUrl(), JSON.stringify(filesByRepo, null, 2));
}

genFileIndex().catch(console.error);
