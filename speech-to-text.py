#!/usr/bin/env python3
"""Vosk STT: modo CLI (una frase) o --server para Node (modelo cargado una vez)."""

import argparse
import json
import math
import os
import struct
import sys

import pyaudio
import vosk

MODEL_PATH = os.environ.get("VOSK_MODEL_PATH", "models/vosk-model-small-es-0.42")
SAMPLE_RATE = 16000
CHUNK = 4000
RMS_THRESHOLD = 500
MAX_DURATION_SEC = 10


def input_device_index():
    raw = os.environ.get("INPUT_DEVICE_INDEX")
    return int(raw) if raw not in (None, "") else None


def load_model():
    if not os.path.isdir(MODEL_PATH):
        print(f"Modelo no encontrado: {MODEL_PATH}", file=sys.stderr)
        print(
            "Descarga y descomprime en models/:\n"
            "  curl -LO https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip\n"
            "  unzip vosk-model-small-es-0.42.zip -d models",
            file=sys.stderr,
        )
        sys.exit(1)
    vosk.SetLogLevel(-1)
    return vosk.Model(MODEL_PATH)


def rms(frame: bytes) -> float:
    count = len(frame) // 2
    if count == 0:
        return 0.0
    samples = struct.unpack(f"<{count}h", frame)
    return math.sqrt(sum(s * s for s in samples) / count)


def record_audio(max_silence_sec: float) -> bytes:
    device = input_device_index()
    pa = pyaudio.PyAudio()
    open_kwargs = {
        "format": pyaudio.paInt16,
        "channels": 1,
        "rate": SAMPLE_RATE,
        "input": True,
        "frames_per_buffer": CHUNK,
    }
    if device is not None:
        open_kwargs["input_device_index"] = device

    try:
        stream = pa.open(**open_kwargs)
    except OSError as err:
        hint = f" INPUT_DEVICE_INDEX={device} may be invalid." if device is not None else ""
        raise OSError(f"{err}.{hint} Run: venv/bin/python list_devices.py") from err
    stream.start_stream()

    frames = []
    speech_started = False
    silence_chunks = 0
    chunk_duration = CHUNK / SAMPLE_RATE
    silence_chunks_needed = max(1, int(max_silence_sec / chunk_duration))
    max_chunks = int(MAX_DURATION_SEC / chunk_duration)

    try:
        for _ in range(max_chunks):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            if rms(data) > RMS_THRESHOLD:
                speech_started = True
                silence_chunks = 0
            elif speech_started:
                silence_chunks += 1
                if silence_chunks >= silence_chunks_needed:
                    break
    finally:
        stream.stop_stream()
        stream.close()
        pa.terminate()

    if not speech_started:
        return b""
    return b"".join(frames)


def transcribe(model: vosk.Model, audio: bytes) -> str:
    if not audio:
        return ""
    rec = vosk.KaldiRecognizer(model, SAMPLE_RATE)
    for i in range(0, len(audio), CHUNK):
        rec.AcceptWaveform(audio[i : i + CHUNK])
    result = json.loads(rec.FinalResult())
    return (result.get("text") or "").strip()


def listen_once(model: vosk.Model, max_silence_sec: float, *, emit_status: bool = False) -> str:
    if emit_status:
        print(json.dumps({"status": "listening"}), flush=True)
    audio = record_audio(max_silence_sec)
    return transcribe(model, audio)


def server_loop(model: vosk.Model) -> None:
    print("READY", flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        if line == "QUIT":
            break
        try:
            req = json.loads(line)
            if req.get("cmd") == "ping":
                print(json.dumps({"status": "ready"}), flush=True)
                continue
            max_silence = float(req.get("max_silence", 1.5))
            text = listen_once(model, max_silence, emit_status=True)
            print(json.dumps({"text": text}), flush=True)
        except Exception as exc:
            print(json.dumps({"error": str(exc)}), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", action="store_true", help="Modo persistente para Node")
    parser.add_argument("--max-silence", type=float, default=1.5)
    args = parser.parse_args()

    model = load_model()
    if args.server:
        server_loop(model)
    else:
        print(listen_once(model, args.max_silence))


if __name__ == "__main__":
    main()
