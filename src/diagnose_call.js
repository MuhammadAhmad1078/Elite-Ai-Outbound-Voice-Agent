#!/usr/bin/env node
/**
 * diagnose_call.js
 * ────────────────────────────────────────────────────────
 * Query Vapi's API to find out exactly why a call ended.
 *
 * Usage:
 *   node src/diagnose_call.js                  # show last 5 calls
 *   node src/diagnose_call.js <call-id>        # diagnose specific call
 * ────────────────────────────────────────────────────────
 */
require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;

if (!VAPI_API_KEY || VAPI_API_KEY === 'your_vapi_api_key_here') {
  console.error('❌  VAPI_API_KEY not set in .env');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${VAPI_API_KEY}`,
};

async function diagnoseCall(callId) {
  try {
    const { data } = await axios.get(`https://api.vapi.ai/call/${callId}`, { headers });

    console.log('\n═══════════════════════════════════════════');
    console.log('  CALL DIAGNOSIS');
    console.log('═══════════════════════════════════════════');
    console.log(`  Call ID:       ${data.id}`);
    console.log(`  Status:        ${data.status}`);
    console.log(`  Ended Reason:  ${data.endedReason || '—'}`);
    console.log(`  Type:          ${data.type}`);
    console.log(`  Started At:    ${data.startedAt || '—'}`);
    console.log(`  Ended At:      ${data.endedAt || '—'}`);
    console.log(`  Duration:      ${data.startedAt && data.endedAt
      ? Math.round((new Date(data.endedAt) - new Date(data.startedAt)) / 1000) + 's'
      : '—'}`);
    console.log(`  Cost:          ${data.cost != null ? '$' + data.cost.toFixed(4) : '—'}`);
    console.log(`  Phone #:       ${data.phoneNumber?.number || data.phoneNumber?.twilioPhoneNumber || '—'}`);
    console.log(`  Customer #:    ${data.customer?.number || '—'}`);
    console.log('───────────────────────────────────────────');

    // Show common endedReason explanations
    const reasons = {
      'assistant-error': '❌ The assistant encountered an error (check system prompt / model config)',
      'assistant-not-found': '❌ The VAPI_ASSISTANT_ID in .env does not exist',
      'customer-busy': '📞 Customer line was busy',
      'customer-did-not-answer': '📞 Customer did not answer (rang out)',
      'customer-did-not-give-microphone-permission': '🎤 WebRTC: no mic permission',
      'customer-ended-call': '📞 Customer hung up',
      'db-error': '❌ Vapi database error',
      'exceeded-max-duration': '⏱️ Call hit maxDurationSeconds limit',
      'manually-canceled': '🛑 Call was manually cancelled',
      'phone-call-provider-bypass-enabled-but-no-call-received': '❌ Twilio bypass issue — call never connected',
      'pipeline-error-deepgram-transcriber-error': '❌ Deepgram transcriber failed',
      'pipeline-error-eleven-labs-voice-error': '❌ ElevenLabs voice failed',
      'pipeline-error-openai-llm-failed': '❌ OpenAI LLM call failed',
      'pipeline-error-vapi-llm-failed': '❌ Vapi LLM pipeline failed',
      'silence-timed-out': '🔇 Silence timeout — no speech detected',
      'twilio-failed-to-connect-call': '❌ Twilio failed to connect — check Twilio trial/number verification',
      'voicemail': '📭 Voicemail detected',
    };

    if (data.endedReason) {
      const explanation = reasons[data.endedReason];
      if (explanation) {
        console.log(`\n  💡 ${explanation}`);
      }

      // Specific advice for common drop issues
      if (data.endedReason === 'twilio-failed-to-connect-call') {
        console.log('\n  🔧 FIX: Your Twilio trial can only call VERIFIED numbers.');
        console.log('     Go to: https://console.twilio.com → Phone Numbers → Verified Caller IDs');
        console.log('     Add the number you are trying to call.');
      }
      if (data.endedReason.includes('pipeline-error')) {
        console.log('\n  🔧 FIX: Check that your model/voice/transcriber API keys are valid.');
        console.log('     The assistant config may reference a provider that is not properly set up.');
      }
    }

    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`❌  Failed to fetch call ${callId}:`, msg);
  }
}

async function listRecentCalls() {
  try {
    const { data } = await axios.get('https://api.vapi.ai/call?limit=5', { headers });
    const calls = Array.isArray(data) ? data : data?.results || [];

    if (!calls.length) {
      console.log('\n  No calls found in Vapi.\n');
      return;
    }

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('  RECENT CALLS (last 5)');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  ID                                   | Status   | Ended Reason');
    console.log('  ─────────────────────────────────────────────────────────────────');

    for (const call of calls) {
      const id = call.id?.substring(0, 36) || '—';
      const status = (call.status || '—').padEnd(8);
      const reason = call.endedReason || '—';
      console.log(`  ${id} | ${status} | ${reason}`);
    }

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n  Run with a call ID for full diagnosis:');
    console.log(`  node src/diagnose_call.js ${calls[0]?.id || '<call-id>'}\n`);

    // Auto-diagnose the most recent call
    if (calls[0]?.id) {
      console.log('  Auto-diagnosing most recent call...\n');
      await diagnoseCall(calls[0].id);
    }

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('❌  Failed to list calls:', msg);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const callId = process.argv[2];

if (callId) {
  diagnoseCall(callId);
} else {
  listRecentCalls();
}
