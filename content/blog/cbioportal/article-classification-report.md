---
title: How Researchers Use cBioPortal - An AI-Powered Analysis
date: 2025-12-20 12:00:00
category: cbioportal
---

Measuring research software impact is hard. Software often gets mentioned without formal citation, or used programmatically without any mention at all—challenges explored by [Afiaz et al.](https://pubmed.ncbi.nlm.nih.gov/39067017/). The [CZI Software Mentions dataset](https://arxiv.org/abs/2209.00693) links text mentions in papers to software entities. We expand on this by classifying *how* cBioPortal is used—which cancer types, analysis methods, and data sources researchers work with.

As a user-facing website for accessing cancer genomics data, cBioPortal has been cited many times, providing a unique opportunity to analyze usage patterns. This goes beyond conventional tracking via Google Analytics or Heap, and aims to paint a clearer picture of how these tools help push science forward.

We built an [automated pipeline](https://github.com/cBioPortal/cbioportal-article-classification) using Claude via AWS Bedrock to classify papers by cancer type, usage patterns, and data sources. Here are some findings.

For the full report with the latest data and visualizations, see the [usage report](https://github.com/cBioPortal/cbioportal-article-classification/blob/main/output/reports/usage_report.md) in the repository.

## The Dataset

The analysis examined **13,890 unique papers** (14,834 total citations) citing cBioPortal from 2012-2026. Most classifications (94.5%) relied on abstracts since full PDFs aren't always accessible. One notable limitation: the PubMed API returns substantially fewer citations than the website shows—407 versus 750 for one publication.

## How Researchers Use the Platform

The majority of papers cite cBioPortal without explicit usage details (6,089 papers), followed by web-based analysis (5,930) and visualization (3,751). Direct API access was mentioned in only 82 papers—though our internal usage stats show API usage is actually quite high.

In terms of analysis types:
- **Gene expression analysis**: 10,549 papers
- **Mutation analysis**: 7,282 papers
- **Survival analysis**: 7,050 papers

**TP53** was the most frequently queried gene (1,062 papers), followed by KRAS (545) and EGFR (444).

## Cancer Types

"Other solid tumor" led the classifications (2,583 papers), with pan-cancer studies second (1,442). Breast cancer ranked third (1,151), followed by lung cancer (779) and colorectal cancer (541).

## Data Sources

TCGA dominated heavily with 8,993 papers. Multiple data sources were used in 5,157 studies. Custom/private data appeared in 2,990 papers.

## Geographic Distribution

USA and China led with 2,229 and 1,754 papers respectively. The United Kingdom (591), Germany (344), and Canada (282) rounded out the top five. Funding predominantly came from NCI NIH HHS (6,079 papers).

## Publication Venues

*Oncotarget* published the most cBioPortal-citing research (363 papers), followed by *Scientific Reports* (287) and *Cancers* (207). Most citing works were journal articles (5,881), with reviews comprising 585.

## Technical Notes

The classification pipeline itself is a good example of practical LLM usage. We use structured data models (Pydantic) to ensure consistent outputs and OncoTree codes for standardized tumor type classification. The system fetches papers via NCBI, extracts relevant paragraphs mentioning cBioPortal, and uses Claude to categorize them.

The code is [open source](https://github.com/cBioPortal/cbioportal-article-classification) and currently under active development. Contributions welcome!
