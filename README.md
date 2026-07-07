# CortexWAF

**AI-driven AWS WAF log analysis and automated rule management.**
CortexWAF ingests live AWS WAF logs, detects attack patterns, scores risk in real time, and uses an LLM (Amazon Bedrock / Claude) to recommend and apply managed rules — turning raw WAF logs into actionable defense with a human still in the loop.

<!-- TODO: replace with your own hosted badges or remove -->
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![AWS](https://img.shields.io/badge/AWS-WAF%20%7C%20S3%20%7C%20Bedrock-232F3E?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

> 🥇 Built at MegazoneCloud's internal Megathon — 1st place. <!-- TODO: confirm exact event name / ranking / # of teams -->

---

## Demo

<!-- TODO: add a short GIF of the dashboard + rule-apply flow, and 2–3 screenshots. This is the single highest-impact addition for recruiters. -->

| Real-time dashboard | WAF rule management |
| --- | --- |
| _screenshot_ | _screenshot_ |

---

## Why it exists

AWS WAF produces high-volume logs, but deciding *which* managed rules to enable — and quantifying the risk you're carrying by not enabling them — is manual, slow, and judgment-heavy. CortexWAF closes that loop:

1. **Collect** WAF logs from S3 (gzip, auto-decompressed).
2. **Detect** attack signatures (SQLi, XSS, command injection, path traversal, file inclusion).
3. **Score** current risk on a dynamic 0–100 scale.
4. **Recommend** AWS managed rules via an LLM reasoning step (Bedrock / Claude).
5. **Apply / remove** rules through `boto3`, with the risk score updating live as rules toggle.
6. **Notify & report** — Slack alerts and a downloadable PDF report.

## Architecture

```
        AWS S3 (WAF logs, gzip)
                 │
        s3_log_loader.py
                 │
   ┌─────────────┼─────────────┐
   ▼             ▼             ▼
detection.py  analysis.py  risk_calculator.py
   │             │             │
   └─────────────┼─────────────┘
                 ▼
          orchestrator.py  ──►  Amazon Bedrock (Claude)
                 │                    rule recommendation
                 ▼
        waf__rule_manager.py  ──►  AWS WAF (apply/remove via boto3)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
slack_notifier  report.py  api_server.py (Flask)
                                 │
                                 ▼
                     React dashboard (Leaflet, Recharts)
```

## Risk scoring model

The differentiator here is that risk is **quantified and dynamic**, not a static severity label:

- **Ceiling** — current risk with no AI rules applied.
- **Floor** — minimum reachable risk if every recommended rule is applied.
- **Per-rule weight** — `WCU (70%) + detection volume (30%)`, so rules are ranked by both cost and real observed traffic.
- **Live update** — applying a rule subtracts from the score, removing adds back, so the operator sees the trade-off in real time.

## Key features

- **Real-time dashboard** — geographic attack map, hourly attack timeline, monthly attack-type breakdown.
- **AI rule management** — LLM-recommended AWS managed rules with one-click apply/remove and live risk recalculation.
- **S3 log pipeline** — automatic collection and gzip handling (up to 1,000 recent logs).
- **Pattern-based detection** — SQLi, XSS, command injection, path traversal, file inclusion.
- **Slack alerting + PDF reporting** — operational notifications and shareable reports.

## Tech stack

**Backend** — Python 3.8+, Flask, boto3, Amazon Bedrock (Claude), ReportLab, AbuseIPDB API
**Frontend** — React 18, Axios, Leaflet (maps), Recharts (charts)
**Infra** — AWS WAF, S3, Step Functions

## Getting started

### 1. Install

```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 2. Configure

Create a `.env` file (all values are placeholders — never commit real credentials):

```env
AWS_REGION=ap-northeast-2
WAF_ARN=<your_waf_arn>
WAF_NAME=<your_waf_name>
WAF_ID=<your_waf_id>
BEDROCK_MODEL=<your_bedrock_model_id>
PENDING_BLOCKS_TABLE=pending_blocks

ABUSEIPDB_API_KEY=<your_abuseipdb_api_key>

# S3 WAF log source
USE_S3_LOGS=true
S3_BUCKET=<your_bucket>
S3_BUCKET_NAME=<your_waf_log_bucket>
S3_REGION=ap-northeast-2

# Prefer AWS CLI config or an IAM role over static keys
# AWS_ACCESS_KEY_ID=<optional>
# AWS_SECRET_ACCESS_KEY=<optional>
```

### 3. Run

```bash
python api_server.py       # backend  → http://localhost:5000
cd frontend && npm start   # frontend → http://localhost:3000
```

> Windows helper scripts (`start.bat`, `stop.bat`, `restart.bat`) are also included.

## API reference

<details>
<summary>Endpoints</summary>

**Data**
- `GET /api/geographic-data` — attacks by region
- `GET /api/hourly-attacks` — hourly attack volume
- `GET /api/monthly-attack-types` — attack types by month
- `GET /api/logs` — WAF log list
- `GET /api/rules/before` — current rules
- `GET /api/rules/after` — AI-recommended rules

**Rule management**
- `GET /api/risk-calculation` — risk breakdown
- `POST /api/apply-rule` — apply a rule
- `POST /api/remove-rule` — remove a rule

**Misc**
- `GET|POST /api/theme` — theme
- `GET /api/download-report` — PDF report

</details>

## Testing

```bash
python test_local.py
python tests/test_s3_connection.py
python tests/test_attack_detection.py
```

## License

MIT — see [LICENSE](LICENSE). <!-- TODO: confirm a LICENSE file actually exists in the repo -->

## Author

**Siyeon (Ella) Park** — Security Architect, MegazoneCloud
[GitHub](https://github.com/ellasypark) <!-- TODO: add LinkedIn -->
