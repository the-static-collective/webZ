#!/usr/bin/env python3
"""Independent cold check across original native CANNON/Free Graph/planZ outputs.
Fixture-only; refusal does not constitute a legal or technical human-identity attestation.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

def fail(message):
    raise SystemExit("WEAVING_CROSSING_REFUSED: " + message)

def read(root, name):
    p = root / name
    if not p.is_file() or not (0 < p.stat().st_size < 1_000_000):
        fail("missing or unbounded " + name)
    return json.loads(p.read_text(encoding="utf8"))

def sha(body):
    canonical=json.dumps(body,sort_keys=True,ensure_ascii=False,separators=(",",":"),allow_nan=False)
    return "sha256:"+hashlib.sha256(("ABUNDENT-WEAVING-HANDOFF-002|"+canonical).encode()).hexdigest()

def check(root):
    h=read(root,"handoff.json"); f=read(root,"field.json"); seed=read(root,"seed.json")
    hold=read(root,"hold.json"); graph=read(root,"source.json")
    plan=read(root,"planz.json"); returned=read(root,"return.json")
    expect_keys={"id","schema","opportunity","public_question","source_context","provenance",
                 "status","recipient","person_authenticated","permission_verified",
                 "recipient_accepted","published","work_performed"}
    if set(h)!=expect_keys or h["schema"]!="abundent.weaving-handoff/v0":
        fail("handoff shape")
    if h["id"]!=sha({k:v for k,v in h.items() if k!="id"}):
        fail("independent handoff hash mismatch")
    if any(h[k] for k in ("person_authenticated","permission_verified","recipient_accepted","published","work_performed")):
        fail("invented real-world authority")
    if h["status"]!="UNPUBLISHED_CANDIDATE" or h["recipient"]!="NONE":
        fail("unpublished boundary")
    if h["provenance"]!="DRAFT_SELF_REVIEW_UNVERIFIED" or h["source_context"]!="INDEPENDENT_ABUNDENT_EXPERIMENT":
        fail("source provenance")
    if not isinstance(h["opportunity"],dict) or set(h["opportunity"])!={"v","need","offer","try"} or h["opportunity"]["v"]!=1:
        fail("opportunity expansion")
    q=h["public_question"]
    if not (isinstance(q,str) and q.startswith("FICTIONAL:") and 14<=len(q)<=140):
        fail("only fictional seed permitted in shared CI")
    for k in ("need","offer","try"):
        value=h["opportunity"][k]
        if not isinstance(value,str) or not 4<=len(value)<=180 or re.search(r"@|https?://|\d{3}[-. ]\d{3}[-. ]\d{4}",value,re.I):
            fail("private or malformed opportunity")
    if f["public_question"]!=q or f["state"]!="UNPUBLISHED_CANDIDATE" or f["recipient"]!="NONE":
        fail("event donor question mismatch")
    if hold["source_question_id"]!=f["id"] or hold["question"]!=q or hold["disposition"]!="HOLD_UNPUBLISHED":
        fail("CANNON field hold mismatch")
    if any(hold[k] for k in ("source_person_authorized","recipient_owner_admission","publication_authorized","network_transmission")):
        fail("field hold promoted")
    if seed["fictional"] is not True or seed["title"]!=q or seed["schema"]!="cannon.circulation-seed/v0":
        fail("seed not the actual held question")
    if len(seed["receivers"])!=2 or any(not r["question"].startswith("FICTIONAL:") or q[11:] not in r["question"] for r in seed["receivers"]):
        fail("source question lost in invitations")
    nodes=graph["nodes"]
    found=[n for n in nodes if n.get("extensions",{}).get("circulation_role")=="seed"]
    if len(found)!=1 or found[0]["label"]!=q or graph["extensions"]["synthetic_only"] is not True:
        fail("original graph source question replaced")
    if plan["graph_packet_id"]!=graph["packet_id"] or not plan["synthetic_only"] or plan["field_proof"] is not False:
        fail("native planZ source mismatch")
    receipts=plan["return"]["receipts"]
    if len(receipts)!=2 or {r["lane"]:r["choice"] for r in receipts}!={"care":"HOLD","culture":"DECLINE"}:
        fail("unexpected receiving-world simulation")
    if any(r["owner_admission"] or r["physical_act"] or r["publication"] for r in receipts):
        fail("synthetic return claimed real action")
    if returned["extensions"]["parent_packet_id"]!=graph["packet_id"] or returned["extensions"]["planZ_return_id"]!=plan["return"]["id"]:
        fail("return graph lost source lineage")
    if any(e["verb"]=="constitutes" or e["authority"]!="none" for e in graph["links"]+returned["links"]):
        fail("graph introduced unearned authority")
    if returned["extensions"]["owner_permission"] is not False:
        fail("receiver owner status inflated")
    print(json.dumps({"status":"NATIVE_SYNTHETIC_ROUND_TRIP_VERIFIED",
                      "handoff_id":h["id"],"field_hold":hold["id"],
                      "source_graph":graph["packet_id"],"return_graph":returned["packet_id"],
                      "real_humans":0,"real_owner_acceptance":False,"actual_delivery":False}))

if __name__=="__main__":
    if len(sys.argv)!=2:fail("provide only a local output directory")
    check(Path(sys.argv[1]))
