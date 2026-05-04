import urllib.request
import json

endpoints = [
    "/api/yields/overview",
    "/api/yields/time-series",
    "/api/yields/spread-compression",
    "/api/yields/industry-heatmap",
    "/api/yields/spread-curve",
    "/api/stress/non-accrual",
    "/api/stress/dashboard",
    "/api/stress/watchlist",
    "/api/stress/nav-premium",
    "/api/stress/fair-value-dist",
    "/api/dealflow/trends",
    "/api/dealflow/by-sector",
    "/api/dealflow/hold-sizes",
    "/api/managers/matrix",
    "/api/managers/deep-dive/ARCC",
    "/api/macro/overlay"
]

base_url = "http://localhost:8000"

for ep in endpoints:
    url = base_url + ep
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            print(f"[OK] {status} - {ep}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[FAIL] {e.code} - {ep} - {body}")
    except Exception as e:
        print(f"[ERROR] {ep} - {e}")
