// Entry for make.fun's "bounty-entrants-03" (Bring the most entrants to
// the bounties you make on make.fun).
//
// The entry names the make.fun bounty this account sponsors —
// "Pump.fun Paper Sprint: Any Bot Can Win" — in BOUNTY.json. The program
// reads that file, validates every named bounty address, and writes a
// small deterministic report to the output directory. The competition's
// scorer reads the named bounties' counted entrants from make.fun's own
// records; this program's job is to present them cleanly and run to a
// successful exit inside the grader's sandbox (no network, read-only
// repo, writable output dir).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface BountyFile {
  bounties: string[];
}

function botDir(): string {
  const fromEnv = process.env.MAKEFUN_BOT_DIR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return dirname(fileURLToPath(import.meta.url));
}

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return join(botDir(), "output");
}

function isBountyAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // A make.fun bounty address: the full page URL, a /c/ address, a bare
  // slug, or a competition id. We only ever write full page URLs, but the
  // validator accepts every form the check reads. Surrounding whitespace
  // is ignored so a hand-edited BOUNTY.json still validates.
  const v = value.trim();
  return (
    v.startsWith("https://make.fun/bounty/") ||
    v.startsWith("https://make.fun/c/") ||
    /^[a-z0-9][a-z0-9-]*$/.test(v) ||
    /^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(v)
  );
}

type AddressKind = "page" | "c" | "slug" | "id";

function addressKind(address: string): AddressKind {
  const v = address.trim();
  if (v.startsWith("https://make.fun/bounty/")) return "page";
  if (v.startsWith("https://make.fun/c/")) return "c";
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(v)) return "id";
  return "slug";
}

function main(): void {
  const root = botDir();
  const raw = readFileSync(join(root, "BOUNTY.json"), "utf8");
  const parsed = JSON.parse(raw) as Partial<BountyFile>;

  if (!parsed || !Array.isArray(parsed.bounties)) {
    throw new Error("BOUNTY.json must hold a \"bounties\" list");
  }
  const bounties = parsed.bounties.filter(isBountyAddress);
  if (bounties.length !== parsed.bounties.length) {
    throw new Error("BOUNTY.json names something that is not a bounty address");
  }
  if (bounties.length === 0) {
    throw new Error("BOUNTY.json names no bounties");
  }

  // Read each bounty once, in file order, with whitespace normalized so
  // the same bounty written two ways still dedupes to one.
  const seen = new Set<string>();
  const named: string[] = [];
  for (const address of bounties) {
    const v = address.trim();
    if (seen.has(v)) continue;
    seen.add(v);
    named.push(v);
  }

  const report = {
    competition: "bounty-entrants-03",
    bounties: named,
    kinds: named.map(addressKind),
    bounty_count: named.length,
  };

  const out = outputDir();
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "result.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`bounty-entrants-03 entry: ${named.length} sponsored bounty named`);
}

main();
