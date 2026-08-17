// YWAM Cambodia ministry survey.
//
// The shape of the form follows the shape of the organisation. A handful of
// regional leaders each report for several provinces, and a province holds one
// or more ministries, each with its own leader — a base leader whose campus and
// three outside ministries all sit in one province fills four cards under that
// province, each naming the person who runs it. So the form goes
//
//   you  ->  the provinces you report for  ->  a card per ministry inside each
//
// rather than one flat questionnaire.
//
// Two reporting windows, kept apart on purpose. School students and fruit are
// asked for the closed calendar year, because "how many students go through our
// schools in a year" only has a clean answer once the year is over. Everything
// else — staff, sports, English classes, churches — is asked as it stands today,
// because that's the number a leader can give from memory without digging
// through records.
//
// Every keystroke is written to a draft in localStorage. These are long reports
// written on phones over the course of a day, often on a connection that drops;
// losing a half-finished one would cost more than the report is worth.

(function () {
  "use strict";

  var DRAFT_KEY = "ywam-survey-draft-v1";
  var YEAR = window.REPORT_YEAR;

  var PROVINCES = window.PROVINCES || [];

  var provinceById = {};
  var provinceOrder = {};
  PROVINCES.forEach(function (p, i) {
    provinceById[p.id] = p;
    provinceOrder[p.id] = i;
  });

  // ---------- state ----------

  var state = {
    // The landing page. Most people open this to see where YWAM Cambodia is at;
    // the handful of leaders filing a report arrive knowing they came to do it,
    // and they see the national picture before being asked for anything.
    tab: "results",
    step: "you", // you | ministries | review | done
    report: blankReport(),
    openMinistry: null,
    error: "",
    busy: false,
    results: null,
    resultsError: "",
    loadingResults: false,
  };

  function blankReport() {
    return {
      leaderName: "",
      leaderRole: "",
      provinceIds: [],
      ministries: [],
      notes: "",
    };
  }

  function blankMinistry(provinceId) {
    return {
      id: uid(),
      provinceId: provinceId,
      name: "",
      leaderName: "",
      // as of today
      staffTotal: "",
      staffCambodian: "",
      peopleWeekly: "",
      villagesReached: "",
      churchesServed: "",
      churchesLed: "",
      // for the reporting year
      schoolGraduates: "",
      newBelievers: "",
      baptisms: "",
      // words
      biggestNeed: "",
    };
  }

  var seq = 0;
  function uid() {
    seq += 1;
    return "m" + Date.now().toString(36) + seq.toString(36);
  }

  // ---------- draft ----------

  var flagTimer = null;
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state.report));
    } catch (e) {
      /* a full or disabled localStorage shouldn't break typing */
    }
    var flag = document.getElementById("saved-flag");
    if (!flag) return;
    flag.hidden = false;
    clearTimeout(flagTimer);
    flagTimer = setTimeout(function () { flag.hidden = true; }, 1600);
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;

      var base = blankReport();
      Object.keys(base).forEach(function (k) {
        if (saved[k] !== undefined && saved[k] !== null) base[k] = saved[k];
      });
      // Bring an older draft up to the current ministry shape rather than dropping it.
      base.ministries = (base.ministries || []).map(function (m) {
        var fresh = blankMinistry(m.provinceId || "");
        Object.keys(fresh).forEach(function (k) {
          if (m[k] !== undefined && m[k] !== null) fresh[k] = m[k];
        });
        fresh.id = m.id || uid();
        // A draft written against the old per-school sub-form still has the rows
        // in it. The two numbers that replaced it are exactly their sums, so add
        // them up rather than making the leader type them in again.
        if (Array.isArray(m.schools) && m.schools.length) {
          if (fresh.schoolGraduates === "") fresh.schoolGraduates = sumRows(m.schools, "graduates");
        }
        return fresh;
      });
      state.report = base;
    } catch (e) {
      /* a corrupt draft is not worth a crash */
    }
  }

  // Only used to fold an old draft's school rows into the two numbers that
  // replaced them. Returns "" for a set of rows that carried no figure at all,
  // so an empty sub-form doesn't become a reported zero.
  function sumRows(rows, key) {
    var total = 0;
    var any = false;
    rows.forEach(function (row) {
      if (row && row[key] !== "" && row[key] !== undefined && row[key] !== null) {
        any = true;
        total += n(row[key]);
      }
    });
    return any ? total : "";
  }

  // ---------- helpers ----------

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function n(v) {
    var x = parseFloat(v);
    return Number.isFinite(x) && x >= 0 ? x : 0;
  }

  function fmt(x) {
    return Number(x || 0).toLocaleString("en-US");
  }

  function plural(count, one, many) {
    return count === 1 ? one : many;
  }

  function provinceName(id) {
    var p = provinceById[id];
    return p ? p.name : id;
  }

  function ministriesIn(provinceId) {
    return state.report.ministries.filter(function (m) { return m.provinceId === provinceId; });
  }

  function findMinistry(id) {
    for (var i = 0; i < state.report.ministries.length; i++) {
      if (state.report.ministries[i].id === id) return state.report.ministries[i];
    }
    return null;
  }

  function ministryLabel(m) {
    return m.name ? esc(m.name) : '<span class="unnamed">Untitled ministry</span>';
  }

  function ministrySub(m) {
    var bits = [];
    if (m.leaderName) bits.push("Led by " + m.leaderName);
    if (m.provinceId) bits.push(provinceName(m.provinceId));
    if (m.staffTotal !== "") bits.push(n(m.staffTotal) + " staff");
    return bits.length ? esc(bits.join(" · ")) : "Tap to fill in";
  }

  // A ministry is only worth submitting once it has a name, a leader and a staff
  // count — those are what make it countable now and chaseable later.
  function missingFrom(m) {
    var missing = [];
    if (!m.name.trim()) missing.push("a name");
    if (!m.leaderName.trim()) missing.push("who leads it");
    if (m.staffTotal === "") missing.push("a staff count");
    return missing;
  }

  // ---------- render ----------

  var app = document.getElementById("app");

  function render() {
    document.getElementById("tab-form").classList.toggle("active", state.tab === "form");
    document.getElementById("tab-results").classList.toggle("active", state.tab === "results");

    if (state.tab === "results") {
      app.innerHTML = renderResults();
    } else if (state.step === "you") {
      app.innerHTML = renderYou();
    } else if (state.step === "ministries") {
      app.innerHTML = renderMinistries();
    } else if (state.step === "review") {
      app.innerHTML = renderReview();
    } else {
      app.innerHTML = renderDone();
    }
    window.scrollTo(0, 0);
  }

  function errorBox() {
    return state.error ? '<div class="error">' + esc(state.error) + "</div>" : "";
  }

  // --- step 1: you and your provinces ---

  function renderYou() {
    var r = state.report;
    var picks = PROVINCES.map(function (p) {
      var on = r.provinceIds.indexOf(p.id) !== -1;
      var count = ministriesIn(p.id).length;
      return (
        '<button type="button" class="pick' + (on ? " on" : "") + '" data-province="' + p.id + '">' +
          '<span class="pick-box" aria-hidden="true">✓</span>' +
          '<span class="pick-name">' + esc(p.name) +
            (count ? ' <span class="pick-count">(' + count + ")</span>" : "") +
          "</span>" +
        "</button>"
      );
    }).join("");

    return (
      '<div class="step-head">' +
        '<div class="step-kicker">Step 1 of 3</div>' +
        '<h1 class="step-title">Who is reporting</h1>' +
        '<p class="step-sub">You fill this in once. Everything after it is about the ministries you oversee.</p>' +
      "</div>" +
      errorBox() +
      '<div class="card">' +
        '<div class="field">' +
          '<label class="label" for="f-leaderName">Your name</label>' +
          '<input type="text" id="f-leaderName" data-bind="leaderName" value="' + esc(r.leaderName) + '" autocomplete="name" />' +
        "</div>" +
        '<div class="field" style="margin-bottom:0">' +
          '<label class="label" for="f-leaderRole">Your role <span class="label-hint">e.g. Phnom Penh base leader</span></label>' +
          '<input type="text" id="f-leaderRole" data-bind="leaderRole" value="' + esc(r.leaderRole) + '" />' +
        "</div>" +
      "</div>" +
      '<div class="card">' +
        '<label class="label">Which provinces do you report for?</label>' +
        '<p class="field-note">Pick every province you have ministry in, including ones you oversee from somewhere else. You list the ministries inside each one on the next step.</p>' +
        '<div class="pick-grid">' + picks + "</div>" +
      "</div>" +
      '<button class="btn" data-action="to-ministries">Continue</button>'
    );
  }

  // --- step 2: ministries, grouped by province ---

  function renderMinistries() {
    var r = state.report;
    var blocks = r.provinceIds.map(function (pid) {
      var list = ministriesIn(pid);
      return (
        '<section class="prov-block">' +
          '<div class="prov-block-head">' +
            '<div class="prov-block-name">' + esc(provinceName(pid)) + "</div>" +
            '<div class="prov-block-count">' + list.length + " " + plural(list.length, "ministry", "ministries") + "</div>" +
          "</div>" +
          (list.length
            ? list.map(renderMinistryCard).join("")
            : '<div class="prov-block-empty">No ministries listed here yet.</div>') +
          '<button type="button" class="btn-add" data-add-ministry="' + pid + '">+ Add a ministry in ' + esc(provinceName(pid)) + "</button>" +
        "</section>"
      );
    }).join("");

    var total = r.ministries.length;

    return (
      '<div class="step-head">' +
        '<div class="step-kicker">Step 2 of 3</div>' +
        '<h1 class="step-title">Your ministries</h1>' +
        '<p class="step-sub">One card per ministry, under the province it sits in. If a province has three ministries with three different leaders, add three cards. Only the name, the leader and the staff count are required — fill in the rest where you know it, and leave anything you don\'t.</p>' +
      "</div>" +
      errorBox() +
      blocks +
      '<div class="btn-row">' +
        '<button class="btn-ghost" data-action="to-you">Back</button>' +
        '<button class="btn" data-action="to-review">Review ' + total + " " + plural(total, "ministry", "ministries") + "</button>" +
      "</div>"
    );
  }

  function renderMinistryCard(m) {
    var open = state.openMinistry === m.id;
    return (
      '<article class="min-card' + (open ? " open" : "") + '">' +
        '<button type="button" class="min-summary" data-toggle-ministry="' + m.id + '">' +
          '<span class="min-summary-text">' +
            '<span class="min-summary-name">' + ministryLabel(m) + "</span>" +
            '<span class="min-summary-sub">' + ministrySub(m) + "</span>" +
          "</span>" +
          '<span class="min-caret">' + (open ? "▲" : "▼") + "</span>" +
        "</button>" +
        (open ? '<div class="min-body">' + renderMinistryBody(m) + "</div>" : "") +
      "</article>"
    );
  }

  function fieldWrap(label, hint, control) {
    return (
      '<div class="field-sm">' +
        '<label class="label-sm">' + esc(label) +
          (hint ? ' <span class="opt">' + esc(hint) + "</span>" : "") +
        "</label>" +
        control +
      "</div>"
    );
  }

  function numField(m, key, label, hint) {
    return fieldWrap(label, hint,
      '<input type="number" min="0" inputmode="numeric" data-min="' + m.id + '" data-key="' + key + '" value="' + esc(m[key]) + '" />');
  }

  function textField(m, key, label, hint) {
    return fieldWrap(label, hint,
      '<input type="text" data-min="' + m.id + '" data-key="' + key + '" value="' + esc(m[key]) + '" />');
  }

  function areaField(m, key, label, hint) {
    return fieldWrap(label, hint,
      '<textarea data-min="' + m.id + '" data-key="' + key + '">' + esc(m[key]) + "</textarea>");
  }

  function renderMinistryBody(m) {
    var provinceOptions = state.report.provinceIds.map(function (pid) {
      return '<option value="' + pid + '"' + (pid === m.provinceId ? " selected" : "") + ">" + esc(provinceName(pid)) + "</option>";
    }).join("");

    return (
      '<div class="sect">' +
        '<div class="sect-title">The ministry</div>' +
        textField(m, "name", "Ministry name", "what you call it") +
        textField(m, "leaderName", "Who leads it", "the person responsible on the ground") +
        fieldWrap("Province", "", '<select data-min="' + m.id + '" data-key="provinceId">' + provinceOptions + "</select>") +
      "</div>" +

      '<div class="sect">' +
        '<div class="sect-title">Staff — right now</div>' +
        numField(m, "staffTotal", "Total staff in this ministry") +
        '<div style="margin-top:14px">' +
          numField(m, "staffCambodian", "Of those, how many are Khmer", "optional") +
        "</div>" +
      "</div>" +

      '<div class="sect">' +
        '<div class="sect-title">Who you reach — right now</div>' +
        numField(m, "peopleWeekly", "People you reach in a normal week", "all ages — a typical week, not a one-off event") +
        numField(m, "villagesReached", "Villages or communities you go into", "optional") +
      "</div>" +

      '<div class="sect">' +
        '<div class="sect-title">Local churches — right now</div>' +
        numField(m, "churchesServed", "Churches you serve", "you support them, someone else leads") +
        numField(m, "churchesLed", "Churches you lead", "one of your staff is the pastor or leader") +
      "</div>" +

      '<div class="sect">' +
        '<div class="sect-title">' + YEAR + "</div>" +
        '<p class="field-note">Skip anything that didn\'t happen.</p>' +
        numField(m, "schoolGraduates", "Students graduated from our YWAM training schools", "optional") +
        '<div class="pair" style="margin-top:14px">' +
          numField(m, "newBelievers", "New believers", "optional") +
          numField(m, "baptisms", "Baptisms", "optional") +
        "</div>" +
      "</div>" +

      '<div class="sect">' +
        '<div class="sect-title">In your words</div>' +
        areaField(m, "biggestNeed", "Biggest need right now", "optional") +
      "</div>" +

      '<div class="sect min-actions">' +
        '<button type="button" class="btn-link" data-remove-ministry="' + m.id + '">Remove this ministry</button>' +
        '<button type="button" class="icon-btn" data-toggle-ministry="' + m.id + '">Done</button>' +
      "</div>"
    );
  }

  // --- step 3: review and send ---

  function renderReview() {
    var r = state.report;

    var blocks = r.provinceIds.map(function (pid) {
      return ministriesIn(pid).map(function (m) {
        var missing = missingFrom(m);
        var facts = [];
        if (m.staffTotal !== "") facts.push(n(m.staffTotal) + " staff");
        if (m.peopleWeekly !== "") facts.push(fmt(n(m.peopleWeekly)) + " people a week");
        if (m.schoolGraduates !== "") facts.push(fmt(n(m.schoolGraduates)) + " school graduates in " + YEAR);
        if (m.churchesServed !== "" || m.churchesLed !== "") {
          facts.push(n(m.churchesServed) + " churches served, " + n(m.churchesLed) + " led");
        }
        return (
          '<div class="rev-block">' +
            '<div class="rev-prov">' + esc(provinceName(pid)) + "</div>" +
            '<div class="rev-name">' + ministryLabel(m) +
              (m.leaderName ? ' <span class="rev-by">— ' + esc(m.leaderName) + "</span>" : "") +
            "</div>" +
            (facts.length ? '<div class="rev-facts">' + esc(facts.join(" · ")) + "</div>" : "") +
            (missing.length ? '<div class="rev-missing">Still needs ' + esc(missing.join(", ")) + "</div>" : "") +
          "</div>"
        );
      }).join("");
    }).join("");

    var t = totalsFor([reportForSubmit()]);

    return (
      '<div class="step-head">' +
        '<div class="step-kicker">Step 3 of 3</div>' +
        '<h1 class="step-title">Check and send</h1>' +
        '<p class="step-sub">This is what gets added to the national totals. You can send it and still change it later — a second report from you replaces the first.</p>' +
      "</div>" +
      errorBox() +
      '<div class="tiles">' +
        tile(t.provinces, "provinces") +
        tile(t.ministries, "ministries") +
        tile(t.staff, "staff") +
      "</div>" +
      '<div class="card">' + (blocks || '<p class="who">No ministries added yet.</p>') + "</div>" +
      '<div class="card">' +
        '<div class="field">' +
          '<label class="label" for="f-notes">Anything else we should know <span class="label-hint">optional</span></label>' +
          '<textarea id="f-notes" data-bind="notes">' + esc(r.notes) + "</textarea>" +
        "</div>" +
      "</div>" +
      '<div class="btn-row">' +
        '<button class="btn-ghost" data-action="to-ministries">Back</button>' +
        '<button class="btn" data-action="submit"' + (state.busy ? " disabled" : "") + ">" +
          (state.busy ? "Sending…" : "Send my report") +
        "</button>" +
      "</div>"
    );
  }

  function renderDone() {
    return (
      '<div class="card success">' +
        '<div class="success-mark">✓</div>' +
        "<h2>Thank you</h2>" +
        "<p>Your report is in. If something changes, edit it and send again — your new report replaces the old one.</p>" +
      "</div>" +
      '<div class="btn-row">' +
        '<button class="btn-ghost" data-action="to-ministries">Edit my report</button>' +
        '<button class="btn" data-action="see-results">See the totals</button>' +
      "</div>"
    );
  }

  function tile(num, cap) {
    return '<div class="tile"><div class="tile-num num">' + fmt(num) + '</div><div class="tile-cap">' + esc(cap) + "</div></div>";
  }

  // ---------- totals ----------

  var CURRENT_SUMS = [
    "staffTotal", "staffCambodian", "peopleWeekly", "villagesReached",
    "churchesServed", "churchesLed",
  ];
  var YEAR_SUMS = ["schoolGraduates", "newBelievers", "baptisms"];

  function totalsFor(reports) {
    var t = { reports: reports.length, ministries: 0, provinces: 0, byProvince: {} };
    CURRENT_SUMS.concat(YEAR_SUMS).forEach(function (k) { t[k] = 0; });

    // International staff is not a question — it is whatever is left of a
    // ministry's total once its Cambodian staff are counted. Only ministries
    // that gave the split can be subtracted, so their totals are tracked
    // separately; using the national total would count every ministry that
    // skipped the question as fully international.
    t.staffSplitKnown = 0;
    t.ministriesWithSplit = 0;

    var provinceSeen = {};

    reports.forEach(function (r) {
      (r.ministries || []).forEach(function (m) {
        t.ministries += 1;
        CURRENT_SUMS.forEach(function (k) { t[k] += n(m[k]); });
        YEAR_SUMS.forEach(function (k) { t[k] += n(m[k]); });

        if (m.staffCambodian !== "" && m.staffCambodian !== undefined && m.staffCambodian !== null) {
          t.staffSplitKnown += n(m.staffTotal);
          t.ministriesWithSplit += 1;
        }

        var pid = m.provinceId;
        if (!pid) return;
        provinceSeen[pid] = true;
        if (!t.byProvince[pid]) t.byProvince[pid] = { ministries: 0, staff: 0, weekly: 0 };
        t.byProvince[pid].ministries += 1;
        t.byProvince[pid].staff += n(m.staffTotal);
        t.byProvince[pid].weekly += n(m.peopleWeekly);
      });
    });

    t.provinces = Object.keys(provinceSeen).length;
    t.staff = t.staffTotal;
    // A leader who put more Cambodian staff than total staff would otherwise
    // drive this negative, so it floors at zero.
    t.staffInternational = Math.max(0, t.staffSplitKnown - t.staffCambodian);
    return t;
  }

  // ---------- the totals screen ----------

  function renderResults() {
    // This is the landing page, so a failed load must not be a dead end — the
    // way into the form stays on screen.
    if (state.resultsError) {
      return (
        '<div class="card">' +
          '<div class="error">' + esc(state.resultsError) + "</div>" +
          '<button class="btn-ghost" data-action="load-results">Try again</button>' +
        "</div>" +
        reportButton()
      );
    }
    if (state.loadingResults || !state.results) return '<div class="loading">Loading…</div>';

    var reports = state.results;
    var t = totalsFor(reports);

    // Day one, this page is the only explanation of the survey anybody gets, so
    // the empty state says what is being counted rather than just "no data".
    if (!t.ministries) {
      return (
        '<section class="hero hero-empty">' +
          heroTop() +
          '<div class="hero-figure">' +
            '<div class="hero-num num">—</div>' +
            '<div class="hero-cap">no reports in yet</div>' +
          "</div>" +
          '<p class="hero-foot">Each regional leader reports the ministries they oversee. As those ' +
            "come in, this page adds them up into one national picture.</p>" +
        "</section>" +

        section("What it will show", "", goalList()) +

        '<div class="glance-actions">' + reportButton() + "</div>"
      );
    }

    // A ministry can be several kinds at once — a sports programme that is also
    // youth ministry is tagged both — so these rows overlap and must not be read
    // as a breakdown that sums to the total. The bars are scaled against the
    // Biggest first — at a glance, where the weight sits matters more than
    // where a province falls in the gazetteer order.
    var provinceIds = Object.keys(t.byProvince).sort(function (a, b) {
      return t.byProvince[b].staff - t.byProvince[a].staff || provinceOrder[a] - provinceOrder[b];
    });
    var biggest = provinceIds.reduce(function (max, pid) {
      return Math.max(max, t.byProvince[pid].staff);
    }, 0) || 1;

    var provinceRows = provinceIds.map(function (pid) {
      var row = t.byProvince[pid];
      return (
        '<div class="prow">' +
          '<div class="prow-head">' +
            '<span class="prow-name">' + esc(provinceName(pid)) + "</span>" +
            '<span class="prow-figs"><b class="num">' + fmt(row.staff) + "</b> staff" +
              (row.weekly ? ' <span class="prow-sep">·</span> <b class="num">' + fmt(row.weekly) + "</b> a week" : "") +
            "</span>" +
          "</div>" +
          '<div class="prow-track"><span style="width:' +
            Math.max(3, Math.round((row.staff / biggest) * 100)) + '%"></span></div>' +
          '<div class="prow-sub">' + row.ministries + " " + plural(row.ministries, "ministry", "ministries") + "</div>" +
        "</div>"
      );
    }).join("");

    var who = reports.map(function (r) {
      var count = (r.ministries || []).length;
      return '<span class="who-one"><b>' + esc(r.leaderName || "Unnamed") + "</b> " +
        count + " " + plural(count, "ministry", "ministries") + "</span>";
    }).join("");

    return (
      hero(t) +

      section("Where we are", t.provinces + " of " + PROVINCES.length + " provinces",
        '<div class="rows">' + provinceRows + "</div>") +

      fruitBand(t) +

      statCard("Also right now", [
        [t.villagesReached, "villages and communities we go into"],
        [t.churchesLed, "local churches led by our staff"],
        [t.churchesServed, "local churches we serve"],
      ]) +

      '<div class="card who-card">' +
        '<div class="sec-kicker">Who has reported</div>' +
        '<div class="who">' + who + "</div>" +
      "</div>" +

      '<div class="cta">' +
        reportButton() +
        (PROVINCES.length - t.provinces > 0
          ? '<p class="cta-note">' + (PROVINCES.length - t.provinces) + " of the " +
            PROVINCES.length + " provinces haven't been reported on yet.</p>"
          : "") +
      "</div>" +

      '<div class="glance-actions">' +
        '<button class="btn-ghost" data-action="download-csv">Download as a spreadsheet</button>' +
        '<button class="btn-ghost" data-action="load-results">Refresh</button>' +
      "</div>"
    );
  }

  // The dark panel at the top. One figure carries the page — the staff count,
  // because it is the only number every ministry is required to give, so it is
  // the one that is never quietly built out of half the reports.
  function hero(t) {
    var side = [
      [t.ministries, plural(t.ministries, "ministry", "ministries")],
      [t.peopleWeekly, "reached a week"],
      [t.schoolGraduates, "graduates in " + YEAR],
    ].filter(function (s) { return s[0] > 0; });

    return (
      '<section class="hero">' +
        heroTop() +

        '<div class="hero-figure">' +
          '<div class="hero-num num">' + fmt(t.staffTotal) + "</div>" +
          '<div class="hero-cap">staff serving in <b>' + t.provinces + "</b> " +
            plural(t.provinces, "province", "provinces") + "</div>" +
        "</div>" +

        staffSplit(t) +

        (side.length
          ? '<div class="hero-strip">' + side.map(function (s) {
              return '<div class="hero-stat"><span class="num">' + fmt(s[0]) + "</span>" +
                "<em>" + esc(s[1]) + "</em></div>";
            }).join("") + "</div>"
          : "") +

        '<p class="hero-foot">Built from ' + t.reports + " " + plural(t.reports, "report", "reports") +
          ". Staff, ministries and reach are as they stand today; graduates and fruit are for " + YEAR + ".</p>" +
      "</section>"
    );
  }

  // Khmer and international staff, as one bar rather than two figures, because
  // the point of the breakdown is the proportion. Only the ministries that gave
  // the split are in it — the caption says so when some didn't, otherwise the
  // bar would quietly read as the whole organisation.
  function staffSplit(t) {
    var known = t.staffSplitKnown;
    if (!known) return "";

    var khmer = Math.min(t.staffCambodian, known);
    var pct = Math.round((khmer / known) * 100);
    var missing = t.ministries - t.ministriesWithSplit;

    return (
      '<div class="hero-split">' +
        '<div class="split-track">' +
          '<span class="split-khmer" style="width:' + pct + '%"></span>' +
        "</div>" +
        '<div class="split-keys">' +
          '<div class="split-key"><i class="dot dot-khmer"></i>' +
            '<span class="num">' + fmt(khmer) + "</span> Khmer</div>" +
          '<div class="split-key"><i class="dot dot-intl"></i>' +
            '<span class="num">' + fmt(t.staffInternational) + "</span> international</div>" +
        "</div>" +
        (missing > 0
          ? '<div class="split-note">' + missing + " " + plural(missing, "ministry", "ministries") +
            " didn't give the split, so " + fmt(known) + " of " + fmt(t.staffTotal) +
            " staff are counted here.</div>"
          : "") +
      "</div>"
    );
  }

  // The lockup at the top of the dark panel. Same /logo.svg the topbar uses — the
  // mark carries its own blue and white, so it sits on this dark panel unchanged.
  function heroTop() {
    return (
      '<div class="hero-top">' +
        '<span class="hero-mark" aria-hidden="true">' +
          '<img src="/logo.svg" width="44" height="35" alt="" />' +
        "</span>" +
        '<span class="hero-org">YWAM Cambodia</span>' +
      "</div>"
    );
  }

  function section(title, count, body) {
    return (
      '<section class="card">' +
        '<div class="sec-head">' +
          '<h2 class="sec-title">' + esc(title) + "</h2>" +
          (count ? '<div class="sec-count">' + esc(count) + "</div>" : "") +
        "</div>" +
        body +
      "</section>"
    );
  }

  // The year's fruit, given its own band so it reads as a different kind of
  // number from the live ones above it — these are a closed year, not today.
  function fruitBand(t) {
    var lines = [
      [t.schoolGraduates, "graduated from our YWAM training schools"],
      [t.newBelievers, "new believers"],
      [t.baptisms, "baptisms"],
    ].filter(function (l) { return l[0] > 0; });
    if (!lines.length) return "";

    return (
      '<section class="fruit">' +
        '<div class="fruit-kicker">In ' + YEAR + "</div>" +
        '<div class="fruit-grid">' +
          lines.map(function (l) {
            return '<div class="fruit-one"><div class="fruit-num num">' + fmt(l[0]) + "</div>" +
              '<div class="fruit-cap">' + esc(l[1]) + "</div></div>";
          }).join("") +
        "</div>" +
      "</section>"
    );
  }

  // Most of these fields are optional, so a zero almost always means "nobody
  // filled it in" rather than "none". Printing a column of zeros would read as a
  // real finding, so an unreported line is left out and the card says how many.
  // The six figures the tiles hold once reports arrive — the survey's whole
  // purpose, in the order the tiles show them. Keep this list and the tiles in
  // step; it's the promise the landing page makes about what it will fill in.
  function goalList() {
    var goals = [
      "How many provinces we are in",
      "How many staff we are, and how many of us are Khmer",
      "How many people we reach in a normal week",
      "How many villages and communities we go into",
      "How many students graduated from our YWAM training schools in " + YEAR,
      "How many local churches we serve, and how many we lead",
    ];
    return '<ul class="goals">' +
      goals.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") +
      "</ul>";
  }

  // The one thing to do after reading the totals. The wording follows whether
  // there's already a draft on this phone, so a leader coming back mid-report
  // isn't invited to "add" one they have half written.
  function reportButton() {
    var r = state.report;
    var started = r.ministries.length || r.provinceIds.length || r.leaderName.trim();
    return '<button class="btn" data-action="start-report">' +
      (started ? "Continue my report" : "Add my report") + "</button>";
  }

  function statCard(title, lines) {
    var shown = lines.filter(function (l) { return l[0] > 0; });
    if (!shown.length) return "";
    var quiet = lines.length - shown.length;
    return (
      '<section class="card">' +
        '<div class="sec-head">' +
          '<h2 class="sec-title">' + esc(title) + "</h2>" +
          (quiet ? '<div class="sec-count">' + quiet + " not yet reported</div>" : "") +
        "</div>" +
        shown.map(function (l) {
          return '<div class="stat"><div class="stat-num num">' + fmt(l[0]) +
            '</div><div class="stat-cap">' + esc(l[1]) + "</div></div>";
        }).join("") +
      "</section>"
    );
  }

  // ---------- spreadsheet ----------

  var CSV_COLUMNS = [
    ["Reported by", function (r) { return r.leaderName; }],
    ["Their role", function (r) { return r.leaderRole; }],
    ["Province", function (r, m) { return provinceName(m.provinceId); }],
    ["Ministry", function (r, m) { return m.name; }],
    ["Ministry leader", function (r, m) { return m.leaderName; }],
    ["Staff total", function (r, m) { return m.staffTotal; }],
    ["Staff Khmer", function (r, m) { return m.staffCambodian; }],
    ["People reached weekly", function (r, m) { return m.peopleWeekly; }],
    ["Villages reached", function (r, m) { return m.villagesReached; }],
    ["Churches served", function (r, m) { return m.churchesServed; }],
    ["Churches led", function (r, m) { return m.churchesLed; }],
    ["Training school graduates " + YEAR, function (r, m) { return m.schoolGraduates; }],
    ["New believers " + YEAR, function (r, m) { return m.newBelievers; }],
    ["Baptisms " + YEAR, function (r, m) { return m.baptisms; }],
    ["Biggest need", function (r, m) { return m.biggestNeed; }],
    ["Submitted", function (r) { return (r.submittedAt || "").slice(0, 10); }],
  ];

  function csvCell(v) {
    var s = v === undefined || v === null ? "" : String(v);
    // A leading =, +, - or @ makes a spreadsheet treat the cell as a formula.
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function downloadCsv() {
    var rows = [CSV_COLUMNS.map(function (c) { return csvCell(c[0]); }).join(",")];
    (state.results || []).forEach(function (r) {
      (r.ministries || []).forEach(function (m) {
        rows.push(CSV_COLUMNS.map(function (c) { return csvCell(c[1](r, m)); }).join(","));
      });
    });
    // The BOM is what makes Excel open Khmer and accented names correctly.
    var blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ywam-cambodia-" + YEAR + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------- network ----------

  function reportForSubmit() {
    var r = state.report;
    return {
      leaderName: r.leaderName.trim(),
      leaderRole: r.leaderRole.trim(),
      notes: r.notes.trim(),
      ministries: r.ministries.map(function (m) {
        var out = {};
        Object.keys(m).forEach(function (k) { out[k] = m[k]; });
        return out;
      }),
    };
  }

  function submit() {
    var r = state.report;
    if (!r.leaderName.trim()) {
      state.error = "Please put your name on step 1 so we know whose report this is.";
      state.step = "you";
      render();
      return;
    }
    if (!r.ministries.length) {
      state.error = "Add at least one ministry before sending.";
      render();
      return;
    }
    var incomplete = r.ministries.filter(function (m) { return missingFrom(m).length; });
    if (incomplete.length) {
      state.error = incomplete.length === 1
        ? "One ministry is still missing its name, leader or staff count."
        : incomplete.length + " ministries are still missing a name, leader or staff count.";
      render();
      return;
    }
    state.busy = true;
    state.error = "";
    render();

    fetch("/api/ministries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: reportForSubmit() }),
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (out) {
        state.busy = false;
        if (!out.ok) {
          state.error = (out.data && out.data.error) || "Could not send. Please try again.";
          render();
          return;
        }
        state.error = "";
        state.step = "done";
        state.results = null;
        render();
      })
      .catch(function () {
        state.busy = false;
        state.error = "No connection. Your report is saved on this phone — send again when you have signal.";
        render();
      });
  }

  function loadResults() {
    state.resultsError = "";
    state.loadingResults = true;
    render();

    fetch("/api/ministries")
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (out) {
        state.loadingResults = false;
        if (!out.ok) {
          state.resultsError = (out.data && out.data.error) || "Could not load the totals.";
          state.results = null;
        } else {
          state.results = out.data.reports || [];
        }
        render();
      })
      .catch(function () {
        state.loadingResults = false;
        state.resultsError = "No connection. Try again when you have signal.";
        state.results = null;
        render();
      });
  }

  // ---------- events ----------

  // Typing must never trigger a re-render — a re-render mid-word takes the
  // keyboard away. State is updated in place and only the card summary refreshes.
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el || !el.dataset) return;

    if (el.dataset.bind) {
      state.report[el.dataset.bind] = el.value;
      saveDraft();
      return;
    }
    if (el.dataset.min && el.dataset.key) applyFieldChange(el);
  });

  // <select> fires change rather than input on some Android browsers.
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el || !el.dataset || !el.dataset.min || !el.dataset.key) return;
    applyFieldChange(el);
    // Moving a ministry to another province means it has to move block.
    if (el.dataset.key === "provinceId") render();
  });

  function applyFieldChange(el) {
    var m = findMinistry(el.dataset.min);
    if (!m) return;

    m[el.dataset.key] = el.value;
    saveDraft();
    refreshSummary(m);
  }

  function refreshSummary(m) {
    var head = document.querySelector('.min-summary[data-toggle-ministry="' + m.id + '"]');
    if (!head) return;
    var name = head.querySelector(".min-summary-name");
    var sub = head.querySelector(".min-summary-sub");
    if (name) name.innerHTML = ministryLabel(m);
    if (sub) sub.innerHTML = ministrySub(m);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest(
      "[data-goto],[data-action],[data-province],[data-add-ministry],[data-toggle-ministry],[data-remove-ministry]"
    );
    if (!el) return;
    var d = el.dataset;

    if (d.goto) {
      state.tab = d.goto;
      state.error = "";
      if (d.goto === "results" && !state.results) { loadResults(); return; }
      render();
      return;
    }

    if (d.province) { toggleProvince(d.province); return; }

    if (d.addMinistry) {
      var fresh = blankMinistry(d.addMinistry);
      state.report.ministries.push(fresh);
      state.openMinistry = fresh.id;
      saveDraft();
      render();
      return;
    }

    if (d.toggleMinistry) {
      state.openMinistry = state.openMinistry === d.toggleMinistry ? null : d.toggleMinistry;
      render();
      return;
    }

    if (d.removeMinistry) {
      var target = findMinistry(d.removeMinistry);
      var label = target && target.name ? '"' + target.name + '"' : "this ministry";
      if (!window.confirm("Remove " + label + " from your report?")) return;
      state.report.ministries = state.report.ministries.filter(function (m) { return m.id !== d.removeMinistry; });
      if (state.openMinistry === d.removeMinistry) state.openMinistry = null;
      saveDraft();
      render();
      return;
    }

    switch (d.action) {
      case "to-you":
        state.step = "you";
        state.error = "";
        render();
        break;
      case "to-ministries":
        if (state.step === "you" && !guardStepOne()) return;
        state.tab = "form";
        state.step = "ministries";
        state.error = "";
        render();
        break;
      case "start-report":
        // Straight to the ministry cards if the provinces are already picked,
        // otherwise to step 1. Either way, out of the totals and into the form.
        state.tab = "form";
        state.step = state.report.provinceIds.length ? "ministries" : "you";
        state.error = "";
        render();
        break;
      case "to-review":
        state.step = "review";
        state.error = "";
        render();
        break;
      case "submit": submit(); break;
      case "see-results":
        state.tab = "results";
        loadResults();
        break;
      case "load-results": loadResults(); break;
      case "download-csv": downloadCsv(); break;
    }
  });

  function guardStepOne() {
    if (!state.report.leaderName.trim()) {
      state.error = "Please put your name in first.";
      render();
      return false;
    }
    if (!state.report.provinceIds.length) {
      state.error = "Pick at least one province.";
      render();
      return false;
    }
    return true;
  }

  function toggleProvince(pid) {
    var ids = state.report.provinceIds;
    var i = ids.indexOf(pid);
    if (i === -1) {
      ids.push(pid);
      // Keep the blocks in the same order as the picker so the two screens agree.
      ids.sort(function (a, b) { return provinceOrder[a] - provinceOrder[b]; });
    } else {
      var held = ministriesIn(pid);
      if (held.length) {
        var msg = provinceName(pid) + " has " + held.length + " " + plural(held.length, "ministry", "ministries") +
          " listed. Remove the province and " + plural(held.length, "it", "them") + "?";
        if (!window.confirm(msg)) return;
        state.report.ministries = state.report.ministries.filter(function (m) { return m.provinceId !== pid; });
      }
      ids.splice(i, 1);
    }
    saveDraft();
    render();
  }

  // ---------- go ----------

  loadDraft();
  if (state.report.ministries.length || state.report.provinceIds.length) state.step = "ministries";
  // loadResults renders, including the loading state — no separate first paint.
  loadResults();
})();
