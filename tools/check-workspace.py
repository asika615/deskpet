from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
expected=json.loads((root/'handoff/checksums.json').read_text())
errors=[]
for name,digest in expected.items():
 p=root/name
 if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:errors.append(name)
if errors:
 print('Integrity check failed:',*errors,sep='\n');sys.exit(1)
print('Integrity verified:',len(expected),'files')
