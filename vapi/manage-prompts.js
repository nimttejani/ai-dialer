#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { extractPrompts, reconstructConfig } = require('./prompt-manager');
const path = require('path');

const command = process.argv[2];
const configPath = process.argv[3];

if (!command || !configPath) {
    console.log('Usage:');
    console.log('  Extract prompts:   node manage-prompts.js extract <config-path>');
    console.log('  Reconstruct config: node manage-prompts.js reconstruct <referenced-config-path>');
    process.exit(1);
}

async function main() {
    const absolutePath = path.resolve(configPath);
    
    if (command === 'extract') {
        const success = await extractPrompts(absolutePath);
        if (success) {
            console.log('Successfully extracted prompts to ./prompts directory');
            console.log('Created referenced config at config.referenced.json');
        }
    } else if (command === 'reconstruct') {
        const success = await reconstructConfig(absolutePath);
        if (success) {
            console.log('Successfully reconstructed config at config.reconstructed.json');
        }
    } else {
        console.log('Invalid command. Use "extract" or "reconstruct"');
    }
}

main().catch(console.error);
