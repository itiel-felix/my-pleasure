import os
import sys

import pyaudio


def input_device_index():
    raw = os.environ.get("INPUT_DEVICE_INDEX")
    return int(raw) if raw not in (None, "") else None


def resolve_input_device(pa):
    device = input_device_index()
    if device is not None:
        info = pa.get_device_info_by_index(device)
        return device, info["name"], "INPUT_DEVICE_INDEX"

    default = pa.get_default_input_device_info()
    return int(default["index"]), default["name"], "system default"


def log_input_device(pa=None, *, prefix="🎤", stream=None):
    owns_pa = pa is None
    if owns_pa:
        pa = pyaudio.PyAudio()

    try:
        index, name, source = resolve_input_device(pa)
        if source == "INPUT_DEVICE_INDEX":
            line = f"{prefix} Micrófono: {name} (index {index}, from .env)"
        else:
            line = f"{prefix} Micrófono: {name} (index {index}, system default)"
        print(line, file=stream or sys.stdout, flush=True)
    finally:
        if owns_pa:
            pa.terminate()
