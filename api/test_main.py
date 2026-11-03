"""Smoke tests for the registry's moderation and duplicate workflow.
Run: pip install -r api/requirements.txt httpx pytest
     pytest -q api/test_main.py
"""
import importlib, os
from fastapi.testclient import TestClient

def test_submission_review_and_duplicates(tmp_path,monkeypatch):
    monkeypatch.setenv("HAITI2050_DB",str(tmp_path/"registry.sqlite3"))
    monkeypatch.setenv("HAITI2050_ADMIN_TOKEN","test-secret")
    import api.main as module
    importlib.reload(module)
    client=TestClient(module.app)
    payload={"name":"École pilote","category":"education","lat":18.28,"lon":-73.12,
             "provider":"local","source_url":"https://example.org/source"}
    first=client.post("/api/places",json=payload)
    assert first.status_code==201
    first_id=first.json()["id"]
    assert client.get("/api/places").json()==[]
    assert client.get("/api/admin/pending").status_code==403
    headers={"X-Admin-Token":"test-secret"}
    assert len(client.get("/api/admin/pending",headers=headers).json())==1
    assert client.post(f"/api/admin/places/{first_id}/review",headers=headers,
                       json={"decision":"approved","reason":"Source contrôlée"}).status_code==200
    assert len(client.get("/api/places").json())==1
    assert client.get(f"/api/places/{first_id}").json()["history"]
    second=client.post("/api/places",json={**payload,"provider":"adf","external_id":"adf-1"})
    assert second.status_code==201
    second_id=second.json()["id"]
    assert client.post("/api/places",json={**payload,"provider":"adf","external_id":"adf-1"}).status_code==409
    conflicts=client.get("/api/admin/duplicates",headers=headers).json()
    assert len(conflicts)==1
    assert client.post(f"/api/admin/places/{second_id}/review",headers=headers,
                       json={"decision":"approved","reason":"Test"}).status_code==409
    assert client.post(f"/api/admin/duplicates/{conflicts[0]['id']}/resolve",headers=headers,
                       json={"decision":"distinct","reason":"Deux sites distincts vérifiés"}).status_code==200
    assert client.post(f"/api/admin/places/{second_id}/review",headers=headers,
                       json={"decision":"approved","reason":"Site distinct"}).status_code==200
    assert len(client.get("/api/places").json())==2
