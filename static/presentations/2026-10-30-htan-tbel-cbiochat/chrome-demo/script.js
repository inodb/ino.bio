// Claude in Chrome on cbioportal.org: a scripted illustration. The page and slide images are real captures of the
// cBioPortal patient view (Minerva H&E viewer) for HTAN Vanderbilt sample HTA11_2951, taken 2026-10-25. Boxes are in
// page-image pixels (2400x1640 = the 1200x820 page at 2x) and were checked against the zoomed slide.
const CHROME = {
  url: 'cbioportal.org/patient/openResource_HE?studyId=crc_hta11_htan_2021&caseId=HTA11_2951',
  tab: 'Patient: HTA11_2951',
  overview: 'page-he-overview.jpg',
  zoom: 'page-he-zoom.jpg',
  slideCanvas: 'slide-canvas.jpg',   // the Minerva canvas alone (no info panel), for the zoom transition
  // Minerva view centers (overview canvas px → zoomed view), used to align the zoom transition
  zoomFrom: [1459, 257], zoomTo: [1200, 545], zoomFactor: 10, slideTop: 410, slideH: 1090, panel: [0, 410, 760, 900],
  boxes: [
    {r:[770, 852, 260, 496], label:'Adenomatous crypts', tag:'left'},
    {r:[1080, 1090, 380, 410], label:'Non-dysplastic crypts', tag:'below'},
    {r:[2122, 712, 275, 696], label:'Adenomatous crypts', tag:'leftOf'}
  ],
  turns: [
    { user: 'What am I looking at in this slide?',
      actions: ['Read page', 'Took a screenshot'],
      answer: 'This is the H&E slide for sample HTA11_2951 in Pre-cancer Colorectal Polyps (HTAN Vanderbilt, Cell 2021), shown in the Minerva viewer inside cBioPortal’s patient view. The study annotates this polyp as a tubular adenoma; the slide’s metadata gives the ascending colon as the site. The slide holds many small biopsy fragments of colonic mucosa.' },
    { user: 'Zoom in and show me the adenoma.',
      actions: ['Zoomed in', 'Took a screenshot'],
      answer: 'Upper left of this fragment: crypts lined by crowded, elongated, dark nuclei with few goblet cells — that’s the adenomatous epithelium. The round crypts in the middle, full of goblet cells, look like non-dysplastic mucosa. The fragment at the right edge is adenomatous too. This is a visual description, not a diagnosis.',
      hold: 2.5 },
    // Answered through the cBioPortal MCP connector; numbers from real MCP queries (2026-10-25).
    { user: 'How many other adenoma slides are there in this study?',
      tools: ['read_guide', 'clickhouse_run_select_query'],
      answer: '10 other tubular adenomas in this study have an H&E slide (11 of 27 tubular adenoma samples, including this one), plus 2 tubulovillous adenomas. Patients: HTA11_347, HTA11_546, HTA11_696, HTA11_1391, HTA11_2235, HTA11_3361, HTA11_3410, HTA11_4781, HTA11_5212, HTA11_6025.',
      link: {text: 'Tubular adenomas in this study (cBioPortal)', url: 'https://www.cbioportal.org/study/summary?id=crc_hta11_htan_2021#filterJson=%7B%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22POLYP_SUBTYPE%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Tubular%20Adenoma%22%7D%5D%7D%5D%7D'},
      hold: 5 }
  ]
};
