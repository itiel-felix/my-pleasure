# My Pleasure

A personal voice assistant that listens for the wake word **"Hey Jarvis"**, transcribes your speech with [Vosk](https://alphacephei.com/vosk/), and replies via an LLM (OpenAI-compatible API, e.g. DeepSeek). It can manage a local shopping list and Google Calendar events.

## Requirements

- **Node.js** 18 or later
- **Python** 3.10+
- A microphone
- On macOS, for PyAudio: `brew install portaudio` (if `pip install pyaudio` fails)

## Installation

### 1. Clone and install dependencies

```bash
git clone git@github.com:itiel-felix/my-pleasure.git
cd my-pleasure

npm install

python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

On the first run, **openWakeWord** will download the `hey_jarvis` model automatically.

### 2. Speech model (Vosk)

Download the Spanish/English model and extract it under `models/`:

```bash
mkdir -p models
curl -LO https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip
unzip vosk-model-small-es-0.42.zip -d models
```

The default path is `models/vosk-model-small-es-0.42`. Override it with `VOSK_MODEL_PATH` if needed.

### 3. Environment variables

Create a `.env` file in the project root:

```env
# LLM (DeepSeek example)
DEEPSEEK_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat

# Microphone (input device index)
INPUT_DEVICE_INDEX=4
```

To find your microphone index:

```bash
venv/bin/python list_devices.py
```

Set `INPUT_DEVICE_INDEX` in `.env`. In `wake_word.py`, the mic is hardcoded as `input_device_index=4`; update that line too if your device uses a different index.

### 4. Google Calendar (optional)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/) and enable the **Google Calendar API**.
2. Create OAuth credentials for a **Desktop app** and save the JSON as `credentials.json` in the project root (not committed to git).
3. The first time you use a calendar tool, the app prints an authorization URL in the console. Complete OAuth and paste the code. A `token.json` file will be created (also gitignored).

## Usage

Start the assistant (wake word in Python + Node server on port 9001):

```bash
npm start
```

This is equivalent to:

```bash
venv/bin/python wake_word.py &
node index.js
```

### Flow

1. Say **"Hey Jarvis"** to activate.
2. Speak; Vosk transcribes your voice.
3. The assistant replies in the console and may call tools.
4. Say something like **"adiós"**, **"hasta luego"**, or **"bye"** to return to wake-word listening.

After each session, the Python process resumes wake-word detection when Node sends `DONE` over the socket.

## Available tools

| Tool | Description |
|------|-------------|
| `add_shopping_item` | Add an item to `shopping.json` (local, not versioned) |
| `get_shopping_list` | Show the shopping list |
| `add_calendar_event` | Create a Google Calendar event |
| `list_calendar_events` | List upcoming events |
| `delete_calendar_event` | Delete an event by title/keywords |

## Project structure

```
├── index.js              # Node server; orchestrates wake word and conversation
├── agent.js              # LLM, session memory, and meta (question / end)
├── wake_word.py          # "Hey Jarvis" detection (openWakeWord)
├── speech-to-text.py     # Vosk transcription (long-lived process for Node)
├── tools/                # Shopping list and Google Calendar
└── models/               # Vosk model (not included in git)
```

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| `Model not found` | Vosk model download and path under `models/` |
| Wake word not detected | Correct microphone, clear "Hey Jarvis", threshold in `wake_word.py` |
| No transcription / bad audio | `INPUT_DEVICE_INDEX` and `list_devices.py` |
| `pyaudio` install error | `brew install portaudio`, then reinstall requirements |
| Calendar not working | `credentials.json`, OAuth flow, and `token.json` |

## Files not in the repository

Listed in `.gitignore`: `.env`, `credentials.json`, `token.json`, `node_modules/`, `venv/`, `models/`, `shopping.json`.

## License

Personal project.
