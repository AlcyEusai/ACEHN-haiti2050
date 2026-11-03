"""Haïti 2050 — API de contribution persistante (prototype local).
Démarrage : pip install fastapi uvicorn ; uvicorn api.main:app --reload
En production : PostgreSQL, authentification, TLS et sauvegardes obligatoires.
"""
import json, os, sqlite3, uuid, hmac
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field

DB=Path(os.getenv("HAITI2050_DB","haiti2050.sqlite3"))
app=FastAPI(title="Haïti 2050 — registre des établissements",version="0.1.0")
def now(): return datetime.now(timezone.utc).isoformat()
def connect():
    db=sqlite3.connect(DB);db.row_factory=sqlite3.Row;db.execute("PRAGMA foreign_keys=ON");return db
def init():
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS places (
          id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,
          lat REAL,lon REAL,department TEXT,arrondissement TEXT,commune TEXT,
          status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
          CHECK(lat IS NULL OR lat BETWEEN -90 AND 90),
          CHECK(lon IS NULL OR lon BETWEEN -180 AND 180)
        );
        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY,place_id TEXT NOT NULL REFERENCES places(id),
          provider TEXT NOT NULL,external_id TEXT,source_url TEXT NOT NULL,
          observed_at TEXT,created_at TEXT NOT NULL,
          UNIQUE(provider,external_id)
        );
        CREATE TABLE IF NOT EXISTS changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,place_id TEXT NOT NULL REFERENCES places(id),
          at TEXT NOT NULL,action TEXT NOT NULL,actor TEXT NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS duplicate_candidates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,place_id TEXT NOT NULL REFERENCES places(id),
          possible_match_id TEXT NOT NULL REFERENCES places(id),
          reason TEXT NOT NULL,created_at TEXT NOT NULL,
          UNIQUE(place_id,possible_match_id)
        );
        """)
init()
class Submission(BaseModel):
    name:str=Field(min_length=2,max_length=200)
    category:str=Field(min_length=2,max_length=80)
    lat:float|None=Field(default=None,ge=-90,le=90)
    lon:float|None=Field(default=None,ge=-180,le=180)
    department:str|None=None
    arrondissement:str|None=None
    commune:str|None=None
    provider:str=Field(pattern="^(osm|adf|local)$")
    external_id:str|None=None
    source_url:str=Field(min_length=8,max_length=1000)
    observed_at:str|None=None
def record(db,place_id,action,actor,payload):
    db.execute("INSERT INTO changes(place_id,at,action,actor,payload) VALUES(?,?,?,?,?)",
        (place_id,now(),action,actor,json.dumps(payload,ensure_ascii=False)))
def normalize(value):return " ".join((value or "").casefold().split())
@app.post("/api/places",status_code=201)
def submit(item:Submission):
    if (item.lat is None)!=(item.lon is None):raise HTTPException(422,"Latitude et longitude doivent être fournies ensemble.")
    with connect() as db:
        if item.external_id:
            existing=db.execute("SELECT place_id FROM sources WHERE provider=? AND external_id=?",(item.provider,item.external_id)).fetchone()
            if existing:raise HTTPException(409,{"duplicate_of":existing["place_id"],"reason":"same_external_id"})
        place_id=str(uuid.uuid4());date=now()
        db.execute("INSERT INTO places(id,name,category,lat,lon,department,arrondissement,commune,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          (place_id,item.name,item.category,item.lat,item.lon,item.department,item.arrondissement,item.commune,"pending",date,date))
        db.execute("INSERT INTO sources(id,place_id,provider,external_id,source_url,observed_at,created_at) VALUES(?,?,?,?,?,?,?)",
          (str(uuid.uuid4()),place_id,item.provider,item.external_id,item.source_url,item.observed_at,date))
        record(db,place_id,"submitted","anonymous",item.model_dump())
        # Proximity and normalized-name checks are review candidates, never automatic merges.
        if item.lat is not None:
            near=db.execute("SELECT id,name,lat,lon FROM places WHERE id!=? AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?",
              (place_id,item.lat-.002,item.lat+.002,item.lon-.002,item.lon+.002)).fetchall()
            for other in near:
                if normalize(other["name"])==normalize(item.name):
                    db.execute("INSERT OR IGNORE INTO duplicate_candidates(place_id,possible_match_id,reason,created_at) VALUES(?,?,?,?)",
                      (place_id,other["id"],"same_name_nearby",date))
        return {"id":place_id,"status":"pending"}
@app.get("/api/places")
def list_places(status:str="approved",limit:int=100,offset:int=0):
    if status!="approved":raise HTTPException(403,"Le registre public ne montre que les fiches approuvées.")
    with connect() as db:
        rows=db.execute("SELECT * FROM places WHERE status='approved' ORDER BY name LIMIT ? OFFSET ?",(min(max(limit,1),500),max(offset,0))).fetchall()
        return [dict(row) for row in rows]
@app.get("/api/places/{place_id}")
def get_place(place_id:str):
    with connect() as db:
        place=db.execute("SELECT * FROM places WHERE id=? AND status='approved'",(place_id,)).fetchone()
        if not place:raise HTTPException(404,"Fiche non publiée")
        sources=db.execute("SELECT provider,external_id,source_url,observed_at FROM sources WHERE place_id=?",(place_id,)).fetchall()
        changes=db.execute("SELECT at,action FROM changes WHERE place_id=? ORDER BY id",(place_id,)).fetchall()
        return {"place":dict(place),"sources":[dict(x) for x in sources],"history":[dict(x) for x in changes]}

class Review(BaseModel):
    decision:str=Field(pattern="^(approved|rejected)$")
    reason:str=Field(min_length=3,max_length=500)
def require_admin(token):
    expected=os.getenv("HAITI2050_ADMIN_TOKEN")
    if not expected or not token or not hmac.compare_digest(token,expected):
        raise HTTPException(403,"Accès réservé à la modération")
@app.get("/api/admin/pending")
def pending(x_admin_token:str|None=Header(default=None)):
    require_admin(x_admin_token)
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM places WHERE status='pending' ORDER BY created_at LIMIT 200")]
@app.get("/api/admin/duplicates")
def duplicates(x_admin_token:str|None=Header(default=None)):
    require_admin(x_admin_token)
    with connect() as db:
        return [dict(x) for x in db.execute("SELECT * FROM duplicate_candidates ORDER BY id DESC LIMIT 200")]
@app.post("/api/admin/places/{place_id}/review")
def review_place(place_id:str,review:Review,x_admin_token:str|None=Header(default=None)):
    require_admin(x_admin_token)
    with connect() as db:
        place=db.execute("SELECT status FROM places WHERE id=?",(place_id,)).fetchone()
        if not place:raise HTTPException(404,"Fiche introuvable")
        if place["status"]!="pending":raise HTTPException(409,"Décision déjà enregistrée")
        if review.decision=="approved":
            duplicates=db.execute("SELECT COUNT(*) AS n FROM duplicate_candidates WHERE place_id=? OR possible_match_id=?",(place_id,place_id)).fetchone()["n"]
            if duplicates:raise HTTPException(409,"Doublon potentiel à examiner avant approbation")
        db.execute("UPDATE places SET status=?,updated_at=? WHERE id=?",(review.decision,now(),place_id))
        record(db,place_id,"reviewed","admin",review.model_dump())
        return {"id":place_id,"status":review.decision}
