---
title: "Rewriting cBioPortal's Backend in Go with AI Agents: Prototype and Prompt Analysis"
date: 2026-10-15 12:00:00
category: development
---

A lot of code is being rewritten by AI agents this year. GitHub ported the
Copilot agent runtime from TypeScript to about 800,000 lines of Rust in a few
months, mostly with Copilot itself ([write-up](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/)).
Anthropic's guide to [AI-driven code modernization](https://claude.com/resources/articles/how-to-prepare-for-ai-driven-code-modernization-projects)
says projects that used to take years "can now finish in months (or weeks)."

Some are controversial. [ArtCraft](https://news.ycombinator.com/item?id=49958850), an
AI-built "Adobe-compatible" suite in Rust, launched with the line "I just
one-shotted Photoshop." People who tried it found that text editing and
brushes didn't work, and the Hacker News thread turned into an argument about
overclaiming. Getting an agent to write a rewrite is quick now. Showing that
it behaves like the original is the slow part.

Bioinformatics has its own wave, mostly into Rust. Heng Li lists many of them
in [The AI Rewrite Dilemma](https://lh3.github.io/2026/04/17/the-ai-rewrite-dilemma),
from fgbio to fgumi and FastQC to RastQC, and argues that the people side is
harder than the technical side: "Empathy matters more than technical benefit
or legal correctness." Anthropic's guide says much the same: the slow part is
getting everyone to agree on what the rewrite should do and how to check it.
Phil Ewels at Seqera set out principles for doing it well at
[rewrites.bio](https://rewrites.bio/): match the original's output exactly, credit its authors, and say
what you did and didn't validate.

My own first attempt, in February, was [vibe-vep](https://github.com/inodb/vibe-vep),
a Go rewrite of VEP in a single binary. VEP is one of the more expensive parts
of keeping cBioPortal's variant annotations up to date. vibe-vep
worked well, but then we learned that [Kuan-lin Huang's lab](https://labs.icahn.mssm.edu/kuanhuanglab/) at Mount Sinai was
building a Rust rewrite, [fastVEP](https://github.com/Huang-lab/fastVEP). So we
paused vibe-vep and [benchmarked theirs](https://github.com/cBioPortal/cbioportal-onco-variant-annotation-bench)
instead. Meanwhile the models
kept getting better at this kind of work, so this summer we tried something
bigger as a proof of concept: cBioPortal's own backend.

This post covers what came out of it and how the work went,
measured from the agents' session logs. Whether to roll it out is up for
discussion in [RFC 106](https://docs.google.com/document/d/18k_fiIzPCetgWbBzhkq72bpa636tMnxVyZH0BwEDe4E/edit).

**Contents:** [The rewrite](#the-rewrite) · [Rewrite compared](#rewrite-compared) · [How many prompts?](#how-many-prompts) · [Prompts categorized](#prompts-categorized) · [Prompts: the new source code?](#prompts-the-new-source-code) · [Lessons](#lessons)

## The rewrite

[cbioportal-go](https://github.com/cBioPortal/cbioportal-go) replaces cBioPortal's Java REST API and its importer, about
130,000 lines of Java and configuration built up over more than ten years,
with Go. Everything else stays: the website, the ClickHouse database and the
session service. The diagram shows what changes. It's an experiment for now,
not an official cBioPortal release. In the terms of Anthropic's modernization guide, it's a *transform*: new
code in a new language, same behavior.

<figure class="stack-fig">
<style>
.stack-fig a.cmp { cursor: pointer; outline: none; color: inherit; text-decoration: none; }
.stack-fig .cmp rect { transition: stroke-width 0.1s; }
.stack-fig .cmp:hover rect, .stack-fig .cmp:focus rect { stroke-width: 3; stroke-opacity: 1; }
.stack-cards { min-height: 6em; margin-top: 0.5em; }
.stack-card { display: none; border-left: 3px solid #2a78d6; padding: 0.4em 0.8em; font-size: 0.9em; }
.stack-card p { margin: 0.2em 0; }
.stack-default { display: block; opacity: 0.7; font-size: 0.9em; }
.stack-fig:has(.cmp:hover, .cmp:focus) .stack-default { display: none; }
.stack-fig:has(.c-web:hover, .c-web:focus) .card-web { display: block; }
.stack-fig:has(.c-java-api:hover, .c-java-api:focus) .card-java-api { display: block; }
.stack-fig:has(.c-redis:hover, .c-redis:focus) .card-redis { display: block; }
.stack-fig:has(.c-java-importer:hover, .c-java-importer:focus) .card-java-importer { display: block; }
.stack-fig:has(.c-go-api:hover, .c-go-api:focus) .card-go-api { display: block; }
.stack-fig:has(.c-go-importer:hover, .c-go-importer:focus) .card-go-importer { display: block; }
.stack-fig:has(.c-session:hover, .c-session:focus) .card-session { display: block; }
.stack-fig:has(.c-clickhouse:hover, .c-clickhouse:focus) .card-clickhouse { display: block; }
.stack-fig:has(.c-mongodb:hover, .c-mongodb:focus) .card-mongodb { display: block; }
@media (hover: none) {
  .stack-cards .stack-card { display: block; margin-bottom: 0.6em; }
  .stack-default { display: none; }
}
</style>
<svg viewBox="0 0 680 300" width="100%" role="img" aria-label="Before and after: cbioportal-go replaces the Java API and importer with Go, drops the Redis cache, and keeps the React website, ClickHouse and the session service" xmlns="http://www.w3.org/2000/svg" style="max-width:680px;font:12px system-ui,sans-serif">
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs>
<text x="165.0" y="14" text-anchor="middle" fill="currentColor" font-weight="700" font-size="13">Java backend (today)</text>
<a class="cmp c-web" href="https://github.com/cBioPortal/cbioportal-frontend" target="_blank" rel="noopener" aria-label="React website: The website people use. It gets all its data from the REST API.">
<title>React website: cBioPortal/cbioportal-frontend</title>
<rect x="60" y="34" width="210" height="40" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="165.0" y="47.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">React website</text>
<text x="165.0" y="61.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">unchanged</text>
</a>
<line x1="165" y1="74" x2="165" y2="112" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="172" y="93" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">REST API</text>
<a class="cmp c-java-api" href="https://github.com/cBioPortal/cbioportal" target="_blank" rel="noopener" aria-label="Java API: The Spring Boot REST API that answers the website, scripts and AI agents. About 80,000 lines of Java.">
<title>Java API: cBioPortal/cbioportal</title>
<rect x="60" y="114" width="210" height="44" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="165.0" y="129.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Java API</text>
<text x="165.0" y="143.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">Spring Boot</text>
</a>
<line x1="150" y1="158" x2="150" y2="182" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="157" y="170" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">cached?</text>
<a class="cmp c-redis" href="https://redis.io/" target="_blank" rel="noopener" aria-label="Redis cache: Keeps the Java API&#x27;s answers for 60 minutes, so repeated requests skip the database.">
<title>Redis cache: redis.io</title>
<rect x="110" y="184" width="90" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="155.0" y="202.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Redis cache</text>
</a>
<line x1="150" y1="220" x2="150" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="157" y="236" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">SQL</text>
<a class="cmp c-java-importer" href="https://github.com/cBioPortal/cbioportal-core" target="_blank" rel="noopener" aria-label="Importer (Java + Python): Checks study files and loads them into the database. About 33,000 lines of Java and Python.">
<title>Importer (Java + Python): cBioPortal/cbioportal-core</title>
<rect x="0" y="184" width="100" height="40" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="50.0" y="197.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Importer</text>
<text x="50.0" y="211.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">Java + Python</text>
</a>
<line x1="50" y1="224" x2="70" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="68" y="237" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">loads</text>
<line x1="250" y1="158" x2="275" y2="182" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<a class="cmp c-session" href="https://github.com/cBioPortal/session-service" target="_blank" rel="noopener" aria-label="Session service: Stores users&#x27; saved pages, virtual studies and custom data.">
<title>Session service: cBioPortal/session-service</title>
<rect x="220" y="184" width="110" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="275.0" y="202.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Session service</text>
</a>
<line x1="275" y1="220" x2="275" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<a class="cmp c-clickhouse" href="https://clickhouse.com/" target="_blank" rel="noopener" aria-label="ClickHouse: The database that holds all study data, on ClickHouse Cloud.">
<title>ClickHouse: clickhouse.com</title>
<rect x="30" y="254" width="170" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="115.0" y="265.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">ClickHouse</text>
<text x="115.0" y="279.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">study data</text>
</a>
<a class="cmp c-mongodb" href="https://www.mongodb.com/" target="_blank" rel="noopener" aria-label="MongoDB: The database behind the session service.">
<title>MongoDB: mongodb.com</title>
<rect x="220" y="254" width="110" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="275.0" y="265.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">MongoDB</text>
<text x="275.0" y="279.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">saved sessions</text>
</a>
<line x1="340.0" y1="0" x2="340.0" y2="290" stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>
<text x="515.0" y="14" text-anchor="middle" fill="currentColor" font-weight="700" font-size="13">cbioportal-go</text>
<a class="cmp c-web" href="https://github.com/cBioPortal/cbioportal-frontend" target="_blank" rel="noopener" aria-label="React website: The website people use. It gets all its data from the REST API.">
<title>React website: cBioPortal/cbioportal-frontend</title>
<rect x="410" y="34" width="210" height="40" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="515.0" y="47.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">React website</text>
<text x="515.0" y="61.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">unchanged</text>
</a>
<line x1="515" y1="74" x2="515" y2="112" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="522" y="93" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">REST API</text>
<a class="cmp c-go-api" href="https://github.com/cBioPortal/cbioportal-go" target="_blank" rel="noopener" aria-label="Go API: Answers the same REST API as Java, field by field. Keeps study metadata in memory.">
<title>Go API: cBioPortal/cbioportal-go</title>
<rect x="410" y="114" width="210" height="44" rx="6" fill="#2a78d6" fill-opacity="0.14" stroke="#2a78d6" stroke-width="2"/>
<text x="515.0" y="129.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Go API</text>
<text x="515.0" y="143.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">in-memory metadata cache</text>
</a>
<line x1="500" y1="158" x2="500" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="507" y="205" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">SQL</text>
<a class="cmp c-go-importer" href="https://github.com/cBioPortal/cbioportal-go" target="_blank" rel="noopener" aria-label="Importer (Go): Loads the same study files into ClickHouse. It lives in the same repository and program as the Go API.">
<title>Importer (Go): cBioPortal/cbioportal-go</title>
<rect x="350" y="184" width="100" height="40" rx="6" fill="#2a78d6" fill-opacity="0.14" stroke="#2a78d6" stroke-width="2"/>
<text x="400.0" y="197.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Importer</text>
<text x="400.0" y="211.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">Go</text>
</a>
<line x1="400" y1="224" x2="420" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<text x="418" y="237" text-anchor="start" dominant-baseline="central" fill="currentColor" fill-opacity="0.75" font-size="11">loads</text>
<line x1="600" y1="158" x2="625" y2="182" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<a class="cmp c-session" href="https://github.com/cBioPortal/session-service" target="_blank" rel="noopener" aria-label="Session service: Stores users&#x27; saved pages, virtual studies and custom data.">
<title>Session service: cBioPortal/session-service</title>
<rect x="570" y="184" width="110" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="625.0" y="202.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">Session service</text>
</a>
<line x1="625" y1="220" x2="625" y2="252" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#arrow)"/>
<a class="cmp c-clickhouse" href="https://clickhouse.com/" target="_blank" rel="noopener" aria-label="ClickHouse: The database that holds all study data, on ClickHouse Cloud.">
<title>ClickHouse: clickhouse.com</title>
<rect x="380" y="254" width="170" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="465.0" y="265.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">ClickHouse</text>
<text x="465.0" y="279.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">study data</text>
</a>
<a class="cmp c-mongodb" href="https://www.mongodb.com/" target="_blank" rel="noopener" aria-label="MongoDB: The database behind the session service.">
<title>MongoDB: mongodb.com</title>
<rect x="570" y="254" width="110" height="36" rx="6" fill="currentColor" fill-opacity="0.001" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="625.0" y="265.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-weight="600">MongoDB</text>
<text x="625.0" y="279.0" text-anchor="middle" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">saved sessions</text>
</a>
</svg>
<div class="stack-cards">
<p class="stack-default">Hover over a box to see what it does and what it uses on the public portal. Click it to open its repository.</p>
<div class="stack-card card-web"><p><strong>React website</strong> · <a href="https://github.com/cBioPortal/cbioportal-frontend" target="_blank" rel="noopener">cBioPortal/cbioportal-frontend</a></p><p>The website people use. It gets all its data from the REST API.</p><p>Unchanged: both backends serve the same website build.</p></div>
<div class="stack-card card-java-api"><p><strong>Java API</strong> · <a href="https://github.com/cBioPortal/cbioportal" target="_blank" rel="noopener">cBioPortal/cbioportal</a></p><p>The Spring Boot REST API that answers the website, scripts and AI agents. About 80,000 lines of Java.</p><p>About 1.8 GB of memory per server on average and 0.34 s of CPU per request. MSK runs 20 Java backend servers across its portals, about $1,280 a month.</p></div>
<div class="stack-card card-redis"><p><strong>Redis cache</strong> · <a href="https://redis.io/" target="_blank" rel="noopener">redis.io</a></p><p>Keeps the Java API&#x27;s answers for 60 minutes, so repeated requests skip the database.</p><p>Answers 65 to 75% of Java&#x27;s lookups. Its servers cost about $215 a month. The Go version has no response cache.</p></div>
<div class="stack-card card-java-importer"><p><strong>Importer (Java + Python)</strong> · <a href="https://github.com/cBioPortal/cbioportal-core" target="_blank" rel="noopener">cBioPortal/cbioportal-core</a></p><p>Checks study files and loads them into the database. About 33,000 lines of Java and Python.</p><p>Loading MSK-IMPACT (50,000 samples) takes 289 s and 3.9 GB of memory.</p></div>
<div class="stack-card card-go-api"><p><strong>Go API</strong> · <a href="https://github.com/cBioPortal/cbioportal-go" target="_blank" rel="noopener">cBioPortal/cbioportal-go</a></p><p>Answers the same REST API as Java, field by field. Keeps study metadata in memory.</p><p>About 48 MB of memory per server on average (131 MB at most) and 0.11 s of CPU per request. The servers for all portals would cost about $160 a month.</p></div>
<div class="stack-card card-go-importer"><p><strong>Importer (Go)</strong> · <a href="https://github.com/cBioPortal/cbioportal-go" target="_blank" rel="noopener">cBioPortal/cbioportal-go</a></p><p>Loads the same study files into ClickHouse. It lives in the same repository and program as the Go API.</p><p>Loading MSK-IMPACT takes 80 s and 0.2 GB of memory.</p></div>
<div class="stack-card card-session"><p><strong>Session service</strong> · <a href="https://github.com/cBioPortal/session-service" target="_blank" rel="noopener">cBioPortal/session-service</a></p><p>Stores users&#x27; saved pages, virtual studies and custom data.</p><p>Shared by both backends and not part of the rewrite.</p></div>
<div class="stack-card card-clickhouse"><p><strong>ClickHouse</strong> · <a href="https://clickhouse.com/" target="_blank" rel="noopener">clickhouse.com</a></p><p>The database that holds all study data, on ClickHouse Cloud.</p><p>Both backends use the same data. On the API portal&#x27;s traffic, Go used 0.92 times Java&#x27;s ClickHouse CPU per request.</p></div>
<div class="stack-card card-mongodb"><p><strong>MongoDB</strong> · <a href="https://www.mongodb.com/" target="_blank" rel="noopener">mongodb.com</a></p><p>The database behind the session service.</p><p>Unchanged.</p></div>
</div>
<figcaption>What changes: the API and the importer (blue) move to Go, and the Redis cache goes away. The website, ClickHouse and the session service stay the same.</figcaption>
</figure>

We picked Go because a Go server needs a fraction of a Java server's memory,
builds in seconds, needs few outside libraries, and is plain enough for
others to review. I had actually started in Rust. After a day I asked Claude
whether Go would fit better, and it said yes, even with part of the Rust
version already written. The API mostly turns HTTP requests into ClickHouse
queries, so the time goes to the database and Rust's speed buys little. Rust
rebuilds took 10 to 20 seconds. And cBioPortal's contributors mostly write
Java, which makes Go easier to pick up. When I asked again in October, it gave
the same answer and added that most of the work had been matching Java in
many small ways, where a fast compile loop helps. [RFC 106](https://docs.google.com/document/d/18k_fiIzPCetgWbBzhkq72bpa636tMnxVyZH0BwEDe4E/edit) has the
full reasoning.

The API has no complete written spec, so the Java code serves as one:
"correct" means "gives the same answer as Java." We check that in layers,
from fast to slow:

- unit tests for statistics, binning and query building
- contract tests for every endpoint's status codes, fields, order and errors
- the same requests sent to the latest Java version, loaded with the same
  test studies
- checks that both importers store the same data
- cBioPortal's own website test suite (about 365 Playwright test files),
  running in a real browser against Go
- every night, about 5,000 of the previous day's production requests sent to
  both backends and compared
- a share of live traffic copied to Go to measure speed, memory, errors and
  database load

## Rewrite compared

The numbers come from the public portal, [cbioportal.org](https://www.cbioportal.org/).
Its API answers about 36 million requests a month, and on weekdays about a
third of them come from scripts and AI agents (see the [usage
page](https://about.cbioportal.org/usage)).

<div class="cmp-wrap" id="cmp-stats">
<style>
.cmp-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 0.5em 0 0.4em; }
.cmp-stats a.tile { display: block; color: inherit; text-decoration: none; outline: none; cursor: pointer; border: 1px solid rgba(127,127,127,0.35); border-radius: 6px; padding: 8px 10px; }
.cmp-stats a.tile:hover, .cmp-stats a.tile:focus { border-color: #2a78d6; }
.cmp-stats .l { font-size: 0.8em; opacity: 0.75; line-height: 1.3; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cmp-stats .r { display: flex; justify-content: space-between; gap: 8px; font-size: 0.95em; line-height: 1.4; font-variant-numeric: tabular-nums; }
.cmp-stats .k { opacity: 0.7; }
.cmp-stats .go { font-weight: 700; }
.cmp-cards { min-height: 3.2em; margin-bottom: 1.2em; }
.cmp-card { display: none; border-left: 3px solid #2a78d6; padding: 0.3em 0.8em; font-size: 0.9em; }
.cmp-default { display: block; opacity: 0.7; font-size: 0.9em; margin: 0; }
.cmp-wrap:has(a.tile:hover, a.tile:focus) .cmp-default { display: none; }
.cmp-wrap:has(.c-loc:hover, .c-loc:focus) .card-loc { display: block; }
.cmp-wrap:has(.c-memres:hover, .c-memres:focus) .card-memres { display: block; }
.cmp-wrap:has(.c-memused:hover, .c-memused:focus) .card-memused { display: block; }
.cmp-wrap:has(.c-median:hover, .c-median:focus) .card-median { display: block; }
.cmp-wrap:has(.c-p99:hover, .c-p99:focus) .card-p99 { display: block; }
.cmp-wrap:has(.c-errors:hover, .c-errors:focus) .card-errors { display: block; }
.cmp-wrap:has(.c-cost:hover, .c-cost:focus) .card-cost { display: block; }
.cmp-wrap:has(.c-import:hover, .c-import:focus) .card-import { display: block; }
.cmp-wrap:has(.c-image:hover, .c-image:focus) .card-image { display: block; }
</style>
<div class="cmp-stats">
<a class="tile c-loc" href="#cmp-stats"><div class="l">Lines of code</div><div class="r"><span class="k">Java</span><span>~130,000</span></div><div class="r go"><span>Go</span><span>~45,000</span></div></a>
<a class="tile c-memres" href="#cmp-stats"><div class="l">Memory reserved</div><div class="r"><span class="k">Java</span><span>8 GB</span></div><div class="r go"><span>Go</span><span>0.5 GB</span></div></a>
<a class="tile c-memused" href="#cmp-stats"><div class="l">Memory used (avg)</div><div class="r"><span class="k">Java</span><span>1,838 MiB</span></div><div class="r go"><span>Go</span><span>48 MiB</span></div></a>
<a class="tile c-median" href="#cmp-stats"><div class="l">Median request</div><div class="r"><span class="k">Java</span><span>34 ms</span></div><div class="r go"><span>Go</span><span>31 ms</span></div></a>
<a class="tile c-p99" href="#cmp-stats"><div class="l">Slow requests (p99)</div><div class="r"><span class="k">Java</span><span>6.0 s</span></div><div class="r go"><span>Go</span><span>1.4 s</span></div></a>
<a class="tile c-errors" href="#cmp-stats"><div class="l">Server errors (one day)</div><div class="r"><span class="k">Java</span><span>60 of 114,938</span></div><div class="r go"><span>Go</span><span>0 of 11,924</span></div></a>
<a class="tile c-cost" href="#cmp-stats"><div class="l">Monthly server cost</div><div class="r"><span class="k">Java</span><span>~$1,500</span></div><div class="r go"><span>Go</span><span>~$160</span></div></a>
<a class="tile c-import" href="#cmp-stats"><div class="l">MSK-IMPACT import</div><div class="r"><span class="k">Java</span><span>289 s</span></div><div class="r go"><span>Go</span><span>80 s</span></div></a>
<a class="tile c-image" href="#cmp-stats"><div class="l">Container image</div><div class="r"><span class="k">Java</span><span>1.3 GB</span></div><div class="r go"><span>Go</span><span>100 MB</span></div></a>
</div>
<div class="cmp-cards"><p class="cmp-default">Hover over or tap a tile for what it measures.</p>
<div class="cmp-card card-loc"><strong>Lines of code:</strong> The web API and the importer together. Java&#x27;s count includes configuration. Go&#x27;s code lives in one repository and has three outside dependencies.</div>
<div class="cmp-card card-memres"><strong>Memory reserved:</strong> What each production server sets aside. Java can grow to 12 GB and Go to 2 GB.</div>
<div class="cmp-card card-memused"><strong>Memory used (avg):</strong> Average over one day of copied traffic. Go peaked at 131 MiB, while carrying a tenth of Java&#x27;s load.</div>
<div class="cmp-card card-median"><strong>Median request:</strong> Half of all requests are answered faster than this. Java answers many small repeated requests from its Redis cache; Go has no response cache.</div>
<div class="cmp-card card-p99"><strong>Slow requests (p99):</strong> The slowest 1% of requests. Go&#x27;s p99 is lower on every busy route, but rests on fewer requests than Java&#x27;s.</div>
<div class="cmp-card card-errors"><strong>Server errors (one day):</strong> Java answered all of the day&#x27;s requests, Go a 10% copy. At Java&#x27;s rate Go would have had about 6 errors, so zero is encouraging but not proof.</div>
<div class="cmp-card card-cost"><strong>Monthly server cost:</strong> An estimate for the 20 Java backend servers MSK runs across its portals, about $1,280, plus about $215 for Redis. Go would fit on two servers, but hasn&#x27;t been tested at full traffic yet.</div>
<div class="cmp-card card-import"><strong>MSK-IMPACT import:</strong> Loading the largest public study (50,000 samples) from its files. Java&#x27;s importer used 3.9 GB of memory, Go&#x27;s 0.2 GB.</div>
<div class="cmp-card card-image"><strong>Container image:</strong> The download size of the server, with the website included.</div>
</div>
</div>

Speed, memory and errors come from one day in October when Go got a copy of
10% of the public portal's API requests. Speed compares fairly. Memory,
errors and cost are less certain until Go has run at full traffic.

Java's Redis cache mattered less than we expected. It answers 65 to 75% of
Java's lookups, which makes Java faster on small requests that repeat often.
Go has no response cache, yet it matches Java's typical response time and
beats it on slow requests. On the API portal's traffic it even put slightly
less load on ClickHouse per request. Leaving out Redis saves another $215 a
month.

In the nightly check of October 12, 4,531 of 4,959 replayed production
requests gave identical answers. The other 428 all had known causes, for
example a Java bug that Go fixes, or an answer Java itself gives differently
each time. None were unexplained. [RFC 106](https://docs.google.com/document/d/18k_fiIzPCetgWbBzhkq72bpa636tMnxVyZH0BwEDe4E/edit) asks for seven clean nights
in a row before Go serves real traffic.

The AI tools ran on Claude subscriptions, a few hundred dollars over three
months. At Claude API list prices the same work would have cost about $2,000
($550 in July and $1,400 in October), less than two months of the estimated
server savings. 98% of what the agents read was served from the prompt cache.
Without it, the bill would have been about $22,500.

## How many prompts?

The work took a few weeks of supervised agent time, spread over three months
next to my other work. It ran mostly as one long Claude Code session in a tmux
window on a server (the setup is in my [async software engineering
post](/async-software-engineering/)). That main session handed single tasks,
such as one group of endpoints or one speed fix, to helper agents, each
working in its own copy of the repository. A change went in only after the
tests passed and its measurements were checked.

The work came in two stretches, July and October, with a pause in between.
Git agrees: there are no commits from late July until October 2. The chart
shows my messages, the agents' tool calls, commits and the size of the code
per day.

<figure class="tl-fig" id="timeline-chart">
<style>
.tl-fig a.tl-day { outline: none; cursor: pointer; }
.tl-fig a.tl-day:hover rect, .tl-fig a.tl-day:focus rect { fill-opacity: 0.12; }
.tl-cards { min-height: 2.6em; margin-top: 0.3em; }
.tl-card { display: none; border-left: 3px solid #2a78d6; padding: 0.3em 0.8em; font-size: 0.9em; }
.tl-default { display: block; opacity: 0.7; font-size: 0.9em; margin: 0; }
.tl-fig:has(a.tl-day:hover, a.tl-day:focus) .tl-default { display: none; }
.tl-fig:has(.d-b0708:hover, .d-b0708:focus) .card-b0708 { display: block; }
.tl-fig:has(.d-d0630:hover, .d-d0630:focus) .card-d0630 { display: block; }
.tl-fig:has(.d-d0701:hover, .d-d0701:focus) .card-d0701 { display: block; }
.tl-fig:has(.d-d0702:hover, .d-d0702:focus) .card-d0702 { display: block; }
.tl-fig:has(.d-d0703:hover, .d-d0703:focus) .card-d0703 { display: block; }
.tl-fig:has(.d-d0704:hover, .d-d0704:focus) .card-d0704 { display: block; }
.tl-fig:has(.d-d0705:hover, .d-d0705:focus) .card-d0705 { display: block; }
.tl-fig:has(.d-d0706:hover, .d-d0706:focus) .card-d0706 { display: block; }
.tl-fig:has(.d-d0707:hover, .d-d0707:focus) .card-d0707 { display: block; }
.tl-fig:has(.d-d1001:hover, .d-d1001:focus) .card-d1001 { display: block; }
.tl-fig:has(.d-d1002:hover, .d-d1002:focus) .card-d1002 { display: block; }
.tl-fig:has(.d-d1003:hover, .d-d1003:focus) .card-d1003 { display: block; }
.tl-fig:has(.d-d1004:hover, .d-d1004:focus) .card-d1004 { display: block; }
.tl-fig:has(.d-d1005:hover, .d-d1005:focus) .card-d1005 { display: block; }
.tl-fig:has(.d-d1006:hover, .d-d1006:focus) .card-d1006 { display: block; }
.tl-fig:has(.d-d1007:hover, .d-d1007:focus) .card-d1007 { display: block; }
.tl-fig:has(.d-d1008:hover, .d-d1008:focus) .card-d1008 { display: block; }
.tl-fig:has(.d-d1009:hover, .d-d1009:focus) .card-d1009 { display: block; }
.tl-fig:has(.d-d1010:hover, .d-d1010:focus) .card-d1010 { display: block; }
.tl-fig:has(.d-d1011:hover, .d-d1011:focus) .card-d1011 { display: block; }
.tl-fig:has(.d-d1012:hover, .d-d1012:focus) .card-d1012 { display: block; }
.tl-fig:has(.d-d1013:hover, .d-d1013:focus) .card-d1013 { display: block; }
.tl-fig:has(.d-d1014:hover, .d-d1014:focus) .card-d1014 { display: block; }
.tl-fig:has(.d-d1015:hover, .d-d1015:focus) .card-d1015 { display: block; }
</style>
<svg viewBox="0 0 680 436" width="100%" role="img" aria-label="Messages, agent tool calls, commits and lines of Go per day, Jun 30 to Oct 15" xmlns="http://www.w3.org/2000/svg" style="max-width:680px;font:12px system-ui,sans-serif">
<path d="M9.0,18 v-4 H226.8 v4" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1"/>
<text x="117.9" y="10" text-anchor="middle" fill="currentColor" fill-opacity="0.8" font-size="11">Claude Opus 4.8</text>
<path d="M260.8,18 v-4 H671.0 v4" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1"/>
<text x="465.9" y="10" text-anchor="middle" fill="currentColor" fill-opacity="0.8" font-size="11">Claude Opus 5.5</text>
<g transform="translate(0,22)">
<rect x="227.8" y="0" width="32" height="378" fill="currentColor" fill-opacity="0.06"/>
<text x="8" y="13" fill="currentColor" font-weight="600">Messages I typed per day</text>
<line x1="8.0" x2="227.8" y1="84" y2="84" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<line x1="259.8" x2="672.0" y1="84" y2="84" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<polyline points="227.8,84.0 235.8,80.0 243.8,88.0 251.8,80.0 259.8,84.0" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<path d="M9.0,84 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<path d="M64.0,84 v-1.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v1.9 z" fill="#2a78d6"/>
<path d="M91.4,84 v-20.3 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v20.3 z" fill="#2a78d6"/>
<path d="M118.9,84 v-0.0 a1.3617021276595744,1.3617021276595744 0 0 1 1.3617021276595744,-1.3617021276595744 h22.8 a1.3617021276595744,1.3617021276595744 0 0 1 1.3617021276595744,1.3617021276595744 v0.0 z" fill="#2a78d6"/>
<path d="M146.4,84 v-1.2 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v1.2 z" fill="#2a78d6"/>
<path d="M260.8,84 v-0.0 a1.3617021276595744,1.3617021276595744 0 0 1 1.3617021276595744,-1.3617021276595744 h22.8 a1.3617021276595744,1.3617021276595744 0 0 1 1.3617021276595744,1.3617021276595744 v0.0 z" fill="#2a78d6"/>
<path d="M288.3,84 v-62.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v62.5 z" fill="#2a78d6"/>
<path d="M315.8,84 v-12.8 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v12.8 z" fill="#2a78d6"/>
<path d="M343.3,84 v-6.7 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v6.7 z" fill="#2a78d6"/>
<path d="M370.7,84 v-47.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v47.5 z" fill="#2a78d6"/>
<path d="M398.2,84 v-11.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v11.4 z" fill="#2a78d6"/>
<path d="M425.7,84 v-31.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v31.9 z" fill="#2a78d6"/>
<path d="M453.2,84 v-41.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v41.4 z" fill="#2a78d6"/>
<path d="M480.7,84 v-9.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v9.4 z" fill="#2a78d6"/>
<path d="M508.1,84 v-3.3 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v3.3 z" fill="#2a78d6"/>
<path d="M535.6,84 v-1.2 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v1.2 z" fill="#2a78d6"/>
<path d="M563.1,84 v-30.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v30.5 z" fill="#2a78d6"/>
<path d="M590.6,84 v-21.6 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v21.6 z" fill="#2a78d6"/>
<path d="M618.0,84 v-7.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v7.4 z" fill="#2a78d6"/>
<text x="317.8" y="30" text-anchor="start" fill="currentColor" fill-opacity="0.8">peak 94 (Oct 2)</text>
<polyline points="273.6,83.8 301.0,74.7 328.5,72.6 356.0,71.5 383.5,64.4 411.0,62.6 438.4,57.8 465.9,51.9 493.4,59.5 520.9,60.9 548.3,61.6 575.8,64.1 603.3,62.6 630.8,66.1 658.3,72.2" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="2" stroke-linejoin="round"/>
<line x1="10" x2="26" y1="26" y2="26" stroke="currentColor" stroke-opacity="0.85" stroke-width="2"/>
<text x="31" y="30" fill="currentColor" fill-opacity="0.8">7-day average</text>
<text x="8" y="111" fill="currentColor" font-weight="600">Agent tool calls per day</text>
<line x1="8.0" x2="227.8" y1="182" y2="182" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<line x1="259.8" x2="672.0" y1="182" y2="182" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<polyline points="227.8,182.0 235.8,178.0 243.8,186.0 251.8,178.0 259.8,182.0" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<path d="M9.0,182 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<path d="M64.0,182 v-0.7 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v0.7 z" fill="#2a78d6"/>
<path d="M91.4,182 v-15.0 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v15.0 z" fill="#2a78d6"/>
<path d="M118.9,182 v-3.7 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v3.7 z" fill="#2a78d6"/>
<path d="M146.4,182 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<path d="M173.9,182 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<path d="M201.3,182 v-0.0 a1.3444312326595322,1.3444312326595322 0 0 1 1.3444312326595322,-1.3444312326595322 h22.8 a1.3444312326595322,1.3444312326595322 0 0 1 1.3444312326595322,1.3444312326595322 v0.0 z" fill="#2a78d6"/>
<path d="M260.8,182 v-9.0 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v9.0 z" fill="#2a78d6"/>
<path d="M288.3,182 v-62.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v62.5 z" fill="#2a78d6"/>
<path d="M315.8,182 v-8.7 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v8.7 z" fill="#2a78d6"/>
<path d="M343.3,182 v-5.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v5.5 z" fill="#2a78d6"/>
<path d="M370.7,182 v-30.6 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v30.6 z" fill="#2a78d6"/>
<path d="M398.2,182 v-10.3 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v10.3 z" fill="#2a78d6"/>
<path d="M425.7,182 v-9.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v9.9 z" fill="#2a78d6"/>
<path d="M453.2,182 v-57.1 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v57.1 z" fill="#2a78d6"/>
<path d="M480.7,182 v-4.2 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v4.2 z" fill="#2a78d6"/>
<path d="M508.1,182 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<path d="M535.6,182 v-5.6 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v5.6 z" fill="#2a78d6"/>
<path d="M563.1,182 v-11.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v11.9 z" fill="#2a78d6"/>
<path d="M590.6,182 v-0.2 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v0.2 z" fill="#2a78d6"/>
<path d="M618.0,182 v-1.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v1.5 z" fill="#2a78d6"/>
<path d="M645.5,182 v-0.0 a1.0,1.0 0 0 1 1.0,-1.0 h23.5 a1.0,1.0 0 0 1 1.0,1.0 v0.0 z" fill="#2a78d6"/>
<text x="317.8" y="128" text-anchor="start" fill="currentColor" fill-opacity="0.8">peak 5,046 (Oct 2)</text>
<polyline points="273.6,180.5 301.0,171.4 328.5,169.9 356.0,168.9 383.5,164.3 411.0,162.6 438.4,161.0 465.9,154.1 493.4,162.5 520.9,163.9 548.3,163.9 575.8,166.5 603.3,168.0 630.8,169.2 658.3,177.4" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="2" stroke-linejoin="round"/>
<text x="8" y="209" fill="currentColor" font-weight="600">Commits per day</text>
<line x1="8.0" x2="227.8" y1="280" y2="280" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<line x1="259.8" x2="672.0" y1="280" y2="280" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<polyline points="227.8,280.0 235.8,276.0 243.8,284.0 251.8,276.0 259.8,280.0" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<path d="M146.4,280 v-0.0 a1.28,1.28 0 0 1 1.28,-1.28 h22.9 a1.28,1.28 0 0 1 1.28,1.28 v0.0 z" fill="#2a78d6"/>
<path d="M173.9,280 v-0.0 a1.28,1.28 0 0 1 1.28,-1.28 h22.9 a1.28,1.28 0 0 1 1.28,1.28 v0.0 z" fill="#2a78d6"/>
<path d="M201.3,280 v-1.7 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v1.7 z" fill="#2a78d6"/>
<path d="M288.3,280 v-27.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v27.9 z" fill="#2a78d6"/>
<path d="M315.8,280 v-11.9 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v11.9 z" fill="#2a78d6"/>
<path d="M343.3,280 v-4.3 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v4.3 z" fill="#2a78d6"/>
<path d="M370.7,280 v-19.6 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v19.6 z" fill="#2a78d6"/>
<path d="M398.2,280 v-17.1 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v17.1 z" fill="#2a78d6"/>
<path d="M425.7,280 v-6.2 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v6.2 z" fill="#2a78d6"/>
<path d="M453.2,280 v-62.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v62.5 z" fill="#2a78d6"/>
<path d="M480.7,280 v-2.3 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v2.3 z" fill="#2a78d6"/>
<path d="M508.1,280 v-0.0 a1.28,1.28 0 0 1 1.28,-1.28 h22.9 a1.28,1.28 0 0 1 1.28,1.28 v0.0 z" fill="#2a78d6"/>
<path d="M535.6,280 v-9.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v9.4 z" fill="#2a78d6"/>
<path d="M563.1,280 v-14.5 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v14.5 z" fill="#2a78d6"/>
<path d="M590.6,280 v-0.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v0.4 z" fill="#2a78d6"/>
<path d="M618.0,280 v-3.0 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v3.0 z" fill="#2a78d6"/>
<path d="M645.5,280 v-0.4 a1.5,1.5 0 0 1 1.5,-1.5 h22.5 a1.5,1.5 0 0 1 1.5,1.5 v0.4 z" fill="#2a78d6"/>
<text x="482.7" y="226" text-anchor="start" fill="currentColor" fill-opacity="0.8">peak 100 (Oct 8)</text>
<polyline points="273.6,280.0 301.0,275.8 328.5,273.9 356.0,273.1 383.5,270.0 411.0,267.4 438.4,266.3 465.9,257.1 493.4,260.8 520.9,262.5 548.3,261.8 575.8,262.5 603.3,264.9 630.8,265.4 658.3,274.2" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="2" stroke-linejoin="round"/>
<text x="8" y="307" fill="currentColor" font-weight="600">Lines of Go on main (tests included)</text>
<line x1="8.0" x2="227.8" y1="378" y2="378" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<line x1="259.8" x2="672.0" y1="378" y2="378" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
<polyline points="227.8,378.0 235.8,374.0 243.8,382.0 251.8,374.0 259.8,378.0" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<path d="M145.4,369.3 L172.9,369.3 L172.9,369.2 L200.3,369.2 L200.3,369.1 L227.8,369.1" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round"/>
<polyline points="227.8,369.1 235.8,365.1 243.8,373.1 251.8,365.1 259.8,369.1" fill="none" stroke="#2a78d6" stroke-width="2"/>
<path d="M259.8,368.6 L287.3,368.6 L287.3,343.8 L314.8,343.8 L314.8,341.4 L342.3,341.4 L342.3,339.6 L369.7,339.6 L369.7,333.8 L397.2,333.8 L397.2,332.8 L424.7,332.8 L424.7,331.8 L452.2,331.8 L452.2,318.4 L479.7,318.4 L479.7,318.0 L507.1,318.0 L507.1,317.9 L534.6,317.9 L534.6,317.1 L562.1,317.1 L562.1,314.6 L589.6,314.6 L589.6,314.5 L617.0,314.5 L617.0,314.1 L644.5,314.1 L644.5,314.0 L672.0,314.0" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round"/>
<text x="155.1" y="363.3" text-anchor="end" fill="currentColor" fill-opacity="0.8">first commit: 10k</text>
<text x="654.3" y="308.0" text-anchor="end" fill="currentColor" fill-opacity="0.8">77k</text>
<text x="218.1" y="363.1" text-anchor="start" fill="currentColor" fill-opacity="0.8">11k</text>
<line x1="21.7" x2="21.7" y1="84" y2="88" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="21.7" x2="21.7" y1="182" y2="186" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="21.7" x2="21.7" y1="280" y2="284" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="21.7" x2="21.7" y1="378" y2="382" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="21.7" y="408" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Jun 30</text>
<line x1="186.6" x2="186.6" y1="84" y2="88" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="186.6" x2="186.6" y1="182" y2="186" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="186.6" x2="186.6" y1="280" y2="284" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="186.6" x2="186.6" y1="378" y2="382" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="186.6" y="408" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Jul 6</text>
<line x1="273.6" x2="273.6" y1="84" y2="88" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="273.6" x2="273.6" y1="182" y2="186" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="273.6" x2="273.6" y1="280" y2="284" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="273.6" x2="273.6" y1="378" y2="382" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="273.6" y="408" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Oct 1</text>
<line x1="383.5" x2="383.5" y1="84" y2="88" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="383.5" x2="383.5" y1="182" y2="186" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="383.5" x2="383.5" y1="280" y2="284" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="383.5" x2="383.5" y1="378" y2="382" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="383.5" y="408" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Oct 5</text>
<line x1="575.8" x2="575.8" y1="84" y2="88" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="575.8" x2="575.8" y1="182" y2="186" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="575.8" x2="575.8" y1="280" y2="284" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<line x1="575.8" x2="575.8" y1="378" y2="382" stroke="currentColor" stroke-opacity="0.5" stroke-width="1"/>
<text x="575.8" y="408" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Oct 12</text>
<a class="tl-day d-b0708" href="#timeline-chart"><rect x="227.8" y="0" width="32" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0630" href="#timeline-chart"><rect x="8.0" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0701" href="#timeline-chart"><rect x="35.5" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0702" href="#timeline-chart"><rect x="63.0" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0703" href="#timeline-chart"><rect x="90.4" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0704" href="#timeline-chart"><rect x="117.9" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0705" href="#timeline-chart"><rect x="145.4" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0706" href="#timeline-chart"><rect x="172.9" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d0707" href="#timeline-chart"><rect x="200.3" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1001" href="#timeline-chart"><rect x="259.8" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1002" href="#timeline-chart"><rect x="287.3" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1003" href="#timeline-chart"><rect x="314.8" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1004" href="#timeline-chart"><rect x="342.3" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1005" href="#timeline-chart"><rect x="369.7" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1006" href="#timeline-chart"><rect x="397.2" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1007" href="#timeline-chart"><rect x="424.7" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1008" href="#timeline-chart"><rect x="452.2" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1009" href="#timeline-chart"><rect x="479.7" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1010" href="#timeline-chart"><rect x="507.1" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1011" href="#timeline-chart"><rect x="534.6" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1012" href="#timeline-chart"><rect x="562.1" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1013" href="#timeline-chart"><rect x="589.6" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1014" href="#timeline-chart"><rect x="617.0" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
<a class="tl-day d-d1015" href="#timeline-chart"><rect x="644.5" y="0" width="27.5" height="378" fill="currentColor" fill-opacity="0"/></a>
</g></svg>
<div class="tl-cards">
<p class="tl-default">Hover over or tap a day to see its numbers.</p>
<div class="tl-card card-b0708"><strong>Jul 8 to Sep 30: low activity, 11 messages and 5 commits in total.</strong></div>
<div class="tl-card card-d0630"><strong>Tue Jun 30</strong>: 1 messages from me, 7 agent tool calls, 0 commits, Go code not committed yet, Claude Opus 4.6.</div>
<div class="tl-card card-d0701"><strong>Wed Jul 1</strong>: 0 messages from me, 0 agent tool calls, 0 commits, Go code not committed yet.</div>
<div class="tl-card card-d0702"><strong>Thu Jul 2</strong>: 5 messages from me, 175 agent tool calls, 0 commits, Go code not committed yet, Claude Opus 4.8.</div>
<div class="tl-card card-d0703"><strong>Fri Jul 3</strong>: 32 messages from me, 1,297 agent tool calls, 0 commits, Go code not committed yet, Claude Opus 4.8.</div>
<div class="tl-card card-d0704"><strong>Sat Jul 4</strong>: 2 messages from me, 412 agent tool calls, 0 commits, Go code not committed yet, Claude Opus 4.8.</div>
<div class="tl-card card-d0705"><strong>Sun Jul 5</strong>: 4 messages from me, 76 agent tool calls, 2 commits, 10,402 lines of Go, Claude Opus 4.8.</div>
<div class="tl-card card-d0706"><strong>Mon Jul 6</strong>: 0 messages from me, 23 agent tool calls, 2 commits, 10,528 lines of Go, Claude Opus 4.8.</div>
<div class="tl-card card-d0707"><strong>Tue Jul 7</strong>: 0 messages from me, 106 agent tool calls, 5 commits, 10,605 lines of Go, Claude Opus 4.8.</div>
<div class="tl-card card-d1001"><strong>Thu Oct 1</strong>: 2 messages from me, 824 agent tool calls, 0 commits, 11,206 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1002"><strong>Fri Oct 2</strong>: 94 messages from me, 5,046 agent tool calls, 46 commits, 40,953 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1003"><strong>Sat Oct 3</strong>: 21 messages from me, 806 agent tool calls, 21 commits, 43,828 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1004"><strong>Sun Oct 4</strong>: 12 messages from me, 551 agent tool calls, 9 commits, 46,007 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1005"><strong>Mon Oct 5</strong>: 72 messages from me, 2,529 agent tool calls, 33 commits, 52,991 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1006"><strong>Tue Oct 6</strong>: 19 messages from me, 928 agent tool calls, 29 commits, 54,158 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1007"><strong>Wed Oct 7</strong>: 49 messages from me, 898 agent tool calls, 12 commits, 55,302 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1008"><strong>Thu Oct 8</strong>: 63 messages from me, 4,618 agent tool calls, 100 commits, 71,413 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1009"><strong>Fri Oct 9</strong>: 16 messages from me, 449 agent tool calls, 6 commits, 71,917 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1010"><strong>Sat Oct 10</strong>: 7 messages from me, 25 agent tool calls, 2 commits, 71,984 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1011"><strong>Sun Oct 11</strong>: 4 messages from me, 561 agent tool calls, 17 commits, 72,894 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1012"><strong>Mon Oct 12</strong>: 47 messages from me, 1,054 agent tool calls, 25 commits, 75,961 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1013"><strong>Tue Oct 13</strong>: 34 messages from me, 131 agent tool calls, 3 commits, 76,067 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1014"><strong>Wed Oct 14</strong>: 13 messages from me, 239 agent tool calls, 7 commits, 76,566 lines of Go, Claude Opus 5.5.</div>
<div class="tl-card card-d1015"><strong>Thu Oct 15</strong>: 0 messages from me, 60 agent tool calls, 3 commits, 76,626 lines of Go, Claude Opus 5.5.</div>
</div>
<figcaption>My messages, the agents' tool calls, commits and code size over time, and the model the agents ran on. Lines show the 7-day average in October. The zigzag skips July 8 to September 30, a stretch of low activity.</figcaption>
</figure>

My messages fall on 24 days. If messages less than 30 minutes apart count as
one sitting, that's about 38 hours of typing to agents, much of it from my
phone. Reading results or clicking through the website without typing isn't
counted, so my real time was higher.

Here is what the session logs show:

<div class="log-wrap" id="log-stats">
<style>
.log-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin: 0.5em 0 0.4em; }
.log-stats a.tile { display: block; color: inherit; text-decoration: none; outline: none; cursor: pointer; border: 1px solid rgba(127,127,127,0.35); border-radius: 6px; padding: 8px 10px; }
.log-stats a.tile:hover, .log-stats a.tile:focus { border-color: #2a78d6; }
.log-stats .v { font-size: 1.35em; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.log-stats .l { font-size: 0.8em; opacity: 0.75; line-height: 1.3; }
.log-cards { min-height: 3.2em; margin-bottom: 1.2em; }
.log-card { display: none; border-left: 3px solid #2a78d6; padding: 0.3em 0.8em; font-size: 0.9em; }
.log-default { display: block; opacity: 0.7; font-size: 0.9em; margin: 0; }
.log-wrap:has(a.tile:hover, a.tile:focus) .log-default { display: none; }
.log-wrap:has(.c-typed:hover, .c-typed:focus) .card-typed { display: block; }
.log-wrap:has(.c-agent:hover, .c-agent:focus) .card-agent { display: block; }
.log-wrap:has(.c-tools:hover, .c-tools:focus) .card-tools { display: block; }
.log-wrap:has(.c-helpers:hover, .c-helpers:focus) .card-helpers { display: block; }
.log-wrap:has(.c-builds:hover, .c-builds:focus) .card-builds { display: block; }
.log-wrap:has(.c-tests:hover, .c-tests:focus) .card-tests { display: block; }
.log-wrap:has(.c-commits:hover, .c-commits:focus) .card-commits { display: block; }
.log-wrap:has(.c-pushes:hover, .c-pushes:focus) .card-pushes { display: block; }
.log-wrap:has(.c-rebases:hover, .c-rebases:focus) .card-rebases { display: block; }
.log-wrap:has(.c-compactions:hover, .c-compactions:focus) .card-compactions { display: block; }
</style>
<div class="log-stats">
<a class="tile c-typed" href="#log-stats"><div class="v">508</div><div class="l">messages I typed</div></a>
<a class="tile c-agent" href="#log-stats"><div class="v">18,501</div><div class="l">agent messages</div></a>
<a class="tile c-tools" href="#log-stats"><div class="v">20,883</div><div class="l">tool calls</div></a>
<a class="tile c-helpers" href="#log-stats"><div class="v">147</div><div class="l">helper agents</div></a>
<a class="tile c-builds" href="#log-stats"><div class="v">1,266</div><div class="l">build commands</div></a>
<a class="tile c-tests" href="#log-stats"><div class="v">1,544</div><div class="l">test commands</div></a>
<a class="tile c-commits" href="#log-stats"><div class="v">354</div><div class="l">commits</div></a>
<a class="tile c-pushes" href="#log-stats"><div class="v">187</div><div class="l">pushes</div></a>
<a class="tile c-rebases" href="#log-stats"><div class="v">62</div><div class="l">rebases</div></a>
<a class="tile c-compactions" href="#log-stats"><div class="v">12</div><div class="l">context compactions</div></a>
</div>
<div class="log-cards"><p class="log-default">Hover over or tap a tile for what was counted. The counts cover the main sessions and their helper agents in July and October.</p>
<div class="log-card card-typed"><strong>508 messages I typed:</strong> Everything I typed to the agents, including messages sent while an agent was busy. Slash commands, automatic notices and scheduled prompts aren&#x27;t counted.</div>
<div class="log-card card-agent"><strong>18,501 agent messages:</strong> Replies and steps from the main sessions and their helper agents. One message can hold text and several tool calls.</div>
<div class="log-card card-tools"><strong>20,883 tool calls:</strong> Every action an agent took: running a shell command, reading or editing a file, starting a helper. 17,174 of them were shell commands.</div>
<div class="log-card card-helpers"><strong>147 helper agents:</strong> Tasks the main session handed off, each working in its own copy of the repository.</div>
<div class="log-card card-builds"><strong>1,266 build commands:</strong> Runs of go build, go vet and make build.</div>
<div class="log-card card-tests"><strong>1,544 test commands:</strong> 1,103 unit test runs and 441 end-to-end runs, including cBioPortal&#x27;s website test suite in a browser.</div>
<div class="log-card card-commits"><strong>354 commits:</strong> Commit commands the agents ran. Git ends up with fewer, because some commits were amended or squashed before merging.</div>
<div class="log-card card-pushes"><strong>187 pushes:</strong> Pushes to GitHub, mostly to branches for pull requests. The agents opened 31 pull requests.</div>
<div class="log-card card-rebases"><strong>62 rebases:</strong> Rebases to bring a branch up to date with main before merging.</div>
<div class="log-card card-compactions"><strong>12 context compactions:</strong> Times a session filled its context and Claude Code summarized the history so it could keep going.</div>
</div>
</div>

For every message I typed, the agents sent about 36 of their own.

## Prompts categorized

GitHub's [Copilot write-up](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/) sorted its engineers' messages to the
agents by main purpose. I sorted my 508 messages into the same categories. An
LLM did the labeling and I checked a sample by hand.

<figure class="intent-fig" id="intent-chart">
<style>
.intent-fig a.cat { color: inherit; text-decoration: none; outline: none; cursor: pointer; }
.intent-fig:has(a.cat:hover, a.cat:focus) a.cat:not(:hover):not(:focus) { opacity: 0.45; }
.intent-cards { min-height: 4.2em; margin-top: 0.4em; }
.intent-card { display: none; border-left: 3px solid #2a78d6; padding: 0.3em 0.8em; font-size: 0.9em; }
.intent-card p { margin: 0.15em 0; }
.intent-default { display: block; opacity: 0.7; font-size: 0.9em; }
.intent-fig:has(a.cat:hover, a.cat:focus) .intent-default { display: none; }
.intent-fig:has(.c-status_request:hover, .c-status_request:focus) .card-status_request { display: block; }
.intent-fig:has(.c-approval_short:hover, .c-approval_short:focus) .card-approval_short { display: block; }
.intent-fig:has(.c-technical_challenge:hover, .c-technical_challenge:focus) .card-technical_challenge { display: block; }
.intent-fig:has(.c-scope_clarification:hover, .c-scope_clarification:focus) .card-scope_clarification { display: block; }
.intent-fig:has(.c-git_pr_logistics:hover, .c-git_pr_logistics:focus) .card-git_pr_logistics { display: block; }
.intent-fig:has(.c-kickoff:hover, .c-kickoff:focus) .card-kickoff { display: block; }
.intent-fig:has(.c-resource_fleet:hover, .c-resource_fleet:focus) .card-resource_fleet { display: block; }
.intent-fig:has(.c-review_testing_ci:hover, .c-review_testing_ci:focus) .card-review_testing_ci { display: block; }
.intent-fig:has(.c-forward_pressure:hover, .c-forward_pressure:focus) .card-forward_pressure { display: block; }
.intent-fig:has(.c-course_correction:hover, .c-course_correction:focus) .card-course_correction { display: block; }
.intent-fig:has(.c-other:hover, .c-other:focus) .card-other { display: block; }
</style>
<svg viewBox="0 0 680 346" width="100%" role="img" aria-label="Share of 508 developer messages by primary intent" xmlns="http://www.w3.org/2000/svg" style="max-width:680px;font:13px system-ui,sans-serif">
<line x1="250" y1="4" x2="250" y2="340" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
<a class="cat c-status_request" href="#intent-chart" aria-label="Status or explanation request: Asking what happened or why"><title>Status or explanation request: 89 messages (17.5%)</title>
<rect x="0" y="8" width="680" height="30" fill="transparent"/>
<text x="240" y="23.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Status or explanation request</text>
<path d="M250,14.0 h336.0 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-336.0 z" fill="#2a78d6"/>
<text x="598.0" y="23.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">18% (89)</text></a>
<a class="cat c-approval_short" href="#intent-chart" aria-label="Approval or short answer: Replying to the agent&#x27;s question"><title>Approval or short answer: 76 messages (15.0%)</title>
<rect x="0" y="38" width="680" height="30" fill="transparent"/>
<text x="240" y="53.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Approval or short answer</text>
<path d="M250,44.0 h286.33707865168543 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-286.33707865168543 z" fill="#2a78d6"/>
<text x="548.3370786516855" y="53.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">15% (76)</text></a>
<a class="cat c-technical_challenge" href="#intent-chart" aria-label="Technical or design challenge: Questioning or proposing an approach"><title>Technical or design challenge: 72 messages (14.2%)</title>
<rect x="0" y="68" width="680" height="30" fill="transparent"/>
<text x="240" y="83.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Technical or design challenge</text>
<path d="M250,74.0 h271.0561797752809 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-271.0561797752809 z" fill="#2a78d6"/>
<text x="533.056179775281" y="83.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">14% (72)</text></a>
<a class="cat c-scope_clarification" href="#intent-chart" aria-label="Scope clarification: What&#x27;s in or out, and what it should look like"><title>Scope clarification: 60 messages (11.8%)</title>
<rect x="0" y="98" width="680" height="30" fill="transparent"/>
<text x="240" y="113.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Scope clarification</text>
<path d="M250,104.0 h225.21348314606743 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-225.21348314606743 z" fill="#2a78d6"/>
<text x="487.21348314606746" y="113.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">12% (60)</text></a>
<a class="cat c-git_pr_logistics" href="#intent-chart" aria-label="Git, PR and session logistics: Branches, commits, pull requests, crashed sessions"><title>Git, PR and session logistics: 42 messages (8.3%)</title>
<rect x="0" y="128" width="680" height="30" fill="transparent"/>
<text x="240" y="143.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Git, PR and session logistics</text>
<path d="M250,134.0 h156.44943820224722 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-156.44943820224722 z" fill="#2a78d6"/>
<text x="418.4494382022472" y="143.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">8% (42)</text></a>
<a class="cat c-kickoff" href="#intent-chart" aria-label="Kickoff: Starting a new task"><title>Kickoff: 40 messages (7.9%)</title>
<rect x="0" y="158" width="680" height="30" fill="transparent"/>
<text x="240" y="173.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Kickoff</text>
<path d="M250,164.0 h148.80898876404495 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-148.80898876404495 z" fill="#2a78d6"/>
<text x="410.80898876404495" y="173.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">8% (40)</text></a>
<a class="cat c-resource_fleet" href="#intent-chart" aria-label="Resource and fleet coordination: Servers, secrets, DNS, helper agents"><title>Resource and fleet coordination: 33 messages (6.5%)</title>
<rect x="0" y="188" width="680" height="30" fill="transparent"/>
<text x="240" y="203.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Resource and fleet coordination</text>
<path d="M250,194.0 h122.06741573033707 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-122.06741573033707 z" fill="#2a78d6"/>
<text x="384.0674157303371" y="203.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">6% (33)</text></a>
<a class="cat c-review_testing_ci" href="#intent-chart" aria-label="Review, testing and CI: Reporting what&#x27;s broken or reviewing results"><title>Review, testing and CI: 33 messages (6.5%)</title>
<rect x="0" y="218" width="680" height="30" fill="transparent"/>
<text x="240" y="233.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Review, testing and CI</text>
<path d="M250,224.0 h122.06741573033707 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-122.06741573033707 z" fill="#2a78d6"/>
<text x="384.0674157303371" y="233.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">6% (33)</text></a>
<a class="cat c-forward_pressure" href="#intent-chart" aria-label="Forward pressure and completeness: Pushing to keep going or finish"><title>Forward pressure and completeness: 24 messages (4.7%)</title>
<rect x="0" y="248" width="680" height="30" fill="transparent"/>
<text x="240" y="263.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Forward pressure and completeness</text>
<path d="M250,254.0 h87.68539325842697 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-87.68539325842697 z" fill="#2a78d6"/>
<text x="349.685393258427" y="263.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">5% (24)</text></a>
<a class="cat c-course_correction" href="#intent-chart" aria-label="Course correction: Telling the agent it&#x27;s on the wrong track"><title>Course correction: 20 messages (3.9%)</title>
<rect x="0" y="278" width="680" height="30" fill="transparent"/>
<text x="240" y="293.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Course correction</text>
<path d="M250,284.0 h72.40449438202248 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-72.40449438202248 z" fill="#2a78d6"/>
<text x="334.40449438202245" y="293.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">4% (20)</text></a>
<a class="cat c-other" href="#intent-chart" aria-label="Other: Anything else"><title>Other: 19 messages (3.7%)</title>
<rect x="0" y="308" width="680" height="30" fill="transparent"/>
<text x="240" y="323.0" text-anchor="end" dominant-baseline="central" fill="currentColor">Other</text>
<path d="M250,314.0 h68.58426966292136 a4,4 0 0 1 4,4 v10 a4,4 0 0 1 -4,4 h-68.58426966292136 z" fill="#2a78d6"/>
<text x="330.5842696629214" y="323.0" dominant-baseline="central" fill="currentColor" fill-opacity="0.75">4% (19)</text></a>
</svg>
<div class="intent-cards">
<p class="intent-default">Hover over or tap a bar to see what the category means and an example message.</p>
<div class="intent-card card-status_request"><p><strong>Status or explanation request:</strong> Asking what happened or why.</p><p><em>For example:</em> "What&#x27;s still missing before the API portal can switch?"</p></div>
<div class="intent-card card-approval_short"><p><strong>Approval or short answer:</strong> Replying to the agent&#x27;s question.</p><p><em>For example:</em> "Sounds good, go ahead."</p></div>
<div class="intent-card card-technical_challenge"><p><strong>Technical or design challenge:</strong> Questioning or proposing an approach.</p><p><em>For example:</em> "I am considering doing this in Go instead of Rust. What do you think?"</p></div>
<div class="intent-card card-scope_clarification"><p><strong>Scope clarification:</strong> What&#x27;s in or out, and what it should look like.</p><p><em>For example:</em> "Keep the benchmark short and add a table of contents."</p></div>
<div class="intent-card card-git_pr_logistics"><p><strong>Git, PR and session logistics:</strong> Branches, commits, pull requests, crashed sessions.</p><p><em>For example:</em> "Commit your work and open a pull request."</p></div>
<div class="intent-card card-kickoff"><p><strong>Kickoff:</strong> Starting a new task.</p><p><em>For example:</em> "Add CI tests to the repository."</p></div>
<div class="intent-card card-resource_fleet"><p><strong>Resource and fleet coordination:</strong> Servers, secrets, DNS, helper agents.</p><p><em>For example:</em> "I added the Docker Hub secrets."</p></div>
<div class="intent-card card-review_testing_ci"><p><strong>Review, testing and CI:</strong> Reporting what&#x27;s broken or reviewing results.</p><p><em>For example:</em> "Several study view tables don&#x27;t load."</p></div>
<div class="intent-card card-forward_pressure"><p><strong>Forward pressure and completeness:</strong> Pushing to keep going or finish.</p><p><em>For example:</em> "Port the rest of the endpoints."</p></div>
<div class="intent-card card-course_correction"><p><strong>Course correction:</strong> Telling the agent it&#x27;s on the wrong track.</p><p><em>For example:</em> "It works in production, so it must be a backend bug."</p></div>
<div class="intent-card card-other"><p><strong>Other:</strong> Anything else.</p><p><em>For example:</em> "One-off commands and IDs."</p></div>
</div>
<figcaption>What my 508 messages to the agents were mainly about. Examples are paraphrased.</figcaption>
</figure>

A third of my messages were check-ins: asking how a task was going (18%) or
answering yes or ok (15%). Another quarter steered the work, by questioning a
technical choice (14%) or setting the scope (12%). Just 4% told an agent it
was on the wrong track.

The mix is quite different from GitHub's. Their three biggest categories,
review and testing (31%), technical challenges (17%) and pushing for
completeness (15%), make up 63% of their messages and a quarter of mine. Only
technical challenges come out about the same. My agents ran the tests
themselves, and my own checking happened in the browser.

## Prompts: the new source code?

When an agent writes most of the code, people want to see your prompts as
much as your code. Did you let it run wild, or did you question the language
choice, the data model, the shortcuts it proposed? When I present this work,
people ask the same questions I asked the agent along the way.

Tools are starting to keep this record next to the code. Claude Code links
the session in the pull requests it opens, so a reviewer can read the
conversation behind a change. [Entire](https://entire.io/) is a company built
on this idea: its open-source CLI stores every agent session in the
repository, paired with the commit it produced and with secrets redacted.

Sessions also hold things you can't publish, like credentials that
showed up in tool output and internal hostnames. Sharing them inside your
team is fine. In public, share summaries and short excerpts instead. The
numbers from my logs in this post are all counts.

## Lessons

- **A mature codebase with lots of tests is easy to rewrite today.**
  We invested a lot in testing cBioPortal over the years, including
  end-to-end tests that click through the website in a browser. Our
  Kubernetes and Traefik setup also makes it easy to try things against real
  production traffic. That gave the agents a way to check every change
  against the original. In 2025 I
  [wrote](/ai-assisted-coding/) that AI tools struggled with large, mature
  codebases. With the latest models, that maturity is what made this rewrite
  possible.
- **You still need to know how the original works.** A rewrite is full of
  small decisions. Should the API reproduce Java's row order, even where Java
  never sorts and returns rows in whatever order the database left them?
  (Many differences came down to that.) Is Java's answer correct, or a bug
  worth fixing? The agent will decide for you if you let it. It's better to
  tell it, and that's much easier if you know the original code and how the
  program is used.
- **The agents needed the most help with unclear Java code.** The API has
  plenty of old bugs and some non-deterministic behavior, and the intent
  behind the code wasn't always clear.
- **I'm no Go expert.** I could check that the answers matched, but it was
  harder for me to judge the Go code itself or push back on it.
- **Store your prompts somewhere safe!** Those small decisions are exactly what
  others will ask about later, so keep a record of them. Claude Code deletes
  sessions after 30 days by default, so raise `cleanupPeriodDays` in your
  settings before you start.
- **Rewrites will only get easier.** So if you want to speed one up, you
  could just wait :).
