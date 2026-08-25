import assert from 'node:assert/strict';
import { chromeExecutableCandidates, findChromeExecutable } from '../skills/sp-pachong-seo-wenzhang-caiji/scripts/pachong-seo.mjs';

const simulated = {
  win32: chromeExecutableCandidates({ platform: 'win32', env: { PROGRAMFILES: 'C:\\Program Files' }, homeDir: 'C:\\Users\\tester' }),
  darwin: chromeExecutableCandidates({ platform: 'darwin', env: {}, homeDir: '/Users/tester' }),
  linux: chromeExecutableCandidates({ platform: 'linux', env: {}, homeDir: '/home/tester' }),
};

assert.ok(simulated.win32.some((candidate) => candidate.endsWith('Google\\Chrome\\Application\\chrome.exe')));
assert.ok(simulated.darwin.includes('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
assert.ok(simulated.linux.includes('/usr/bin/google-chrome'));

let browserDetected = null;
if (process.argv.includes('--require-browser')) {
  browserDetected = Boolean(await findChromeExecutable());
  assert.equal(browserDetected, true);
}

console.log(JSON.stringify({
  passed: true,
  platform: process.platform,
  arch: process.arch,
  simulated_candidate_sets: Object.fromEntries(Object.entries(simulated).map(([platform, candidates]) => [platform, candidates.length])),
  browser_auto_detection: browserDetected,
}, null, 2));
