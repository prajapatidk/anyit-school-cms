const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function collectJsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, files)
      continue
    }
    if (entry.name.endsWith('.js')) files.push(fullPath)
  }
  return files
}

const srcDir = path.join(__dirname, '../src')
const files = collectJsFiles(srcDir)

for (const file of files) {
  execSync(`node --check "${file}"`, { stdio: 'inherit' })
}

console.log(`Backend build OK (${files.length} files verified)`)
