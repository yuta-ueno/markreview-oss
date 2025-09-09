#!/usr/bin/env node
// Extracts the CHANGELOG section for a given version (e.g., 0.2.1)
// Usage: node .github/scripts/extract-changelog.cjs 0.2.1
const fs = require('fs')
const path = require('path')

const ver = process.argv[2]
if (!ver) {
  console.error('Usage: extract-changelog.cjs <version> (e.g., 0.2.1)')
  process.exit(1)
}

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
const text = fs.readFileSync(changelogPath, 'utf8')
const lines = text.split('\n')

const headerPrefix = `## ${ver} (`
let start = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(headerPrefix)) { start = i; break }
}
if (start === -1) {
  console.error(`Version ${ver} not found in CHANGELOG.md`)
  process.exit(2)
}

let end = lines.length
for (let j = start + 1; j < lines.length; j++) {
  if (lines[j].startsWith('## ')) { end = j; break }
}

const section = lines.slice(start, end).join('\n').trim()
console.log(section)

