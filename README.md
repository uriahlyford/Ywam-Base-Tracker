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

- **School students and fruit — calendar year 2025.** "How many students go
  through our schools in a year" only has a clean answer once the year is
  closed.
- **Everything else — as it stands today.** Staff, sports, English classes,
  villages, churches served and led. These are numbers a leader can give from
  memory without going back through records, and a stale figure helps nobody.

Change the year in one place, `public/options.js`, and every label follows.

## What it asks

Fifteen questions per ministry, and a leader with four ministries answers them
four times — so every one of them has to earn its place.

Per ministry: name, its leader, province, and what kind of ministry it is
(sports, English, kids clubs, church planting, media, health, vocational,
justice, and a dozen more — tick as many as apply).

Then **right now**: total staff and how many of them are Cambodian; people
reached in a normal week; villages gone into; churches served and churches led,
kept as separate questions because supporting a church and pastoring one are
different things.

Then **2025**: students through the schools and courses, how many graduated, new
believers, baptisms.

Then in their own words: the biggest need right now.

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

All of that is gone. The rule applied: a question stays only if a leader can
answer it from memory and the answer changes what the totals say. A breakdown
nobody reads costs the same to fill in as one that gets used.

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
  province and ministry-type ids and length-limits text, so a bad report is
  bounded — but it is stored.

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
- The function re-validates everything the browser sends: unknown province and
  ministry-type ids are dropped, counts are clamped, text is length-capped, and
  a ministry without a name, leader and province is not stored at all
- `public/provinces.js` — the 25 provinces, NCDD gazetteer spellings
- `public/options.js` — the ministry-type vocabulary and the reporting year.
  Adding an id here means adding it to `MINISTRY_TYPE_IDS` in
  `netlify/functions/ministries.mjs`, which drops ids it doesn't recognise.

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
