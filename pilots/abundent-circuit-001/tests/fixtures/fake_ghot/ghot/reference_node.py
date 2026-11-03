"""TEST DOUBLE ONLY. Not a GHoT donor; source path-shaped fixture for bridge isolation tests."""
import hashlib
import json
import os
import sys
from pathlib import Path
from uuid import uuid4

if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] != 'hash':
        raise SystemExit(7)
    home = Path(os.environ['GHOT_HOME'])
    text = sys.argv[2]
    home.joinpath('records').mkdir(parents=True, exist_ok=True)
    output = {'sha256': hashlib.sha256(text.encode('utf-8')).hexdigest()}
    rec = {
        'kind': 'ghot.receipt', 'version': '0', 'status': 'ok', 'capability': 'system.hash',
        'receipt_id': 'receipt-' + str(uuid4()), 'task_id': 'task-' + str(uuid4()),
        'executor_node_id': 'node-fixture-only', 'output': output,
        'output_sha256': hashlib.sha256(json.dumps(output, sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
        'finished_at': '2026-11-03T00:00:00Z',
    }
    home.joinpath('records', rec['receipt_id'] + '.json').write_text(json.dumps(rec))
    print(json.dumps(rec))
