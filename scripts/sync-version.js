const fs = require('fs')
const path = require('path')

// Read the submodule's package.json
const submodulePath = path.join(
  __dirname,
  '..',
  'packages',
  'pastebar-app-ui',
  'package.json'
)
const submodulePackage = JSON.parse(fs.readFileSync(submodulePath, 'utf8'))

// Read the root package.json
const rootPath = path.join(__dirname, '..', 'package.json')
const rootPackage = JSON.parse(fs.readFileSync(rootPath, 'utf8'))

// Update the version in the root package.json
rootPackage.version = submodulePackage.version

// Write the updated root package.json
fs.writeFileSync(rootPath, JSON.stringify(rootPackage, null, 2))

// Sync CHANGELOG.md if it exists
const submoduleChangelogPath = path.join(
  __dirname,
  '..',
  'packages',
  'pastebar-app-ui',
  'CHANGELOG.md'
)
const rootChangelogPath = path.join(__dirname, '..', 'CHANGELOG.md')

if (fs.existsSync(submoduleChangelogPath)) {
  fs.copyFileSync(submoduleChangelogPath, rootChangelogPath)
  console.log('CHANGELOG.md synced')
}

console.log(`Version synced to ${submodulePackage.version}`)
