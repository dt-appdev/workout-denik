#!/usr/bin/env python3
"""Sestaví js/fedb.js (F0-03) z databáze free-exercise-db.

free-exercise-db (https://github.com/yuhonas/free-exercise-db) je volné dílo
(licence Unlicense), proto ji smíme zkopírovat a upravit. Appka ji načítá až při
prvním hledání, ne při startu.

Spuštění z kořene repa:  python3 tools/fedb/build.py
Potřebuje internet (stáhne exercises.json z pevné verze níže). Nic se neinstaluje.

Vstupy vedle skriptu:
  cesky.tsv  – český název ke každému cviku (návrh, ručně upravitelný),
  shody.tsv  – cviky, které už jsou ve výchozí databázi appky (EX_DB) → „už máš“.
"""
import json, os, re, sys, urllib.request

COMMIT = "a859101d633a01c4a1a920d6a8ce41dabba0705f"  # verze free-exercise-db (23. 9. 2026)
SRC = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/%s/dist/exercises.json" % COMMIT
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "js", "fedb.js")

# partie free-exercise-db → klíče MUSCLE_MAP.NAMES v js/app.js
MUSCLE = {"abdominals": "abs", "abductors": "glutes", "adductors": "adductor", "biceps": "biceps",
          "calves": "calves", "chest": "chest", "forearms": "forearm", "glutes": "glutes",
          "hamstrings": "hams", "lats": "lats", "lower back": "lowback", "middle back": "upperback",
          "neck": "neck", "quadriceps": "quads", "shoulders": "delts", "traps": "traps", "triceps": "triceps"}
# vybavení → klíče EQUIP v js/app.js (bez vybavení = vlastní váha)
EQUIP = {"barbell": "barbell", "e-z curl bar": "barbell", "dumbbell": "dumbbell", "cable": "cable",
         "machine": "machine", "body only": "bodyweight", None: "bodyweight", "kettlebells": "kettlebell",
         "bands": "band", "medicine ball": "other", "exercise ball": "other", "foam roll": "other", "other": "other"}
# kategorie → jedno písmeno; posilovací (S, W, O, M) se v hledání ukazují vždy, ostatní na přepínač
CAT = {"strength": "S", "powerlifting": "W", "olympic weightlifting": "O", "strongman": "M",
       "plyometrics": "P", "stretching": "T", "cardio": "C"}


def tsv(name):
    out = {}
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line and not line.startswith("#"):
                k, v = line.split("\t", 1)
                out[k] = v.strip()
    return out


def equip(x):
    n = x["name"].lower()
    if "smith" in n:
        return "smith"
    e = EQUIP[x["equipment"]]
    # shyby, kliky na bradlech apod. mají ve free-exercise-db vybavení „other“
    if e == "other" and re.search(r"\b(dips?|chins?|chin-up|pull-?ups?|muscle up|rope climb)\b", n) \
            and not re.search(r"band|weighted", n):
        return "bodyweight"
    return e


def kind(x, e):
    n, c = x["name"].lower(), CAT[x["category"]]
    if c == "C":
        return "time" if re.search(r"rope jumping|stairmaster|step mill", n) else "dist"
    if c == "T" or re.search(r"^plank$|side bridge|isometric|balance board|vacuum|handed hang", n):
        return "time"
    if re.search(r"farmer|yoke walk|rickshaw carry", n):
        return "timew"
    if "assisted" in n:
        return "assist"
    if n.startswith("weighted") and e in ("bodyweight", "other"):
        return "bwplus"
    if e == "bodyweight":
        return "bw"
    return "wr"


def main():
    print("Stahuji", SRC)
    data = json.load(urllib.request.urlopen(SRC))
    cz, same = tsv("cesky.tsv"), tsv("shody.tsv")
    missing = [x["id"] for x in data if x["id"] not in cz]
    if missing:
        sys.exit("Chybí český název v cesky.tsv: " + ", ".join(missing))
    out = []
    for x in data:
        e = equip(x)
        pri = []
        for m in x["primaryMuscles"]:
            k = MUSCLE[m]
            if k not in pri:
                pri.append(k)
        sec = []
        for m in x["secondaryMuscles"]:
            k = MUSCLE[m]
            if k not in pri and k not in sec:
                sec.append(k)
        o = {"id": x["id"], "n": x["name"], "cz": cz[x["id"]], "c": CAT[x["category"]], "e": e,
             "k": kind(x, e), "p": pri, "s": sec[:3],  # nejvýš 3 pomocné partie, jako v F0-02
             "d": [s.strip() for s in x["instructions"] if s.strip()]}
        if not x["images"]:
            o["ni"] = 1  # bez obrázku
        if x["id"] in same:
            o["h"] = same[x["id"]]
        out.append(o)
    body = ",\n".join(json.dumps(o, ensure_ascii=False, separators=(",", ":")) for o in out)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Databáze cviků free-exercise-db pro hledání při přidání cviku (F0-03).\n"
                "   Zdroj: https://github.com/yuhonas/free-exercise-db (licence Unlicense, volné dílo),\n"
                "   verze " + COMMIT[:7] + ". Český název je náš návrh (tools/fedb/cesky.tsv).\n"
                "   NEEDITOVAT RUČNĚ: soubor vytváří tools/fedb/build.py.\n"
                "   Pole: id, n název, cz český název, c kategorie (S posilování, W silový trojboj,\n"
                "   O vzpírání, M strongman, P plyometrie, T protahování, C kardio), e vybavení, k typ zápisu,\n"
                "   p hlavní a s pomocné partie, d návod po krocích, ni bez obrázku, h stejný cvik v EX_DB.\n"
                "   Načítá se až při prvním hledání (js/app.js, fedbLoad). */\n"
                "const FEDB_IMG=\"https://raw.githubusercontent.com/yuhonas/free-exercise-db/" + COMMIT + "/exercises/\";\n"
                "const FEDB=[\n" + body + "\n];\n")
    print("Hotovo:", len(out), "cviků,", os.path.getsize(OUT) // 1024, "kB")


if __name__ == "__main__":
    main()
