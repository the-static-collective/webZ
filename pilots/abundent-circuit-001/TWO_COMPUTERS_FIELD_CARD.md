# FIELD CARD · CIRCUIT 003 · Two Real Machines

**Status:** Ready for *human-run* two-device trial. No physical two-device success claim yet.

## Preparations

- [ ] Both machines are on one **trusted private network**, not guest/public Wi-Fi; port 7789 is not exposed through a router.
- [ ] Both possess Python **3.10+** and a separate downloaded checkout of `the-static-collective/GHoT`.
- [ ] Test content has **no secrets or sensitive personal data**; GHoT persists input text on the worker.
- [ ] One machine is designated **A: operator**, another **B: worker**.

## One complete physical crossing

- [ ] On **B**: open `start-ghot-lan-worker-mac.command`, type `YES`, note private IPv4 address and pairing key from terminal.
- [ ] On **A**: open `start-native-ghot-mac.command`. Browser should open at `http://127.0.0.1:8878/`.
- [ ] On **A**: create a fictional harbor, navigate to **06 · Compute**, and pair using `http://B_PRIVATE_IP:7789` + the key.
- [ ] A displays **PAIRED** and the same GHoT worker node ID printed on B.
- [ ] Run `ONE TABLE → ONE OTHER COMPUTER` from A using the remote form; see **NATIVE GHOT / LAN WORKER**, native receipt ID, and SHA-256 digest.
- [ ] On B, verify `~/.abundent-circuit/ghot-worker/records` has new `ghot.task` and `ghot.receipt` JSON records. Do **not** publish these raw records without reviewing stored input.
- [ ] On A, reload and confirm that the receipt reference/digest persists. No Full Measure Deed is created.
- [ ] On A, click **Unpair** and verify remote task form is disabled. Close both launchers with Ctrl+C to stop listeners.

## Keep an honest receipt of the trial (private unless shared intentionally)

Date: _______ · A platform: _______ · B platform: _______ · LAN type: _______

B's GHoT node ID: ___________________ · A's observed executor ID: ___________________

Native receipt ID: ___________________ · Digest prefix (8–12 chars): ____________

Independent human observed B's records? YES / NO · Reboot persistence checked? YES / NO

Any errors, firewall prompts, clock problems, missing OpenSSL, or refusals? ___________________

## Optional one-device rehearsal

Run B's script on the *same machine* as A, choose `http://127.0.0.1:7789` manually if running the worker without `--allow-lan`, and complete the same sequence. The UI will correctly label this **PEER LOOPBACK TEST**. This proves two processes, **not two computers**. CI runs this rehearsal against actual GHoT source.

**DO NOT claim:** computer autonomy, automatic scheduling, money movement, real-world completed collaboration, public connectivity, physical reproduction, authenticated human witness, or signed reLATTE transport from a successful hash alone.
