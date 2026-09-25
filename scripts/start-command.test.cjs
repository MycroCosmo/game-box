const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const commands = Array.from(manifest.scripts.start.matchAll(/"([^"]+)"/g), match => match[1]);

test('combined start uses valid named npm script syntax', () => {
  assert.deepEqual(commands, ['npm run start:frontend', 'npm run start:backend']);
});

for (const [index, target] of ['frontend', 'backend'].entries()) {
  test(`the ${target} command resolves its named npm script`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gamebox-start-'));
    try {
      fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
        private: true,
        scripts: {
          'start:frontend': 'node fixture.cjs frontend',
          'start:backend': 'node fixture.cjs backend',
        },
      }));
      fs.writeFileSync(path.join(directory, 'fixture.cjs'), 'console.log(process.argv[2]);\n');
      const [binary, ...args] = commands[index].split(' ');
      assert.equal(binary, 'npm');
      const result = spawnSync(binary, args, {
        cwd: directory, encoding: 'utf8', timeout: 10000,
        shell: process.platform === 'win32',
      });
      assert.equal(result.status, 0, result.stderr || String(result.error));
      assert.match(result.stdout, new RegExp(target));
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
}
