#!/usr/bin/env python3
"""Refresh the public website's reproducible Daily Nexus grade snapshot.
No credentials or database writes. Python standard library only.
"""
import csv
import gzip
import hashlib
import io
import json
import re
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SOURCE = 'https://raw.githubusercontent.com/dailynexusdata/grades-data/main/courseGrades.csv'
DEST = Path(__file__).resolve().parents[1] / 'data' / 'course-grades.json.gz'
KEYS = ['Ap', 'A', 'Am', 'Bp', 'B', 'Bm', 'Cp', 'C', 'Cm', 'Dp', 'D', 'Dm', 'F']


def count(value):
    result = float(value or 0)
    if result < 0 or not result.is_integer():
        raise ValueError(f'Invalid grade count: {value}')
    return int(result)


def main():
    raw = urllib.request.urlopen(SOURCE, timeout=60).read()
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    required = {'course', 'quarter', 'year', 'instructor', 'nLetterStudents', 'nPNPStudents', 'P', 'S', 'su', *KEYS}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError('Upstream CSV schema changed')
    courses = defaultdict(list)
    records = 0
    omitted = 0
    for row in reader:
        # Source codes use padded fields; preserve multiword departments and
        # historical alphanumeric numbers such as ED SPS390W.
        match = re.fullmatch(r'(.+?)\s{2,}(\S.*)', row['course'].strip())
        if not match:
            match = re.fullmatch(r'(.+?)\s+(\d\S*)', row['course'].strip())
        if not match:
            raise ValueError(f'Unrecognized course code: {row["course"]!r}')
        department = ' '.join(match[1].split())
        number = ' '.join(match[2].split())
        season = row['quarter'].strip()
        year = int(row['year'])
        if season not in ['Winter', 'Spring', 'Summer', 'Fall'] or not 2000 <= year <= 2100:
            raise ValueError(f'Invalid quarter: {season} {year}')
        grades = [count(row[key]) for key in KEYS]
        p, s, u = count(row['P']), count(row['S']), count(row['su'])
        total = count(row['nLetterStudents']) + count(row['nPNPStudents'])
        if total == 0:
            total = sum(grades) + p + s + u
        if total == 0:
            omitted += 1
            continue
        # NP is not a separate CSV column. Keep it unknown (null), not an inferred zero.
        record = [f'{season} {year}', row['instructor'].strip() or None, total, *grades, p, None, s, u]
        courses[(department, number)].append(record)
        records += 1
    if records < 1000 or len(courses) < 100:
        raise ValueError('Unexpectedly small upstream dataset; leaving previous snapshot intact')
    snapshot = {
        'version': 1, 'source': SOURCE, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'retrievedAt': datetime.now(timezone.utc).isoformat(), 'sourceRecords': records + omitted,
        'includedRecords': records, 'omittedEmptyRecords': omitted,
        'courses': [[dept, number, rows] for (dept, number), rows in sorted(courses.items())],
    }
    encoded = json.dumps(snapshot, ensure_ascii=True, separators=(',', ':')).encode()
    compressed = gzip.compress(encoded, mtime=0)
    DEST.parent.mkdir(parents=True, exist_ok=True)
    temporary = DEST.with_suffix('.tmp')
    temporary.write_bytes(compressed)
    temporary.replace(DEST)
    print(json.dumps({'courses': len(courses), 'records': records, 'omittedEmptyRecords': omitted,
                      'jsonBytes': len(encoded), 'gzipBytes': len(compressed), 'sha256': snapshot['sourceSha256']}))


if __name__ == '__main__':
    main()
