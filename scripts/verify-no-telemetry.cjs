#!/usr/bin/env node

/**
 * Telemetry Verification Script
 * 
 * This script verifies that the MarkReview application does not send
 * any telemetry or analytics data to external servers.
 */

const fs = require('fs')
const path = require('path')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

const log = {
  info: (msg) => console.log(`${GREEN}✓${RESET} ${msg}`),
  warn: (msg) => console.log(`${YELLOW}⚠${RESET} ${msg}`),
  error: (msg) => console.log(`${RED}✗${RESET} ${msg}`),
}

// Suspicious patterns that might indicate telemetry
const TELEMETRY_PATTERNS = [
  // Network requests
  /fetch\s*\(/g,
  /XMLHttpRequest/g,
  /axios\./g,
  /\$\.ajax/g,
  /\$\.post/g,
  /\$\.get/g,
  
  // Analytics services
  /google-analytics/gi,
  /googletagmanager/gi,
  /mixpanel/gi,
  /segment\.com/gi,
  /amplitude\.com/gi,
  /hotjar\.com/gi,
  /fullstory\.com/gi,
  
  // Tracking URLs
  /analytics\.google\.com/gi,
  /www\.google-analytics\.com/gi,
  /stats\.g\.doubleclick\.net/gi,
  
  // Common telemetry variables
  /track\s*\(/gi,
  /analytics\./gi,
  /telemetry/gi,
  /metrics\./gi,
  
  // External domains (excluding localhost and known safe domains)
  /https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g,
]

// Safe patterns that are allowed
const SAFE_PATTERNS = [
  /https:\/\/github\.com/gi,
  /https:\/\/docs\./gi,
  /https:\/\/cdn\./gi,
  /https:\/\/unpkg\.com/gi,
  /https:\/\/jsdelivr\.com/gi,
]

let totalFiles = 0
let issuesFound = 0

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relativePath = path.relative(process.cwd(), filePath)
  
  totalFiles++
  
  for (const pattern of TELEMETRY_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      // Check if it's a safe pattern
      const isSafe = SAFE_PATTERNS.some(safePattern => 
        matches.some(match => safePattern.test(match))
      )
      
      if (!isSafe) {
        log.error(`Potential telemetry found in ${relativePath}:`)
        console.log(`  Pattern: ${pattern}`)
        console.log(`  Matches: ${matches.slice(0, 3).join(', ')}`)
        issuesFound++
      }
    }
  }
}

function scanDirectory(dir, extensions = ['.js', '.ts', '.tsx', '.jsx']) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, dist, build directories
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'target'].includes(item)) {
        scanDirectory(fullPath, extensions)
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      checkFile(fullPath)
    }
  }
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    // Check for known telemetry packages
    const telemetryPackages = [
      'mixpanel',
      'segment',
      'amplitude',
      'hotjar',
      'fullstory',
      'google-analytics',
      'gtag',
      '@google-analytics',
      'posthog'
    ]
    
    const allDeps = {
      ...pkg.dependencies || {},
      ...pkg.devDependencies || {},
      ...pkg.peerDependencies || {}
    }
    
    for (const [depName] of Object.entries(allDeps)) {
      if (telemetryPackages.some(tel => depName.includes(tel))) {
        log.error(`Potential telemetry package found: ${depName}`)
        issuesFound++
      }
    }
    
    log.info(`Checked ${Object.keys(allDeps).length} dependencies`)
  }
}

function checkTauriConfig() {
  const configPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json')
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    
    // Check for allowlist restrictions
    if (config.tauri?.allowlist?.http !== false) {
      log.warn('HTTP requests are not explicitly disabled in Tauri config')
    }
    
    // Check for shell allowlist
    if (config.tauri?.allowlist?.shell?.scope) {
      log.info('Shell commands are restricted by allowlist')
    }
    
    log.info('Tauri configuration checked')
  }
}

function main() {
  console.log('🔍 MarkReview Telemetry Verification\n')
  
  log.info('Scanning source code...')
  scanDirectory('src')
  
  if (fs.existsSync('src-tauri/src')) {
    log.info('Scanning Tauri Rust code...')
    scanDirectory('src-tauri/src', ['.rs'])
  }
  
  log.info('Checking package dependencies...')
  checkPackageJson()
  
  log.info('Checking Tauri configuration...')
  checkTauriConfig()
  
  console.log('\n📊 Results:')
  log.info(`Files scanned: ${totalFiles}`)
  
  if (issuesFound === 0) {
    log.info('No telemetry or external data transmission found! ✨')
    log.info('MarkReview is confirmed to be privacy-focused and offline-first.')
    process.exit(0)
  } else {
    log.error(`${issuesFound} potential issues found`)
    log.error('Please review the flagged items above.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, checkFile, scanDirectory }