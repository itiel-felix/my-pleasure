import pyaudio

pa = pyaudio.PyAudio()
print("Input devices (use index in INPUT_DEVICE_INDEX):\n")

for i in range(pa.get_device_count()):
    info = pa.get_device_info_by_index(i)
    if info["maxInputChannels"] > 0:
        default = " (default)" if i == pa.get_default_input_device_info()["index"] else ""
        print(f"  {i}  {info['name']}{default}")

pa.terminate()
