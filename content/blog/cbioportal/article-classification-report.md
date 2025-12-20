---
title: How Researchers Use cBioPortal - An AI-Powered Analysis
date: 2025-12-20 12:00:00
category: cbioportal
---

We recently built an [automated pipeline](https://github.com/cBioPortal/cbioportal-article-classification) to analyze how researchers cite and use [cBioPortal](https://www.cbioportal.org) in scientific literature. The system uses Claude via AWS Bedrock to classify papers by cancer type, usage patterns, and data sources. Here are some findings from the report.

For the full report with the latest data and visualizations, see the [usage report](https://github.com/cBioPortal/cbioportal-article-classification/blob/main/output/reports/usage_report.md) in the repository.

## The Dataset

The analysis examined **13,890 unique papers** (14,834 total citations) citing cBioPortal from 2012-2026. Most classifications (94.5%) relied on abstracts since full PDFs aren't always accessible. One notable limitation: the PubMed API returns substantially fewer citations than the website shows—407 versus 750 for one publication.

## How Researchers Use the Platform

The majority of papers cite cBioPortal without explicit usage details (8,389 papers), followed by web-based analysis (4,393) and visualization (2,130). Direct API access remains rare—only 21 papers.

In terms of analysis types:
- **Gene expression analysis**: 10,628 papers
- **Survival analysis**: 7,324 papers
- **Mutation analysis**: 6,150 papers

**TP53** was the most frequently queried gene (779 papers), followed by KRAS (384) and EGFR (316).

## Cancer Types

"Other solid tumor" led the classifications (4,858 papers), with pan-cancer studies second (2,916). Breast cancer ranked third (2,374), followed by lung cancer (1,505) and colorectal cancer (1,079).

## Data Sources

TCGA dominated heavily with 8,248 papers. Multiple data sources were used in 4,878 studies. Custom/private data appeared in 3,784 papers. Specialized datasets like METABRIC, MSK-IMPACT, and ICGC saw less adoption, with GENIE used in only 87 papers.

## Geographic Distribution

USA and China led with 4,261 and 4,034 papers respectively. The United Kingdom (1,209), Germany (726), and Canada (560) rounded out the top five. Funding predominantly came from NCI NIH HHS (10,349 papers).

## Publication Venues

*Cancers* published the most cBioPortal-citing research (617 papers), followed by *Scientific Reports* (567) and *Oncotarget* (445). Most citing works were journal articles (12,113), with reviews comprising 1,174.

## Technical Notes

The classification pipeline itself is a good example of practical LLM usage. We use structured data models (Pydantic) to ensure consistent outputs and OncoTree codes for standardized tumor type classification. The system fetches papers via NCBI, extracts relevant paragraphs mentioning cBioPortal, and uses Claude to categorize them.

The code is [open source](https://github.com/cBioPortal/cbioportal-article-classification) and currently under active development. Contributions welcome!
