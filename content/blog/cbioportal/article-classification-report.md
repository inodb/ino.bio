---
title: How Researchers Use cBioPortal - An AI-Powered Analysis
date: 2025-12-24 12:00:00
category: cbioportal
---

Measuring research software impact is hard. Software often gets mentioned without formal citation, or used programmatically without any mention at all. These challenges have been explored by colleagues ([Istrate et al., 2022](https://arxiv.org/abs/2209.00693); [Afiaz et al., 2024](https://pubmed.ncbi.nlm.nih.gov/39067017/)), work funded by [CZI](https://chanzuckerberg.com/) and [ITCR](https://www.cancer.gov/about-nci/organization/cssi/research/itcr) respectively. The former extracted software mentions from millions of papers; the latter surveyed tool developers on how they measure impact. Inspired by these efforts, we wanted to explore more deeply for one software tool *how* it is used based on published literature. In this experiment we look at [cBioPortal](https://www.cbioportal.org), the tool our team works on—classifying which cancer types, analysis methods, and data sources researchers work with.

As a user-facing website for accessing cancer genomics data, cBioPortal has been cited many times, providing a unique opportunity to analyze usage patterns. This goes beyond conventional tracking via Google Analytics or Heap, and aims to paint a clearer picture of how researchers actually use cBioPortal.

## Implementation

I vibe coded an [automated pipeline](https://github.com/cBioPortal/cbioportal-article-classification) using [Claude Code](https://claude.ai/code) which leverages AWS Bedrock to classify papers. The idea was to extract text from PDFs and have an LLM categorize each paper by cancer type, usage patterns, and data sources. This turned out to be more complicated than expected—I have little experience with PDF parsing and getting clean text from academic papers is surprisingly tricky. A follow-up could analyze HTML from PMC, which seemed to perform better in initial tests.

## Some Findings

The analysis examined **13,890 papers** citing cBioPortal from 2012-2026. Top analysis types were gene expression (10,549 papers), mutation analysis (7,282), and survival analysis (7,050). TP53 was the most frequently queried gene (1,062 papers). TCGA dominated as the data source (8,993 papers). USA and China led geographically.

For the full report with the latest data and visualizations, see the [usage report](https://github.com/cBioPortal/cbioportal-article-classification/blob/main/output/reports/usage_report.md).

## Reflections

This experiment made me appreciate how complicated it is to analyze software usage from publications. Many articles detail *what data* they used rather than *how they used cBioPortal*. In its current form, the approach isn't as useful for identifying UI usage patterns—though detecting cBioPortal visualizations in paper figures (e.g. OncoPrints, MutationMapper lollipop plots) could help. That said, I think we need more meta analyses like this to understand how research software is actually used. Citations alone don't tell the full story, and there's a lot of room for the field to develop better approaches.

I haven't verified many of the findings yet, but it's promising that some check out with orthogonal lines of evidence. Google Analytics also shows USA and China as top users. A survey from a few years ago indicated strong interest in gene expression analysis, and our [second most popular YouTube video](https://youtu.be/YUxVv6pkxD4?si=tcMPiA4U53lebhe5) is about gene expression.

At the end of the day, just talking to your users is probably still the best way to understand how they use your tool. But this is a nice complementary approach for getting a broader picture.

Work in progress—stay tuned!
