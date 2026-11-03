"""TEST DOUBLE ONLY. Shape-compatible for isolated HTTP tests; never a real GHoT proof."""
import hashlib
import json
import os
import sys
from pathlib import Path
from uuid import uuid4


def node_id(home):
    path=home/'node-id'
    if not path.exists():
        home.mkdir(parents=True,exist_ok=True)
        path.write_text('node-fixture-'+str(uuid4()))
    return path.read_text().strip()

if __name__=='__main__':
    home=Path(os.environ['GHOT_HOME'])
    nid=node_id(home)
    if sys.argv[1:] == ['probe']:
        print(json.dumps({'kind':'ghot.body','version':'0','node_id':nid,
                          'identity':{'available':False,'particular':None}}))
    elif len(sys.argv)==3 and sys.argv[1]=='hash':
        text=sys.argv[2]
        home.joinpath('records').mkdir(parents=True,exist_ok=True)
        output={'sha256':hashlib.sha256(text.encode()).hexdigest()}
        task={'kind':'ghot.task','task_id':'task-'+str(uuid4()),'capability':'system.hash','input':text}
        rec={'kind':'ghot.receipt','version':'0','status':'ok','capability':'system.hash',
             'receipt_id':'receipt-'+str(uuid4()),'task_id':task['task_id'],
             'executor_node_id':nid,'output':output,
             'output_sha256':hashlib.sha256(json.dumps(output,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
             'finished_at':'2026-11-03T00:00:00Z'}
        (home/'records'/('0-task-'+task['task_id']+'.json')).write_text(json.dumps(task))
        (home/'records'/('1-receipt-'+rec['receipt_id']+'.json')).write_text(json.dumps(rec))
        print(json.dumps(rec))
    else:
        raise SystemExit('Only probe and hash are implemented in the TEST DOUBLE')
