from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
root=Path(__file__).resolve().parent
project=json.loads((root/'project.json').read_text())
folder=root/project['current_project']
print('Current project:',project['current_version'])
print('Open http://127.0.0.1:8000/preview.html',flush=True)
ThreadingHTTPServer(('127.0.0.1',8000),partial(SimpleHTTPRequestHandler,directory=str(folder))).serve_forever()
