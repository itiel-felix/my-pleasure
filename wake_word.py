import os
import socket
import threading
import time

import numpy as np
import openwakeword
import pyaudio
from openwakeword.model import Model

openwakeword.utils.download_models()

model = Model(wakeword_models=["hey_jarvis"])

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 9001))

pa = None
stream = None
detecting = True
stream_lock = threading.Lock()


def input_device_index():
    raw = os.environ.get("INPUT_DEVICE_INDEX")
    return int(raw) if raw not in (None, "") else None


def open_input_stream():
    global pa, stream

    with stream_lock:
        if stream is not None:
            return

        pa = pyaudio.PyAudio()
        open_kwargs = {
            "rate": 16000,
            "channels": 1,
            "format": pyaudio.paInt16,
            "input": True,
            "frames_per_buffer": 1280,
        }
        device = input_device_index()
        if device is not None:
            open_kwargs["input_device_index"] = device

        try:
            stream = pa.open(**open_kwargs)
        except OSError as err:
            print(f"\n❌ No se pudo abrir el micrófono: {err}")
            if device is not None:
                print(f"   INPUT_DEVICE_INDEX={device} puede ser inválido.")
            print("   Ejecuta: venv/bin/python list_devices.py")
            print("   Luego actualiza INPUT_DEVICE_INDEX en .env\n")
            raise SystemExit(1) from err


def close_input_stream():
    global pa, stream

    with stream_lock:
        if stream is not None:
            stream.stop_stream()
            stream.close()
            stream = None
        if pa is not None:
            pa.terminate()
            pa = None


def listen_for_done():
    global detecting

    while True:
        try:
            data = sock.recv(1024)
            if data == b"DONE":
                detecting = True
                open_input_stream()
                print("👂 Escuchando wake word...")
        except Exception:
            break


threading.Thread(target=listen_for_done, daemon=True).start()

open_input_stream()
print("👂 Escuchando wake word... di 'Hey Jarvis'")

while True:
    with stream_lock:
        active_stream = stream

    if active_stream is None:
        time.sleep(0.05)
        continue

    audio = active_stream.read(1280, exception_on_overflow=False)
    audio_np = np.frombuffer(audio, dtype=np.int16)

    if not detecting:
        continue

    prediction = model.predict(audio_np)

    for key, value in prediction.items():
        if value > 0.6:
            print(f"✅ Wake word detectado! ({value:.2f})")
            detecting = False
            close_input_stream()
            sock.send(b"WAKE")
            model.reset()
            break
