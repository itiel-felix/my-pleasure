import openwakeword
from openwakeword.model import Model
import pyaudio
import numpy as np
import socket
import time
import threading

openwakeword.utils.download_models()

model = Model(wakeword_models=["hey_jarvis"])

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 9001))

pa = pyaudio.PyAudio()
stream = pa.open(
    rate=16000,
    channels=1,
    format=pyaudio.paInt16,
    input=True,
    input_device_index=4,
    frames_per_buffer=1280
)

detecting = True

def listen_for_done():
    global detecting
    while True:
        try:
            data = sock.recv(1024)
            if data == b"DONE":
                detecting = True
                print("👂 Escuchando wake word...")
        except:
            break

threading.Thread(target=listen_for_done, daemon=True).start()

print("👂 Escuchando wake word... di 'Hey Jarvis'")

while True:
    audio = stream.read(1280, exception_on_overflow=False)
    audio_np = np.frombuffer(audio, dtype=np.int16)
    
    if not detecting:
        continue
        
    prediction = model.predict(audio_np)
    
    for key, value in prediction.items():
        if value > 0.85:
            print(f"✅ Wake word detectado! ({value:.2f})")
            detecting = False
            sock.send(b"WAKE")
            # Limpia buffer y modelo
            for _ in range(20):
                stream.read(1280, exception_on_overflow=False)
            model.reset()