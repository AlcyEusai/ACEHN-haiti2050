"""Validate the Git-tracked public registry and detect likely duplicates."""
import json, math, sys, unicodedata
from pathlib import Path
PATH=Path("data/registre-etablissements.json")
def norm(value):
    return "".join(c for c in unicodedata.normalize("NFKD",value.casefold()) if not unicodedata.combining(c)).strip()
def validate(data):
    errors=[];warnings=[];seen_ids=set();seen_sources=set();places=data.get("places",[])
    if not isinstance(places,list):return ["places must be an array"],[]
    for index,p in enumerate(places):
        prefix=f"places[{index}]"
        if not isinstance(p,dict):errors.append(prefix+": not an object");continue
        for field in ("id","name","category","source","verification","updatedAt","history"):
            if field not in p:errors.append(prefix+": missing "+field)
        if not isinstance(p.get("id"),str) or not p.get("id"):errors.append(prefix+": invalid id")
        elif p["id"] in seen_ids:errors.append(prefix+": duplicate id "+p["id"])
        else:seen_ids.add(p["id"])
        if not isinstance(p.get("name"),str) or len(p["name"].strip())<2:errors.append(prefix+": invalid name")
        source=p.get("source")
        if not isinstance(source,str) or not source.startswith("https://"):errors.append(prefix+": HTTPS source required")
        coords=(p.get("lat"),p.get("lon"))
        if (coords[0] is None)!=(coords[1] is None):errors.append(prefix+": incomplete coordinates")
        if coords[0] is not None:
            if any(isinstance(v,bool) or not isinstance(v,(float,int)) or not math.isfinite(v) for v in coords):errors.append(prefix+": invalid coordinates")
            elif not (-90<=coords[0]<=90 and -180<=coords[1]<=180):errors.append(prefix+": coordinates out of range")
        osm=p.get("osmId")
        if osm:
            if osm in seen_sources:errors.append(prefix+": duplicate osmId "+osm)
            seen_sources.add(osm)
        if not isinstance(p.get("history"),list) or not p.get("history"):errors.append(prefix+": history must be nonempty")
        else:
            for event in p["history"]:
                if not isinstance(event,dict) or not all(event.get(k) for k in ("date","action","source")):
                    errors.append(prefix+": invalid history event")
    for i,a in enumerate(places):
        if not isinstance(a,dict) or not isinstance(a.get("name"),str):continue
        for b in places[:i]:
            if not isinstance(b,dict) or not isinstance(b.get("name"),str):continue
            if norm(a["name"])!=norm(b["name"]):continue
            if all(isinstance(x,(int,float)) and not isinstance(x,bool) for x in (a.get("lat"),a.get("lon"),b.get("lat"),b.get("lon"))):
                if abs(a["lat"]-b["lat"])<0.002 and abs(a["lon"]-b["lon"])<0.002:
                    warnings.append(f"Possible duplicate: {a.get('id')} / {b.get('id')}")
    return errors,warnings
def main():
    data=json.loads(PATH.read_text(encoding="utf-8"))
    errors,warnings=validate(data)
    for line in warnings:print("WARNING:",line)
    for line in errors:print("ERROR:",line)
    print(f"Checked {len(data.get('places',[]))} establishments, {len(errors)} errors, {len(warnings)} duplicate warnings")
    return 1 if errors or warnings else 0
if __name__=="__main__":sys.exit(main())
