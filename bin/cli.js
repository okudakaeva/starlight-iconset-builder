#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { generateIconSet, generateAllSets } = require('../scripts/core-generator');

const args = process.argv.slice(2);

function printHelp() {
    console.log(`
✨ Starlight Iconset Builder (sib)

Usage:
  sib <source-dir> <output-dir> [--batch]

Arguments:
  <source-dir>   Path to a folder with .svg files (or parent folder with --batch)
  <output-dir>   Path where generated .sass files will be saved

Options:
  --batch, -b    Treat <source-dir> as a parent folder containing multiple icon set folders
  --help, -h     Show this help message

Examples:
  sib ./assets/icons/ui ./src/styles/icons
  sib ./assets/icon-sets ./src/styles/icons --batch
`);
}

if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    printHelp();
    process.exit(args.length < 2 && !args.includes('--help') && !args.includes('-h') ? 1 : 0);
}

const isBatch = args.includes('--batch') || args.includes('-b');
const positionalArgs = args.filter((arg) => !arg.startsWith('-'));

const sourceDir = path.resolve(process.cwd(), positionalArgs[0]);
const outputDir = path.resolve(process.cwd(), positionalArgs[1]);

if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory does not exist: ${sourceDir}`);
    process.exit(1);
}

try {
    if (isBatch) {
        console.log(`🌟 Generating all icon sets from: ${sourceDir}`);
        generateAllSets(sourceDir, outputDir);
    } else {
        const setName = path.basename(sourceDir);
        console.log(`🌟 Generating icon set "${setName}"...`);
        generateIconSet(sourceDir, outputDir, setName);
    }
    console.log(`✅ Done! Output saved to: ${outputDir}`);
} catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    process.exit(1);
}
