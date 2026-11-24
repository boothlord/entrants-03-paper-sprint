// bounty-entrants-03 entry program.
//
// The whole contract for this bounty is one move: copy BOUNTY.json from
// the repository into the output directory, byte for byte. The house
// writes its own counts of the named bounties to
// /output/bounty.counts.json after the runs and scores the pair of
// files; nothing the program invents about the bounties counts for
// anything, so this program copies and otherwise stays out of the way.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function botDir(): string {
  // The harness sets MAKEFUN_BOT_DIR to the repository it runs; when it
  // is unset (a local run) the repository is this file's own directory.
  return process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
}

function outputDir(): string {
  // The harness sets MAKEFUN_OUTPUT_DIR to the run's /output; locally
  // the output lands in an output/ folder inside the repository.
  return process.env.MAKEFUN_OUTPUT_DIR ?? join(botDir(), "output");
}

const bytes = readFileSync(join(botDir(), "BOUNTY.json"));

// Refuse a file that is not the JSON object the bounty asks for: an
// object naming "bounties" (a list) or "url" (one bounty), never both.
const parsed: unknown = JSON.parse(bytes.toString("utf8"));
if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
  throw new Error("BOUNTY.json must be a JSON object");
}
const named = parsed as Record<string, unknown>;
const hasList = Array.isArray(named.bounties);
const hasUrl = typeof named.url === "string";
if (hasList === hasUrl) {
  throw new Error("BOUNTY.json must name bounties or url, not both and not neither");
}
if (hasList && (named.bounties as unknown[]).length === 0) {
  throw new Error("BOUNTY.json names no bounties");
}

mkdirSync(outputDir(), { recursive: true });
const target = join(outputDir(), "BOUNTY.json");
writeFileSync(target, bytes);

// Read the copy back and hold it against the source: the harness runs
// this program twice and the two runs must write the same bytes, so a
// copy that does not match the repository's file byte for byte is a
// failed run, never a quiet one.
const written = readFileSync(target);
if (!written.equals(bytes)) {
  throw new Error("the BOUNTY.json in the output does not match the repository's");
}
