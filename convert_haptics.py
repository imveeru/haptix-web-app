import json
import os
import glob

# Convert all haptics JSON files to the correct HapticPattern format
files = glob.glob('public/haptics/*.json')
for f in files:
    with open(f, 'r') as file:
        data = json.load(file)
    
    video_id = os.path.basename(f).replace('.json', '')
    
    if 'videoId' in data and 'trigger' in data.get('events', [{}])[0]:
        print(f"Skipping {f}, already converted.")
        continue
    
    new_data = {
        'videoId': video_id,
        'totalDuration': 0,
        'events': []
    }
    
    max_time = 0
    if 'events' in data:
        for ev in data['events']:
            new_ev = {
                'time': ev['time'],
                'trigger': [
                    {
                        'duration': ev.get('duration', 0),
                        'intensity': ev.get('intensity', 1.0)
                    }
                ]
            }
            if 'description' in ev:
                new_ev['description'] = ev['description']
            new_data['events'].append(new_ev)
            
            end_time = ev['time'] + ev.get('duration', 0) / 1000.0
            if end_time > max_time:
                max_time = end_time
                
    new_data['totalDuration'] = max_time
    
    with open(f, 'w') as file:
        json.dump(new_data, file, indent=2)

print("Conversion complete.")
