// The fixed vocabulary the survey offers. Kept in one file so a leader can add a
// ministry type without touching the form logic.
//
// Anything not on this list is still reportable — it ends with "Other", which
// opens a free-text box. Better to collect an odd label than to lose the ministry
// because it didn't fit a checkbox.
//
// Adding an id here also means adding it to MINISTRY_TYPE_IDS in
// netlify/functions/ministries.mjs, which drops ids it doesn't recognise.

window.MINISTRY_TYPES = [
  { id: "sports", label: "Sports" },
  { id: "english", label: "English classes" },
  { id: "education", label: "School / tutoring" },
  { id: "children", label: "Children / kids clubs" },
  { id: "youth", label: "Youth ministry" },
  { id: "training", label: "Training school (DTS, SBS…)" },
  { id: "church-planting", label: "Church planting" },
  { id: "village-outreach", label: "Village outreach / evangelism" },
  { id: "media-arts", label: "Media & arts" },
  { id: "music", label: "Music / worship" },
  { id: "health", label: "Health / medical" },
  { id: "vocational", label: "Vocational & skills training" },
  { id: "business", label: "Business as mission" },
  { id: "agriculture", label: "Agriculture / farming" },
  { id: "community", label: "Community development" },
  { id: "justice", label: "Justice / anti-trafficking" },
  { id: "mercy", label: "Mercy ministry / care" },
  { id: "prayer", label: "Prayer & intercession" },
  { id: "other", label: "Other" },
];

// School students and fruit are reported for a closed calendar year, so "how many
// students go through our schools in a year" has one clean answer. Everything
// else — staff, sports, English classes, churches — is asked as it stands today,
// because that's the number a leader can actually give without going back through
// records.
window.REPORT_YEAR = 2025;
