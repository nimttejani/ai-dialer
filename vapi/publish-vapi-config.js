#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const VAPI_BASE_URL = 'https://api.vapi.ai';
const CONFIG_FILE = path.join(__dirname, 'vapi-config.json');

const command = process.argv[2];
if (!command || !['create', 'update'].includes(command)) {
    console.log('Usage: ./publish-vapi-config.js <command>');
    console.log('Commands:');
    console.log('  create    Create new tools and assistant');
    console.log('  update    Update existing tools and assistant');
    process.exit(1);
}

async function loadConfig() {
    try {
        const config = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(config);
    } catch {
        // If file doesn't exist or is invalid, return empty config
        return {
            toolIds: {},
            assistantId: null
        };
    }
}

async function saveConfig(config) {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function makeRequest(endpoint, method, body = null) {
    const url = `${VAPI_BASE_URL}${endpoint}`;
    console.log(`\nMaking ${method} request to ${endpoint}`);
    if (body) {
        console.log('Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.log('Error response:', JSON.stringify(responseData, null, 2));
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    console.log('Response:', JSON.stringify(responseData, null, 2));
    return responseData;
}

async function publishConfig() {
    try {
        // Load configs
        const checkAvailabilityConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'check_availability.json'), 'utf8'));
        const bookAppointmentConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'book_appointment.json'), 'utf8'));
        const assistantConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'assistant_config.json'), 'utf8'));
        
        // Load existing IDs
        const config = await loadConfig();
        
        // Variables to replace in configs
        const variables = {
            BASE_URL: process.env.AI_DIALER_URL,
            TOOL_ID_CHECK_AVAILABILITY: config.toolIds.checkAvailability || '',
            TOOL_ID_BOOK_APPOINTMENT: config.toolIds.bookAppointment || ''
        };

        // Replace variables in configs
        const processedCheckAvailability = replaceVariables(checkAvailabilityConfig, variables);
        const processedBookAppointment = replaceVariables(bookAppointmentConfig, variables);
        const processedAssistant = replaceVariables(assistantConfig, variables);
        
        console.log('\nPublishing VAPI configurations...');

        // Create/update check availability tool
        console.log('\n1. Check Availability Tool');
        if (config.toolIds.checkAvailability && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedCheckAvailability };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.checkAvailability}`, 'PATCH', updatePayload);
            config.toolIds.checkAvailability = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedCheckAvailability);
            config.toolIds.checkAvailability = response.id;
        }

        // Create/update book appointment tool
        console.log('\n2. Book Appointment Tool');
        if (config.toolIds.bookAppointment && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedBookAppointment };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.bookAppointment}`, 'PATCH', updatePayload);
            config.toolIds.bookAppointment = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedBookAppointment);
            config.toolIds.bookAppointment = response.id;
        }

        // Update tool IDs in assistant config
        processedAssistant.model.toolIds = [
            config.toolIds.checkAvailability,
            config.toolIds.bookAppointment
        ];

        // Create/update assistant
        console.log('\n3. Assistant');
        if (config.assistantId && command === 'update') {
            console.log('Updating existing assistant...');
            const response = await makeRequest(`/assistant/${config.assistantId}`, 'PATCH', processedAssistant);
            config.assistantId = response.id;
        } else if (command === 'create') {
            console.log('Creating new assistant...');
            const response = await makeRequest('/assistant', 'POST', processedAssistant);
            config.assistantId = response.id;
        }

        // Save updated config
        await saveConfig(config);
        console.log('\nConfiguration published successfully!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Helper function to replace variables in config
function replaceVariables(obj, variables) {
    const str = JSON.stringify(obj);
    const replaced = str.replace(/\${([^}]+)}/g, (match, key) => {
        return variables[key] || match;
    });
    return JSON.parse(replaced);
}

publishConfig();
