#!/usr/bin/env node

import { runCli } from '../skills/sp-pachong-seo-wenzhang-caiji/scripts/pachong-seo.mjs';

runCli().catch((error) => {
  console.error(JSON.stringify({ error: String(error), stack: error?.stack || null }));
  process.exitCode = 1;
});
