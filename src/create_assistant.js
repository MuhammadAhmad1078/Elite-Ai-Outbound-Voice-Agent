#!/usr/bin/env node
/**
 * create_assistant.js
 * ----------------------------------------------------------
 * One-time setup script: reads system_prompt.md + vapi_assistant_config.json,
 * creates the Vapi assistant via REST, and prints the Assistant ID.
 * 
 * Usage:
 *   node src/create_assistant.js
 * 
 * Then copy the printed VAPI_ASSISTANT_ID into your .env file.
 * ----------------------------------------------------------
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function main() {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey || apiKey === 'your_vapi_api_key_here') {
    console.error('❌  VAPI_API_KEY not set in .env');
    process.exit(1);
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('your-ngrok')) {
    console.warn('⚠️  WEBHOOK_URL not set — assistant will be created without a webhook server URL.');
    console.warn('   Set it later in the Vapi dashboard or re-run this script after setting WEBHOOK_URL in .env');
  }

  // Load system prompt
  const systemPromptPath = path.join(__dirname, '..', 'system_prompt.md');
  const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');

  // Load assistant config
  const configPath = path.join(__dirname, '..', 'vapi_assistant_config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Inject system prompt and webhook URL
  config.model.messages[0].content = systemPrompt;
  if (webhookUrl) {
    config.serverUrl = `${webhookUrl}/webhook`;
  }

  // Set custom voice ID if provided
  if (process.env.ELEVENLABS_VOICE_ID) {
    config.voice.voiceId = process.env.ELEVENLABS_VOICE_ID;
  }

  console.log('Creating Vapi assistant...');

  try {
    const response = await axios.post(
      'https://api.vapi.ai/assistant',
      config,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const assistant = response.data;
    console.log('\n✅  Assistant created successfully!');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID:   ${assistant.id}`);
    console.log('\n👉  Add this to your .env file:');
    console.log(`\n   VAPI_ASSISTANT_ID=${assistant.id}\n`);

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('❌  Failed to create assistant:', msg);
    if (err.response?.data) {
      console.error('   Details:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
