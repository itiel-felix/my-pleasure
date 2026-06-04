import pyaudio
pa = pyaudio.PyAudio()
for i in range(pa.get_device_count()):
    print(i, pa.get_device_info_by_index(i)['name'])