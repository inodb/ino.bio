// Timeline and content for the Claude + cBioPortal MCP illustration. The answer's numbers come from real
// cbioportal-database MCP queries run on 2026-10-25 (sample-level, KRAS-profiled samples as denominators):
//   SELECT * FROM gene_mutation_variants_in_study(study = 'luad_tcga_pan_can_atlas_2018', gene = 'KRAS')
//   SELECT * FROM gene_mutation_frequency_in_study(study = 'luad_tcga_pan_can_atlas_2018', gene = 'KRAS')
//   msk_chord_2024, CANCER_TYPE_DETAILED = 'Lung Adenocarcinoma', mutation_panel_gene_coverage for KRAS
const CONNECTORS = [
  {name:'cBioPortal', url:'https://mcp.cbioportal.org/db/mcp'},
  {name:'cBioPortal Navigator', url:'https://mcp.cbioportal.org/navigator/mcp'}
];
const QUESTION = 'Using cBioPortal, compare KRAS G12C frequency in lung adenocarcinoma between TCGA and MSK-CHORD, and give me a small table I can paste into my notes.';
const TIMELINE = {
  menuOpen:1.5, settingsOpen:2.6, connTab:3.6,
  c1:{open:4.6, name0:5.2, name1:6.0, url0:6.4, url1:8.0, add:8.9},
  c2:{open:10.0, name0:10.5, name1:11.3, url0:11.6, url1:13.0, add:13.8},
  newChat:15.4, toolsOpen:16.4, toolsClose:17.8, type0:18.0, type1:21.0, send:21.6, hideCursor:22.2,
  end:41.5
};
const ANSWER = [
  {t:22.3, type:'tool', name:'list_studies', d:0.8},
  {t:23.3, type:'tool', name:'read_guide', d:0.7},
  {t:24.2, type:'tool', name:'clickhouse_run_select_query', d:1.0},
  {t:25.4, type:'tool', name:'clickhouse_run_select_query', d:1.0},
  {t:26.7, type:'text', html:'<p>KRAS G12C in lung adenocarcinoma, counted per sample, with each study’s KRAS-profiled samples as the denominator:</p>'},
  {t:27.6, type:'text', html:`<table>
<tr><th></th><th class="n">TCGA LUAD (PanCancer Atlas)</th><th class="n">MSK-CHORD (2024)</th></tr>
<tr><td>Profiled samples</td><td class="n">566</td><td class="n">5,957</td></tr>
<tr><td><b>KRAS G12C</b></td><td class="n"><b>70 (12.4%)</b></td><td class="n"><b>793 (13.3%)</b></td></tr>
<tr><td>KRAS G12V</td><td class="n">40 (7.1%)</td><td class="n">351 (5.9%)</td></tr>
<tr><td>KRAS G12D</td><td class="n">20 (3.5%)</td><td class="n">274 (4.6%)</td></tr>
<tr><td>Any KRAS mutation</td><td class="n">168 (29.7%)</td><td class="n">1,924 (32.3%)</td></tr>
</table>`},
  {t:29.4, type:'text', html:'<p>G12C is similar in both cohorts (12–13%). TCGA is whole-exome sequencing of resected primary tumors; MSK-CHORD is MSK-IMPACT panel sequencing and also includes metastatic samples.</p>'},
  {t:30.9, type:'text', html:'<p>Open in cBioPortal: <a href="https://www.cbioportal.org/results/mutations?cancer_study_list=luad_tcga_pan_can_atlas_2018&gene_list=KRAS">TCGA LUAD, KRAS mutations</a> · <a href="https://www.cbioportal.org/study/summary?id=msk_chord_2024">MSK-CHORD study</a></p>'}
];
const CURSOR = [
  {t:0, xy:[900,520]},
  {t:1.5, at:'me', click:true}, {t:2.6, at:'menuSettings', click:true}, {t:3.6, at:'navConn', click:true},
  {t:4.6, at:'addBtn', click:true}, {t:5.2, at:'inName', click:true}, {t:6.4, at:'inUrl', click:true}, {t:8.9, at:'addOk', click:true},
  {t:10.0, at:'addBtn', click:true}, {t:10.5, at:'inName', click:true}, {t:11.6, at:'inUrl', click:true}, {t:13.8, at:'addOk', click:true},
  {t:15.4, at:'newchat', click:true}, {t:16.4, at:'toolsBtn', click:true}, {t:17.8, at:'compTxt', click:true},
  {t:21.5, at:'send', click:true}, {t:22.2, xy:[1300,790]}
];
