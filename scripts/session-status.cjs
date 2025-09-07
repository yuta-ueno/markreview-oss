// Session status summary script
// Usage: node scripts/session-status.cjs [--health] [--verify]
// - Prints repo/working tree summary for quick context on resume
// - Optional: --health runs typecheck + tests (short)

 
const { execSync, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const run = (cmd, opts = {}) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim()
  } catch (e) {
    return ''
  }
}

const cwd = process.cwd()
const args = new Set(process.argv.slice(2))
const isHealth = args.has('--health')
const isVerify = args.has('--verify')

const now = new Date().toISOString()
const branch = run('git branch --show-current') || '(no branch)'
const lastCommits = run('git log --oneline -n 8')
const statusShort = run('git status -s')
const lastTag = run('git describe --tags --abbrev=0 2> NUL || git describe --tags --abbrev=0 2> /dev/null')
const diffSinceTag = lastTag ? run(`git diff --name-only ${lastTag}..HEAD`) : ''

const pkgPath = path.join(cwd, 'package.json')
let pkg = { name: '', version: '' }
try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) } catch {}

const categorize = (files) => {
  const groups = {
    components: [],
    hooks: [],
    styles: [],
    tauri: [],
    config: [],
    tests: [],
    other: [],
  }
  files.forEach((f) => {
    if (f.startsWith('src/components/')) groups.components.push(f)
    else if (f.startsWith('src/hooks/')) groups.hooks.push(f)
    else if (f.startsWith('src/styles/')) groups.styles.push(f)
    else if (f.startsWith('src-tauri/')) groups.tauri.push(f)
    else if (f.includes('__tests__') || /\.test\.[jt]sx?$/.test(f)) groups.tests.push(f)
    else if (/^vite\.config|^vitest\.config|eslint|tsconfig|^public\//.test(f)) groups.config.push(f)
    else groups.other.push(f)
  })
  return groups
}

const parseStatusLines = (text) => (
  text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => ({ code: l.slice(0, 2).trim(), file: l.slice(3).trim() }))
)

const statusEntries = parseStatusLines(statusShort)
const modified = statusEntries.filter((e) => /M|A|D|R|C|U/.test(e.code)).map((e) => e.file)
const untracked = statusEntries.filter((e) => e.code === '??').map((e) => e.file)

const groups = categorize(modified)

// TODO/NOTE scan via ripgrep if available
let todos = ''
const rg = spawnSync('rg', ['-n', 'TODO|FIXME|HACK|@todo', '-S'], { encoding: 'utf8' })
if (rg.status === 0 && rg.stdout) {
  todos = rg.stdout.trim()
}

const header = (t) => console.log(`\n=== ${t} ===`)

console.log(`${pkg.name || 'App'} v${pkg.version || '?'} — ${now}`)
header('Git')
console.log(`Branch: ${branch}`)
if (lastTag) console.log(`Last tag: ${lastTag}`)
console.log('\nRecent commits:')
console.log(lastCommits || '(none)')

header('Working Tree')
console.log(`Changed: ${modified.length}, Untracked: ${untracked.length}`)
if (modified.length) console.log(modified.map((f) => ` - ${f}`).join('\n'))
if (untracked.length) console.log(untracked.map((f) => ` ? ${f}`).join('\n'))

header('Changes By Area')
const areaLine = (name, arr) => console.log(`${name}: ${arr.length}`)
areaLine('components', groups.components)
areaLine('hooks', groups.hooks)
areaLine('styles', groups.styles)
areaLine('tauri', groups.tauri)
areaLine('config', groups.config)
areaLine('tests', groups.tests)

header('Since Last Tag')
console.log(diffSinceTag ? diffSinceTag : '(no tag or no changes)')

if (todos) {
  header('TODO/FIXME (top 20)')
  console.log(todos.split(/\r?\n/).slice(0, 20).join('\n'))
}

header('NPM Scripts (short)')
const scripts = pkg.scripts ? Object.keys(pkg.scripts) : []
console.log(scripts.filter((s) => ['dev', 'build', 'tauri:dev', 'tauri:build', 'test', 'typecheck', 'lint', 'verify:no-telemetry'].includes(s)).join(', ') || '(none)')

if (isVerify) {
  header('Verify: No Telemetry')
  try {
    execSync('npm run -s verify:no-telemetry', { stdio: 'inherit' })
  } catch {}
}

if (isHealth) {
  header('Health: Typecheck')
  try { execSync('npm run -s typecheck', { stdio: 'inherit' }) } catch {}
  header('Health: Tests (run)')
  try { execSync('npm run -s test:run', { stdio: 'inherit' }) } catch {}
}

console.log('\nTip: npm run status -- --health で簡易ヘルスチェック。\n')
