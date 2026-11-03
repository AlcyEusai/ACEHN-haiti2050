"""Prepare a documented commune batch without inventing establishments.
Usage: python scripts/prepare_commune.py --department Sud --arrondissement Aquin --commune "Fond-des-Blancs"
Output: data/imports/<slug>.json (staging only, not auto-published).
"""
import argparse,json,re,unicodedata
from pathlib import Path
def slug(value):
    ascii_name="".join(c for c in unicodedata.normalize("NFKD",value) if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+","-",ascii_name.lower()).strip("-")
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--department",required=True)
    parser.add_argument("--arrondissement",required=True)
    parser.add_argument("--commune",required=True)
    args=parser.parse_args()
    destination=Path("data/imports")/(slug(args.department)+"-"+slug(args.arrondissement)+"-"+slug(args.commune)+".json")
    if destination.exists():raise SystemExit(f"File exists; refusing to overwrite: {destination}")
    destination.parent.mkdir(parents=True,exist_ok=True)
    payload={"territory":{"department":args.department,"arrondissement":args.arrondissement,"commune":args.commune},"status":"staging","sources":[],"places":[],"instructions":"Ajouter uniquement des lieux sourcés, contrôler les doublons, puis proposer une pull request."}
    destination.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(destination)
if __name__=="__main__":main()
