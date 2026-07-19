import { execFileSync } from "node:child_process";

const [, , baseInput, head = "HEAD"] = process.argv;
const nonEnglish = /[^\x00-\x7F]/u;
const zeroSha = /^0+$/u;
const title = process.env.PR_TITLE ?? "";

if (title && nonEnglish.test(title)) {
  console.error("Pull request titles must use English ASCII text.");
  process.exit(1);
}

// Pull requests are squash-merged, so their English title becomes the public
// commit subject on main. Branch commits may follow a contributor's local
// language convention; the push check below still enforces English subjects
// for every commit that actually lands on main.
if (title) {
  console.log("Checked the English pull request title.");
  process.exit(0);
}

let base = baseInput;
if (!base || zeroSha.test(base)) {
  try {
    base = execFileSync("git", ["rev-parse", `${head}^`], {
      encoding: "utf8",
    }).trim();
  } catch {
    base = "";
  }
}

if (!base) process.exit(0);

const subjects = execFileSync(
  "git",
  ["log", "--format=%H%x09%s", `${base}..${head}`],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);
const invalid = subjects.filter((subject) => nonEnglish.test(subject));

if (invalid.length > 0) {
  console.error("Commit subjects must use English ASCII text:");
  for (const subject of invalid) console.error(`- ${subject}`);
  process.exit(1);
}

console.log(`Checked ${subjects.length} English commit subject(s).`);
