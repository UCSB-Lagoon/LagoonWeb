# Product data review — 2026-09-21

A read-only pass over the live database, taken alongside the review of the
campus redesign. Every number here came from a query against production on
21 September 2026; they will move. What is meant to outlive the numbers is
which questions were worth asking and which answers were surprising.

Counts are as-of, not tracked. Re-run before quoting any of it.

---

## Growth is real and accelerating

163 users, 88 of them since 1 August. Weekly signups through the fall ramp:
13 → 6 → 22 → 27, with 14 in the first day of the week this was written.

DAU 46 / WAU 70 / MAU 95. A **48% DAU/MAU ratio** is a strong stickiness
number for a pre-traction product and is the single most encouraging thing in
this document.

## The schedule import is the biggest problem

202 started, 58 succeeded, 129 failed — **a 29% success rate** — and it has
been getting worse, not better:

| version | started | success rate |
|---|---|---|
| 1.7.0 | 5 | 60% |
| 1.8.0 | 40 | 33% |
| 1.9.0 | 26 | 23% |
| 1.10.0 | 59 | 31% |
| 1.12.0 | 59 | 22% |
| 1.13.0 | 10 | 40% |

For an import-first product this is the whole funnel. `schedule_empty_state`
fired 232 times, which is the downstream cost of it.

**128 of the 129 failures record no reason, no error and no stage.** The one
exception is a single `ocr_empty` from 1.16.0, so the instrumentation only
just landed. Getting 1.16+ adoption up is the fastest path to diagnosing any
of this — until then the failure mode is genuinely unknown, not merely
unfixed.

## Onboarding completion collapsed

7 of 88 fall signups (8%) have `onboarding_completed_at` set, against roughly
50% in spring.

This is **not** a write bug — the most recent timestamp was the same day.
And `major_code` is set on 18 of 27 in a recent week, so people are getting
partway and dropping before the end. Something late in the flow is losing
them.

## Two features quietly stopped being found

| | spring (75 users) | fall (88 users) |
|---|---|---|
| has a friend | 21.3% | **2.3%** |
| GE progress | 22.7% | **3.4%** |
| has schedule | 26.7% | 52.3% |
| push token | 45.3% | 80.7% |
| gamification profile | 84.0% | 98.9% |

The bottom three are a real improvement — push opt-in and schedule setup
nearly doubled. But the social graph and the GE planner have effectively
stopped being discovered by new users.

Worth holding against the marketing copy: "know who's in your class" is a
headline promise on the new homepage, and the fall friend rate is 2.3%.

## Retention, read honestly

| cohort | users | active in last 14d |
|---|---|---|
| April | 47 | 4.3% |
| August | 20 | **50%** |
| September | 68 | 97% |

September's 97% is meaningless — they just signed up. April is near-total
summer churn. **August is the only honest number: 50% still active at four to
six weeks**, which is a decent signal.

## Data quality

- **`election_pulse_votes` holds 3,612 votes from 3 distinct users** over two
  days in April. Test or stuffed data. Nothing in `lib/` or `app/` reads that
  table, so `/stats` is unaffected — but it must never feed a metric.
- **`class_level` has two competing vocabularies in one column**: "First
  Year/Second Year/Third Year/Fourth Year" (89 rows) and
  "Freshman/Sophomore/Junior/Senior" (18 rows), from two onboarding versions.
  `web/lib/stats-helpers.ts` normalises it for the web; anything app-side
  reading the raw column will mis-segment. 34% are null entirely.
- **Referrals are not working**: 123 clicks → 1 conversion, though all 163
  users have a `referral_code`. Captain applications: 1.

---

## The major tracker (from Mars's feedback, 21 Sep)

Two pieces of feedback arrived in `user_feedback` — the **iOS-side** table —
from a signed-in fall user. They are the first feedback of any kind since
April, a five-month gap, which makes them worth more than their volume
suggests.

> Couldn't find applied math major 0_0 / it would be cool to have multiple
> major tracking … For first years, importing APs could be helpful.

### The first ask is a data migration, not a feature

The tracker is data-driven:

```
major_requirements      (85 majors × ~4 requirement groups = 349 rows)
  └ major_requirement_items  (595 rows; only two item_types:
                              `course` 335, `course_option_group` 260)
      └ major_course_options (988 rows resolving the groups)
```

**Applied Mathematics is simply absent.** The list has `MATH_BA`, `MATH_BS`,
`MATHSEC_BS`, `ECONMATH_BA`, `FINMATH_BS` and `ACTSCI_BS` — no Applied Math.
`MATH_BS`'s entire sheet is 9 items across 4 groups, so adding Applied Math
means roughly 4 requirement rows and 9 item rows in the same shape. Hours,
and it unblocks a named user.

### What the schema cannot currently express

| Behaviour | Schema reality |
|---|---|
| AP importer | ✅ `user_completed_courses.source` exists; all 99 rows are `'manual'`, so `'ap'` slots in cleanly |
| Grade rules (C− ≠ C, B− doesn't open MATH 8, AP out of pre-major GPA) | ❌ **`grade` is NULL on all 99 rows** — grades are not captured at all |
| "two majors share more than 8 upper-division units" | ❌ no unit count anywhere in the schema |
| Double major | ❌ `user_profiles.major_code` is a single `text` column |

Any implementation of the last three is carrying its own hardcoded copy of the
requirement sheets, the AP chart and the unit counts — a second dataset that
will drift from these 85 majors.

### Suggested order

1. **Applied Math rows** — data only, unblocks Mars now.
2. **Start writing `grade`** on completed courses. Every grade rule depends on
   it and nothing above works until it exists.
3. **AP importer** via `source='ap'` — cheapest real feature, and first-years
   are 56% of known class levels.
4. **Double major last** — needs a new table, and is the rarest case.

`ONBOARDING.md` §5b applies throughout: the iOS repo owns this schema and web
migrations are additive only, so the double-major table is an app-repo
migration.

### This does not belong on the website

Checked and confirmed on 21 Sep: the web app reads **none** of
`major_requirements`, `major_requirement_items`, `major_course_options`,
`user_degree_plan`, `user_completed_courses`, `ge_progress` or `ge_courses`,
and has no route or component for majors, degrees, planning or requirements.
`major_code` appears only as a display label (`/me`, the leaderboard tagline)
and as the "Top majors" bar chart on `/stats`, which reads the `stats_majors`
view. There is no requirement logic on the web at all.

Given GE progress adoption has already fallen to 3.4%, a second copy of the
tracker on the web would split a feature that is currently struggling to be
found even once.
