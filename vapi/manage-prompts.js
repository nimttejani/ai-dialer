#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { extractPrompts, reconstructConfig, getExtractedConfigPath } = require('./prompt-manager');
const path = require('path');

const command = process.argv[2];
const configPath = process.argv[3];
const baseUrl = process.argv[4];

if (!command || !configPath) {
    console.log('Usage:');
    console.log('  Extract prompts:    node manage-prompts.js extract <config-path>');
    console.log('  Reconstruct config: node manage-prompts.js reconstruct <extracted-config-path> [base-url]');
    console.log('\nExample:');
    console.log('  node manage-prompts.js reconstruct config.extracted.json https://your-domain.com');
    process.exit(1);
}

async function main() {
    const absolutePath = path.resolve(configPath);
    
    if (command === 'extract') {
        const success = await extractPrompts(absolutePath);
        if (success) {
            console.log('Successfully extracted prompts to ./prompts directory');
            console.log(`Created extracted config at ${getExtractedConfigPath(absolutePath)}`);
        }
    } else if (command === 'reconstruct') {
        const success = await reconstructConfig(absolutePath, baseUrl);
        if (success) {
            console.log('Successfully reconstructed config at config.reconstructed.json');
            if (!baseUrl) {
                console.log('Warning: No base URL provided. The serverUrl will contain an unreplaced ${BASE_URL} placeholder');
            }
        }
    } else {
        console.log('Invalid command. Use "extract" or "reconstruct"');
    }
}

main().catch(console.error);
