# YWAM Cambodia — Ministry Survey

Six or so regional leaders each report the ministries they oversee. One of them
covers Phnom Penh, Kampot, Kampong Cham and Takeo; Kampot alone has three
ministries with three different leaders. Another covers Battambang, Pursat,
Preah Vihear and Kampong Chhnang. The Siem Reap base leader reports the campus
plus three ministries outside it, each with its own leader and its own villages.

So the form is shaped like the organisation, not like a flat questionnaire:

```
you  ->  the provinces you report for  ->  a card per ministry inside each
```

Every ministry card carries its own leader, staff, and reach. A leader with four
ministries in one province fills four cards under that province.

## Two reporting windows, kept apart

The totals screen labels these separately and never blends them.

- **Training school graduates and fruit — calendar year 2025.** "How many
  students graduated from our schools in a year" only has a clean answer once the
  year is closed.
- **Everything else — as it stands today.** Staff, weekly reach, villages,
  churches served and led. These are numbers a leader can give from memory
  without going back through records, and a stale figure helps nobody.

Change the year in one place, `public/options.js`, and every label follows.

## What it asks

Fourteen questions per ministry, and a leader with four ministries answers them
four times — so every one of them has to earn its place. One of the fourteen is
only asked of campuses; see below.

Per ministry: name, one line on what it does, its leader, province, and which of
the three kinds it is.

Then **right now**: total staff and how many of them are Khmer; people reached in
a normal week; villages gone into; churches served and churches led, kept as
separate questions because supporting a church and pastoring one are different
things.

Then **2025**: students graduated from our YWAM training schools, new believers,
baptisms.

Graduates rather than enrolments, on purpose. A leader knows how many finished;
how many started is a number they'd have to go and look up, and it counts people
who dropped out as reach they didn't have.

Then in their own words: the biggest need right now.

**International staff is not a question.** It is whatever is left of a ministry's
total once its Khmer staff are counted, so the dashboard derives it rather than
asking for it twice. Only ministries that gave the split are in that bar, and the
caption says so when some didn't — otherwise a ministry that skipped the question
would be counted as entirely international.

Only three fields are required — the ministry's name, who leads it, and the
staff count. Everything else can be left blank, because a report that gets
finished beats a report that's complete.

### What it deliberately stopped asking

An earlier version asked twenty-eight questions per ministry. The staff count
was split four ways (Cambodian, international, full-time, volunteer), reach was
asked three times over (daily youth, enrolled students, weekly people), and each
training school got its own five-field row. It also asked for the town, the year
the ministry started, whether it sat on the base, the names of every village, and
a prayer request.

It also asked every leader to tick what kind of ministry each one was, from a
list of nineteen — sports, English, kids clubs, church planting and the rest.
That was the longest single control on the card, and it existed to feed one
chart on the dashboard. Both are gone.

The one-line **What it does** is not that list coming back. Nineteen tick-boxes
were a taxonomy to count by; one line in a leader's own words is a description to
read, it fits any ministry without the list having to anticipate it, and it costs
a sentence rather than a screenful of scrolling.

All of that is gone. The rule applied: a question stays only if a leader can
answer it from memory and the answer changes what the totals say. A breakdown
nobody reads costs the same to fill in as one that gets used.

## Campuses, locations and campus ministries

Every card is one of three kinds, and the difference between the last two is the
whole point.

| kind | what it is | counted as a location? |
|---|---|---|
| **A campus** | a YWAM location that currently runs a DTS | yes |
| **A ministry location** | a place of its own, no DTS | yes |
| **A ministry of the campus here** | a work belonging to the campus in its province | **no** |

**A campus with six ministries is still one place on the map.** Battambang's
ministries are Battambang. Counting them as locations made the national figure
grow every time a campus described itself properly, which punished the leaders
who answered in most detail. So campus ministries are recorded, named under
their province, and left out of the location count. The hero reads *ministry
locations* and *DTS campuses*; the campus ministries appear on the province row
— `1 location · 1 DTS campus · 2 campus ministries` — which is where they mean
something.

The third option only appears once the province **has** a campus card, and it
names it: *part of YWAM Battambang, not its own location*. Until there is a
campus there is nothing for a campus ministry to belong to, and offering it
would only invite a card that says it is part of nothing.

**Only campuses are asked about school graduates.** Most expressions are a
library, a dorm, a youth centre or a church plant, and asking those how many
students they graduated is noise on the form and a row of blanks in the
spreadsheet. One exception is deliberate: the graduates question stays on screen
for any card that **already has a figure in it**, whatever its kind, so a
location that ran a DTS during the reporting year and has since stopped can't
end up with a number counted in the national total but invisible to the person
who reported it. Changing a card's kind never clears what was typed.

`kindOf()` in `survey.js` is the single place the question is answered, and it
reads all three generations of the record: a `kind`, the older `runsDts`
boolean, or neither. Nothing needs migrating and no screen has to know that two
older shapes exist. The server mirrors it — an unknown `kind` falls back to
`runsDts`, then to `location`, so only an explicit `campus-ministry` ever takes
a row out of the location count.

## Built to hand over to the GP Impact app

The plan is for each ministry location to eventually carry its own KPIs and feed
the GP Impact dashboard. None of that is here yet — this round is still just
"how many ministries are there, and roughly what does each one do". Two pieces of
the shape are in place so the later work isn't a migration:

- **Every ministry has a stable `id`,** assigned client-side and preserved by the
  server across re-filings. A ministry is otherwise only identifiable by its
  name, and a rename would silently orphan any KPI hanging off it. Ids are
  sanitised to `[a-z0-9-]`, capped at 40 characters, and de-duplicated across the
  whole report — a bad id is replaced, never a reason to reject a real report.
- **`doing`** — one line on what the ministry actually does, asked right after
  its name. It is the second half of the question this round exists to answer,
  and it is what a GP-side directory would show under each name.

The kinds matter here too: a campus ministry is the level a GP department maps
to, while a location is the level a base maps to.

## Access

- **Reading the totals is open** to anyone with the link.
- **So is submitting.** There is no passcode. A leader opens the link, fills the
  form and sends it — nothing to remember, nothing to pass around a team, and
  nothing to reset when it leaks. A passcode written on a shared link is not a
  door lock anyway, and it was one more thing to get wrong on a phone.
- **No contact details are collected.** The survey asks a leader for their name
  and their role, and nothing that could be used to reach them — so there is
  nothing in the store to hold back, and the totals can be read by anyone with
  the link without exposing anybody. Follow-up questions go through the channels
  the team already uses.

### What that costs

Anyone who finds the link can file a report, and the store has no way to tell a
regional leader from a stranger. Two things follow, and they are accepted rather
than solved:

- A report is keyed by the reporting leader's name, so a submission under a name
  already in the store **replaces** what is there. Someone typing a name that
  already exists overwrites that leader's report.
- Nothing stops junk being added. The function still caps counts, drops unknown
  province ids and length-limits text, so a bad report is bounded — but it is
  stored.

The mitigation is that reports are few, named, and read by people who know who
should be in the list. A total that looks wrong is traceable to the name on it,
and the leader can resend to correct it.

## Sending it again

A report is filed under the name of the leader who sent it, so sending a second
time replaces the first rather than doubling every ministry in it. Leaders can
correct a number a week later without anyone having to clean up after them.

## Drafts

Every keystroke is written to `localStorage`. These are long reports written on
phones over the course of a day on connections that drop, so a half-finished
report survives a closed tab, a dead battery, and a failed submit.

## Tech

- Static frontend in `public/` — vanilla JS, no framework, no build step, no CDN
  scripts, so it works on a patchy connection
- One Netlify Function backed by [Netlify Blobs](https://docs.netlify.com/blobs/overview/):
  `ministries.mjs` at `/api/ministries` — `GET` returns every report, `POST`
  files one
- The function re-validates everything the browser sends: unknown province ids
  are dropped, counts are clamped, text is length-capped, and a ministry without
  a name, leader and province is not stored at all
- `public/provinces.js` — the 25 provinces, NCDD gazetteer spellings. The 13
  YWAM Cambodia currently works in carry `present: true`, and the picker offers
  only those: choosing from 25 meant reading past twelve places YWAM has never
  been. The rest stay one tap away behind **Show all 25 provinces**, and the
  server still validates against all 25, so starting work somewhere new is a
  link away rather than a deploy away. Add or remove a `present` flag as the
  national picture changes — that one field drives the picker, the "x of y"
  count on the totals screen and the not-yet-reported note. That count widens
  by itself if a report ever arrives from a province outside the 13, so it can
  never read "14 of 13".
- `public/options.js` — the reporting year, in one place. Change it there and
  every label that names a year follows.

## The logo

`public/logo.svg` is the YWAM Cambodia mark — the country in brand blue with the
white figure inside — traced from the supplied artwork into two paths, about
4.5KB, on a transparent background so it sits on the white topbar and the black
hero alike. It is one file used in both places, so the mark can't drift between
them.

The tab icon is a **different crop on purpose**. `public/favicon.svg` is the
figure alone on a blue tile, because at 16px the country outline collapses into a
blue smudge while the figure still reads. `public/icon-180.png` is the full mark
on black, as the artwork was supplied, for an iOS home screen.

The blue is `#2F7DC6` — the `--brand` token the rest of the app already uses,
rather than the slightly duller blue measured off the supplied JPEG. If the real
brand blue is neither, change it in `logo.svg`, `favicon.svg` and `--brand` in
`styles.css` together.

The **Download as a spreadsheet** button on the totals screen writes one row per
ministry, with a UTF-8 BOM so Excel opens Khmer and accented names correctly, and
a leading quote on any cell starting with `=`, `+`, `-` or `@` so a spreadsheet
can't read a typed answer as a formula.

## Deploying

The survey is the whole repository, so a Netlify site pointed at this repo needs
no build command, no publish directory and no **Base directory** — the
`netlify.toml` at the root publishes `public/` and picks up the function. Pushing
to the default branch triggers a deploy.

There is nothing to configure — no environment variables, no secrets. The site
is live at <https://ywamstaff.netlify.app>.

If a `SURVEY_PASSCODE` variable is still set on the site from an earlier version,
it is now ignored and can be deleted.

## Local development

```
npm install
netlify dev
```
