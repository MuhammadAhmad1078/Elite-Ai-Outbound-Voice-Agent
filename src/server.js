require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { insertCall, updateCall, getAllCalls, getCall } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── POST /api/call ───────────────────────────────────────────────────────────
// Trigger an outbound call via Vapi
app.post('/api/call', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'phoneNumber is required (e.g. +1XXXXXXXXXX)' });
  }

  if (!process.env.VAPI_API_KEY || process.env.VAPI_API_KEY === 'your_vapi_api_key_here') {
    return res.status(503).json({
      error: 'VAPI_API_KEY not configured. Copy .env.example to .env and fill in your keys.',
    });
  }

  const assistantId = process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    return res.status(503).json({
      error: 'VAPI_ASSISTANT_ID not set. Run: node src/create_assistant.js first.',
    });
  }

  try {
    const payload = {
      assistantId,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || undefined,
      customer: {
        number: phoneNumber.trim(),
      },
    };

    // If no Vapi phone number ID, use Twilio credentials directly
    if (!process.env.VAPI_PHONE_NUMBER_ID && process.env.TWILIO_ACCOUNT_SID) {
      payload.phoneNumber = {
        twilioAccountSid:   process.env.TWILIO_ACCOUNT_SID.trim(),
        twilioAuthToken:    process.env.TWILIO_AUTH_TOKEN.trim(),
        twilioPhoneNumber:  process.env.TWILIO_PHONE_NUMBER.trim(),
      };
    }

    const response = await axios.post(
      'https://api.vapi.ai/call/phone',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const callData = response.data;

    // Record in DB
    await insertCall({
      id: callData.id,
      phone_number: phoneNumber,
      started_at: callData.createdAt || new Date().toISOString(),
    });

    console.log(`[CALL INITIATED] id=${callData.id} to=${phoneNumber}`);
    res.json({ success: true, callId: callData.id, status: callData.status });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[CALL ERROR]', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── GET /api/calls ───────────────────────────────────────────────────────────
// Return all logged calls (newest first)
app.get('/api/calls', async (req, res) => {
  const calls = await getAllCalls();
  res.json(calls);
});

// ─── GET /api/calls/:id ───────────────────────────────────────────────────────
app.get('/api/calls/:id', async (req, res) => {
  const call = await getCall(req.params.id);
  if (!call) return res.status(404).json({ error: 'Call not found' });
  res.json(call);
});

// ─── POST /webhook ────────────────────────────────────────────────────────────
// Receives Vapi end-of-call-report and status-update events
app.post('/webhook', (req, res) => {
  const event = req.body;
  const type = event?.message?.type || event?.type;

  console.log(`[WEBHOOK] type=${type}`);

  // Acknowledge immediately so Vapi doesn't retry
  res.sendStatus(200);

  // Handle async DB operations without blocking the response
  ;(async () => {
    if (type === 'end-of-call-report') {
      const msg = event.message || event;
      const call = msg.call || {};
      const analysis = msg.analysis || {};

      const structured = analysis.structuredData || null;
      const outcome = structured?.outcome || 'UNKNOWN';

      await updateCall({
        id:            call.id,
        status:        'ended',
        outcome,
        duration_sec:  msg.durationSeconds || (call.endedAt && call.startedAt)
          ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000)
          : null,
        recording_url: msg.recordingUrl || call.recordingUrl || null,
        transcript:    msg.transcript || null,
        summary:       analysis.summary || null,
        structured,
        cost:          msg.cost || call.cost || null,
        ended_at:      call.endedAt || new Date().toISOString(),
      });

      console.log(`[CALL ENDED] id=${call.id} outcome=${outcome} duration=${msg.durationSeconds}s`);
    }

    if (type === 'status-update') {
      const call = event.message?.call || event.call || {};
      if (call.id && call.status) {
        await updateCall({ id: call.id, status: call.status });
        console.log(`[STATUS] id=${call.id} status=${call.status}`);
      }
    }
  })().catch(err => console.error('[WEBHOOK ERROR]', err));
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Elite AI Backend running on http://localhost:${PORT}`);
  console.log(`   REST API  → http://localhost:${PORT}/api/calls`);
  console.log(`   Webhook   → http://localhost:${PORT}/webhook`);
  console.log(`\n   To expose webhook publicly: npx ngrok http ${PORT}\n`);
});

module.exports = app;
