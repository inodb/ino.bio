// Scripted cBioChat conversations for standard cBioPortal use cases. Numbers come from cBioPortal MCP queries
// (cbioportal-database) on 2026-10-25 and match the linked cBioPortal pages, captured the same day.
const SCENES = [
{
  title: 'KRAS in TCGA pancreatic cancer',
  turns: [{
    user: 'How often is KRAS mutated in TCGA pancreatic adenocarcinoma, and which variants?',
    blocks: [
      {type:'thoughts'},
      {type:'tool', name:'read_guide'},
      {type:'tool', name:'clickhouse_run_select_query',
       output:`{"rows":[{"kras_mut":117,"G12D":49,"G12V":33,"G12R":25,"Q61H":6,"G12C":1}]}`,
       params:`{"query": "SELECT uniqExact(sample_unique_id) AS kras_mut, uniqExactIf(sample_unique_id, mutation_variant='G12D') AS G12D, ...
FROM genomic_event_derived WHERE cancer_study_identifier='paad_tcga_pan_can_atlas_2018'
  AND hugo_gene_symbol='KRAS' AND variant_type='mutation' AND mutation_status!='UNCALLED'"}`},
      {type:'text', html:'<p>In <b>Pancreatic Adenocarcinoma (TCGA, PanCancer Atlas)</b>, KRAS is mutated in <b>117 samples, about two-thirds</b> of the cohort, almost all at codon 12:</p>'},
      {type:'table', cols:['Variant','Samples'], num:[1], rows:[['G12D','49'],['G12V','33'],['G12R','25'],['Q61H','6'],['G12C','1']]},
      {type:'tool', name:'navigate_to_results_view', server:'cbioportal-navigator'},
      {type:'link', text:'KRAS mutations in TCGA pancreatic adenocarcinoma', url:'https://www.cbioportal.org/results/mutations?cancer_study_list=paad_tcga_pan_can_atlas_2018&gene_list=KRAS&case_set_id=paad_tcga_pan_can_atlas_2018_all'}
    ], hold: 0.6
  }],
  page: {
    img:'page-kras.jpg', url:'https://www.cbioportal.org/results/mutations?cancer_study_list=paad_tcga_pan_can_atlas_2018&gene_list=KRAS', dur:9,
    cam:[960,70,1440,560], boxes:[[1690,112,620,46],[1780,476,392,44]],
    title:'TCGA querying', result:'KRAS altered in 117 (64%) of queried samples, mostly G12D/V/R'
  }
},
{
  title: 'EGFR-mutant NSCLC treatments',
  turns: [{
    user: 'In MSK-CHORD, what treatments did patients with EGFR-mutant non-small cell lung cancer receive most often?',
    blocks: [
      {type:'thoughts'},
      {type:'tool', name:'read_guide'},
      {type:'tool', name:'clickhouse_run_select_query',
       output:`{"rows":[{"pts":1890,"agent":"OSIMERTINIB","patients":1035},{"pts":1890,"agent":"PEMETREXED","patients":820},
 {"pts":1890,"agent":"CARBOPLATIN","patients":691},{"pts":1890,"agent":"ERLOTINIB","patients":461},{"pts":1890,"agent":"BEVACIZUMAB","patients":351}]}`,
       params:`{"query": "... clinical_event_data_derived WHERE cancer_study_identifier='msk_chord_2024' AND lower(event_type)='treatment'
  AND key='AGENT' AND value!='INVESTIGATIONAL' AND patient_unique_id IN (EGFR-mutant NSCLC) GROUP BY agent ..."}`},
      {type:'text', html:'<p><b>1,890 patients</b> with EGFR-mutant NSCLC in <b>MSK-CHORD (MSK, Nature 2024)</b>. Most common agents, excluding investigational:</p>'},
      {type:'table', cols:['Agent','Patients'], num:[1], rows:[['Osimertinib','1,035'],['Pemetrexed','820'],['Carboplatin','691'],['Erlotinib','461'],['Bevacizumab','351']]},
      {type:'tool', name:'navigate_to_study_view', server:'cbioportal-navigator'},
      {type:'link', text:'EGFR-mutant NSCLC in MSK-CHORD', url:'https://www.cbioportal.org/study/summary?id=msk_chord_2024#filterJson=%7B%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22CANCER_TYPE%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Non-Small%20Cell%20Lung%20Cancer%22%7D%5D%7D%5D%2C%22geneFilters%22%3A%5B%7B%22geneQueries%22%3A%5B%5B%7B%22hugoGeneSymbol%22%3A%22EGFR%22%7D%5D%5D%2C%22molecularProfileIds%22%3A%5B%22msk_chord_2024_mutations%22%5D%7D%5D%7D'}
    ], hold: 0.6
  }],
  page: {
    img:'page-chord.jpg', size:[2400,2791], url:'https://www.cbioportal.org/study/summary?id=msk_chord_2024#filterJson=…', dur:10,
    cam:[300,2140,1800,640], boxes:[[640,2296,590,300]],
    title:'Treatment data from MSK-CHORD', result:'1,890 patients selected; Treatment per Patient: osimertinib 1,035, pemetrexed 820'
  }
}
];
SCENES.userName = 'Ino de Bruijn';
