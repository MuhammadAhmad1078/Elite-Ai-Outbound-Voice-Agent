# Elite AI — Outbound Cold-Call AI Voice Agent

A fully working outbound AI voice agent that calls home service business owners and sells **Elite AI** (elite-ai-pros.com). Built with Vapi + Twilio + Groq + ElevenLabs. Includes a React dashboard for triggering calls and reviewing outcomes.

---

## Stack

| Layer | Technology | Cost |
|---|---|---|
| Voice orchestration | [Vapi](https://vapi.ai) | ~$10 free credit |
| Telephony / Caller ID | [Twilio](https://twilio.com) | $15.50 free trial |
| LLM (conversation brain) | [Groq](https://console.groq.com) — Llama 3.3 70B | **Free** |
| TTS (voice) | [ElevenLabs Turbo v2.5](https://elevenlabs.io) — Rachel voice | 10k chars/mo free |
| STT | Deepgram Nova-2 (bundled in Vapi) | Free in Vapi trial |
| Outcome logging | SQLite (`better-sqlite3`) | Free (local) |
| Dashboard | React + Vite | Free |
| Webhook tunnel | [ngrok](https://ngrok.com) | Free tier |

---

## Quick Start

### 1. Clone and install backend dependencies

```bash
cd "f:\Jobs\Final Task"
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Set up environment variables

```bash
copy .env.example .env
```

Then edit `.env` with your API keys (see **API Keys** section below).

### 4. Create the Vapi assistant (one-time setup)

```bash
node src/create_assistant.js
```

This reads `system_prompt.md` + `vapi_assistant_config.json`, creates the assistant in Vapi, and prints an Assistant ID. Copy that ID into your `.env`:

```
VAPI_ASSISTANT_ID=<printed-id>
```

### 5. Expose the webhook with ngrok

In a separate terminal:

```bash
npx ngrok http 3001
```

Copy the HTTPS URL (e.g. `https://xxxx.ngrok-free.app`) and set it in `.env`:

```
WEBHOOK_URL=https://xxxx.ngrok-free.app
```

Then re-run step 4 to update the assistant's webhook URL.

### 6. Start the backend

```bash
npm start
```

Backend runs on http://localhost:3001

### 7. Start the React dashboard

```bash
cd frontend
npm run dev
```

Dashboard runs on http://localhost:5173

### 8. Place a test call

Open http://localhost:5173, enter a **verified** Twilio phone number, and click **Place Call**.

---

## API Keys — Where to Get Them

### Vapi (free ~$10 credit)
1. Sign up at https://dashboard.vapi.ai
2. Go to **Account → API Keys** → Create new key
3. Copy to `VAPI_API_KEY` in `.env`

### Twilio ($15.50 free trial — no credit card required initially)
1. Sign up at https://www.twilio.com/try-twilio
2. In the console: note your **Account SID** and **Auth Token**
3. Get a free phone number (Search → Buy Number)
4. During trial, go to **Verified Caller IDs** and add the number you want to call
5. Fill in `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env`

### Groq (completely free)
1. Sign up at https://console.groq.com
2. Go to **API Keys** → Create API Key
3. Copy to `GROQ_API_KEY` in `.env`

### ElevenLabs (10,000 chars/month free)
1. Sign up at https://elevenlabs.io
2. Click your profile → **Profile + API Key**
3. Copy to `ELEVENLABS_API_KEY` in `.env`
4. Default voice ID (`21m00Tcm4TlvDq8ikWAM`) = Rachel (warm US female)

---

## How to Pull Call Recordings

After a call ends, the recording URL appears in the dashboard table under **Recording**. You can also query the SQLite database directly:

```bash
# Windows — use sqlite3 CLI or any SQLite viewer
# Or query via the API:
curl http://localhost:3001/api/calls
```

---

## Changing the System Prompt / Persona

Edit `system_prompt.md` directly, then re-run:

```bash
node src/create_assistant.js
```

This creates a new Vapi assistant version. Update `VAPI_ASSISTANT_ID` in `.env` with the new ID.

---

## Changing the Target Phone Number

In the React dashboard, just type a different number and click **Place Call**.  
Via CLI: `node -e "require('./src/call_cli.js')('+1XXXXXXXXXX')"`

---

## Project Structure

```
├── .env.example          # All required env vars
├── package.json          # Backend dependencies
├── system_prompt.md      # Sales script / persona (edit this)
├── vapi_assistant_config.json  # Vapi assistant definition
├── src/
│   ├── server.js         # Express: REST API + webhook handler
│   ├── db.js             # SQLite helpers
│   └── create_assistant.js  # One-time Vapi setup script
├── logs/
│   └── calls.db          # Auto-created SQLite database
└── frontend/             # React + Vite dashboard
    └── src/
        ├── App.jsx
        ├── index.css
        └── components/   # Header, CallTrigger, CallStatus, Stats, CallLogs, CallCard
```

---

## Call Outcomes

The agent classifies every call as one of:

| Outcome | Meaning |
|---|---|
| `BOOKED_DEMO` | Prospect agreed to a specific demo time |
| `CALLBACK` | Prospect asked to be called back |
| `NOT_INTERESTED` | Prospect clearly declined |
| `DO_NOT_CALL` | Prospect asked to be removed from list |
| `VOICEMAIL` | Call went to voicemail — agent left a message |

---

## Caller ID / Spam Reputation Notes

- STIR/SHAKEN A-attestation: enabled automatically on Twilio verified numbers
- CNAM registration: do in Twilio Console → Phone Numbers → Manage → your number → CNAM
- During Twilio trial: only verified numbers can be called
- Recommended calling cadence: max 50 calls/day per number to avoid spam flags
- Always honor `DO_NOT_CALL` outcomes — maintain an internal DNC list before scaling

---

## Cost Breakdown (per 3-minute call)

| Component | Cost |
|---|---|
| Vapi platform | ~$0.05/min = $0.15 |
| Deepgram STT | ~$0.007/min = $0.02 |
| ElevenLabs TTS | ~$0.024/min = $0.07 |
| Twilio outbound | ~$0.015/min = $0.045 |
| Groq LLM | **Free** |
| **Total** | **~$0.29 per 3-min call** |

Free credits cover ~30–50 test calls before any charges.
