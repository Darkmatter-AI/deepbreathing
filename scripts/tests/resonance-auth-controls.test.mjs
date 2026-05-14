import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RESONANCE_COMPONENT = path.join(ROOT, "src", "components", "resonance", "Resonance.tsx");

test("resonance header uses a visible Sign up button for signed-out users", () => {
  const source = fs.readFileSync(RESONANCE_COMPONENT, "utf8");

  const signUpButtonBlock = source.match(
    /<button[\s\S]*?onClick=\{\(\) => setShowSignInSheet\(true\)\}[\s\S]*?<\/button>/
  );

  assert.ok(signUpButtonBlock, "expected to find the signed-out auth button block");
  assert.match(
    signUpButtonBlock[0],
    />\s*Sign up\s*</,
    "signed-out users should see a visible 'Sign up' button instead of an icon-only control"
  );
});

test("resonance account portrait keeps the same fixed circular button size as other header controls", () => {
  const source = fs.readFileSync(RESONANCE_COMPONENT, "utf8");
  const accountButtonBlock = source.match(
    /<button[\s\S]*?aria-label="Account menu"[\s\S]*?<\/button>/
  );

  assert.ok(accountButtonBlock, "expected to find the signed-in account menu button block");
  assert.match(
    accountButtonBlock[0],
    /className="[^"]*h-10 w-10[^"]*rounded-full/,
    "account menu button should keep a fixed 40px circular size"
  );

  assert.match(
    accountButtonBlock[0],
    /<img src=\{user\.image\} alt="" className="[^"]*h-\[calc\(100%-8px\)\] w-\[calc\(100%-8px\)\][^"]*rounded-full/,
    "avatar image should leave a 4px outline inside the fixed account button footprint"
  );
});
