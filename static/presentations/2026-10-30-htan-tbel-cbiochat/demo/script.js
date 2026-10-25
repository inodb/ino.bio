// Scripted cBioChat conversations. Every number, query and tool output below was run against the cBioPortal
// MCP (cbioportal-database, ClickHouse) on 2026-10-25; links are real cBioPortal group comparisons, and the
// page captures were taken from those links the same day. Quotes are verbatim from the papers.
const SCENES = [
{
  title: 'Polyp subtypes vs. driver mutations',
  turns: [{
    user: 'In the HTAN Vanderbilt polyp study, how often are APC, KRAS and BRAF V600E mutated in each polyp subtype?',
    blocks: [
      {type:'thoughts'},
      {type:'tool', name:'list_studies'},
      {type:'tool', name:'read_guide'},
      {type:'text', html:'<p>I’ll use <b>Pre-cancer Colorectal Polyps (HTAN Vanderbilt, Cell 2021)</b> (<code>crc_hta11_htan_2021</code>). Only 30 of its 61 samples have mutation data, so those are the denominators.</p>'},
      {type:'tool', name:'clickhouse_run_select_query',
       output:`{"rows":[{"subtype":"Tubular Adenoma","profiled":13,"APC":11,"KRAS":1,"BRAF_V600E":0},
 {"subtype":"Sessile Serrated Lesion","profiled":9,"APC":0,"KRAS":0,"BRAF_V600E":8},
 {"subtype":"Microvesicular Hyperplastic Polyp","profiled":3,"APC":2,"KRAS":0,"BRAF_V600E":2},
 {"subtype":"Goblet cell-rich Hyperplastic Polyp","profiled":3,"APC":0,"KRAS":0,"BRAF_V600E":0},
 {"subtype":"Tubulovillous Adenoma","profiled":2,"APC":2,"KRAS":2,"BRAF_V600E":0}]}`,
       params:`{"query": "WITH st AS (SELECT sample_unique_id, attribute_value AS subtype FROM clinical_data_derived
    WHERE cancer_study_identifier='crc_hta11_htan_2021' AND attribute_name='POLYP_SUBTYPE'),
  prof AS (SELECT DISTINCT sample_unique_id FROM sample_to_gene_panel_derived
    WHERE cancer_study_identifier='crc_hta11_htan_2021' AND alteration_type='MUTATION_EXTENDED'),
  mut AS (SELECT sample_unique_id, hugo_gene_symbol, mutation_variant FROM genomic_event_derived
    WHERE cancer_study_identifier='crc_hta11_htan_2021' AND variant_type='mutation'
      AND mutation_status!='UNCALLED' AND hugo_gene_symbol IN ('APC','KRAS','BRAF'))
SELECT st.subtype, uniqExact(st.sample_unique_id) AS profiled,
  uniqExactIf(mut.sample_unique_id, mut.hugo_gene_symbol='APC') AS APC,
  uniqExactIf(mut.sample_unique_id, mut.hugo_gene_symbol='KRAS') AS KRAS,
  uniqExactIf(mut.sample_unique_id, mut.hugo_gene_symbol='BRAF' AND mut.mutation_variant IN ('V600E','p.V600E')) AS BRAF_V600E
FROM st JOIN prof ON st.sample_unique_id=prof.sample_unique_id LEFT JOIN mut ON mut.sample_unique_id=st.sample_unique_id
GROUP BY st.subtype ORDER BY profiled DESC"}`},
      {type:'table', cols:['Polyp subtype','Profiled','APC','KRAS','BRAF V600E'], num:[1,2,3,4], rows:[
        ['Tubular adenoma','13','11 (85%)','1 (8%)','0'],
        ['Tubulovillous adenoma','2','2','2','0'],
        ['Sessile serrated lesion','9','0','0','8 (89%)'],
        ['Microvesicular hyperplastic polyp','3','2','0','2 (67%)'],
        ['Goblet cell-rich hyperplastic polyp','3','0','0','0']]},
      {type:'text', html:'<p>Two routes to colorectal cancer: <b>conventional adenomas are APC-driven</b>, <b>sessile serrated lesions are BRAF V600E-driven</b>.</p>'},
      {type:'tool', name:'navigate_to_group_comparison', server:'cbioportal-navigator'},
      {type:'link', text:'Sessile Serrated Lesion vs Tubular Adenoma in cBioPortal', url:'https://www.cbioportal.org/comparison/alterations?comparisonId=6ade4e32b1971a03c3aa1165'}
    ], hold: 1.6
  }],
  page: {
    img:'page-mut.jpg', url:'https://www.cbioportal.org/comparison/alterations?comparisonId=6ade4e32b1971a03c3aa1165',
    cam:[0,890,1600,610], boxes:[[24,1268,1120,96]],
    quotes:['APC mutations were detected in 85% of the TAs', 'All but one SSL (89%) had the oncogenic BRAFV600E mutation'],
    cite:'Chen et al., Cell 2021 (HTAN Vanderbilt)',
    result:'BRAF 8/9 (88.9%) in sessile serrated lesions, APC 11/13 (84.6%) in tubular adenomas'
  }
},
{
  title: 'Single-cell composition of polyps',
  turns: [{
    user: 'Do adenomas and serrated polyps differ in their single-cell cell-type composition?',
    blocks: [
      {type:'thoughts'},
      {type:'tool', name:'read_guide'},
      {type:'tool', name:'clickhouse_run_select_query',
       output:`{"rows":[{"cell_type":"ASC","polyp":"AD","n":28,"median_frac":0.304,"n_over_5pct":23},
 {"cell_type":"ASC","polyp":"SER","n":16,"median_frac":0.036,"n_over_5pct":5},
 {"cell_type":"SSC","polyp":"AD","n":28,"median_frac":0.005,"n_over_5pct":0},
 {"cell_type":"SSC","polyp":"SER","n":16,"median_frac":0.211,"n_over_5pct":12},
 {"cell_type":"T","polyp":"AD","n":28,"median_frac":0.018,"n_over_5pct":5},
 {"cell_type":"T","polyp":"SER","n":16,"median_frac":0.048,"n_over_5pct":7}, ...]}`,
       params:`{"query": "WITH pt AS (SELECT sample_unique_id, attribute_value AS polyp FROM clinical_data_derived
    WHERE cancer_study_identifier='crc_hta11_htan_2021' AND attribute_name='POLYP_TYPE')
SELECT g.entity_stable_id AS cell_type, pt.polyp, count() AS n,
  round(median(toFloat64OrNull(g.value)),3) AS median_frac,
  countIf(toFloat64OrNull(g.value)>0.05) AS n_over_5pct
FROM generic_assay_data_derived g JOIN pt ON g.sample_unique_id=pt.sample_unique_id
WHERE g.profile_stable_id='crc_hta11_htan_2021_relative_counts' AND g.entity_stable_id IN ('ASC','SSC','T')
GROUP BY cell_type, pt.polyp ORDER BY cell_type, pt.polyp"}`},
      {type:'text', html:'<p>The study has <b>scRNA-seq cell-type fractions</b> per sample. Adenomas (n=28) vs serrated polyps (n=16):</p>'},
      {type:'table', cols:['Cell type','Adenoma median','Serrated median','Samples > 5%'], num:[1,2], rows:[
        ['Adenoma-specific cells (ASC)','0.30','0.04','23/28 vs 5/16'],
        ['Serrated-specific cells (SSC)','0.005','0.21','0/28 vs 12/16'],
        ['T cells','0.018','0.048','5/28 vs 7/16']]},
      {type:'text', html:'<p><b>ASCs dominate adenomas, SSCs dominate serrated polyps.</b> I don’t compute p-values in SQL; the comparison view runs the test.</p>'},
      {type:'tool', name:'navigate_to_group_comparison', server:'cbioportal-navigator'},
      {type:'link', text:'Adenoma vs Serrated: relative cell counts in cBioPortal', url:'https://www.cbioportal.org/comparison/generic_assay_relative_counts?comparisonId=6ade4e33b1971a03c3aa1166'}
    ], hold: 1.6
  }],
  page: {
    img:'page-cell.jpg', url:'https://www.cbioportal.org/comparison/generic_assay_relative_counts?comparisonId=6ade4e33b1971a03c3aa1166',
    cam:[0,520,2400,680], boxes:[[1108,550,236,104],[24,1078,2340,88]],
    quotes:['One population was enriched in TA and TVA, hereafter referred to as ASCs', 'The second neoplastic population was enriched in SSLs and HPs'],
    cite:'Chen et al., Cell 2021 (scRNA-seq, Mann-Whitney U p < 1E-4)',
    result:'ASC higher in adenomas (q = 1.6e-5), SSC higher in serrated polyps (q = 2.5e-3)'
  }
}
];
SCENES.userName = 'Ino de Bruijn';
