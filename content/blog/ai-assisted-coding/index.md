---
title: Thoughts on AI-Assisted Coding
date: 2025-06-18 12:00:00
category: development
disable_social_share: true
---

Been using AI-assisted coding across a bunch of software projects, from quick prototypes to production work. Seeing a few recurring themes:

🚀 **Amazing for greenfield and prototyping**

They speed up early development dramatically. What used to take weeks can often be done in days or hours. Boilerplate, scaffolding, docs—they handle it all surprisingly well. In the cBioPortal team we leveraged Lovable to build websites, including an [installation map](https://www.cbioportal.org/installations) (by Zain Nasir) and an [About Page](https://about.cbioportal.org/) (with help from Melissa Nguyen), occasionally going back to VSCode to edit source code directly. I also used VSCode CoPilot to build some command line tools/scripts, such as a [parquet file generator](https://github.com/cBioPortal/cbiohubpy).

🏗️ **Struggle with large, mature codebases**

LLMs still have trouble with deep, repo-wide context. I can't get it to fix even a single "good first issue" in either the frontend or backend of the cBioPortal codebase! It often doesn't understand the ask, the codebase, or both. One workaround might be breaking things into smaller, focused "throwaway" components or modules, where context is tighter and code quality matters less. I can also imagine a future where LLMs are seeded with all your repo's issues and PRs to better interpret the ask—or maybe I'll finally learn to write the perfect task specification 🙃.

🧩 **Structured data models and APIs are key**

LLMs perform much better when they can understand your domain. Clean schemas, OpenAPI specs, and strong data modeling unlock everything from UI generation and code completion to natural language querying and "chat with your data" interfaces. Investing in this kind of foundation is a huge time saver for anyone building or using interfaces on top of your data. It makes the data product more robust and easier to work with, no matter who's interacting with it (machines or humans).

🎨 **Blurred lines between devs, designers, and domain experts**

Tools like Lovable let non-devs build real, functional UIs, and help devs build better-looking ones. But deep expertise is still essential across all roles: developers for system design, security and integration, designers for intuitive and accessible UX, and domain experts for making sure the output is actually meaningful—especially in complex fields like cancer genomics.

🎮 **Using LLMs can feel like cheating**

There's something undeniably addictive about using LLMs. It's like having a stack of cheat codes for work. It shifts how you think about what's even worth building/maintaining. That said, it's easy to fall into a prompt-and-fix rabbit hole where you realize later that stepping back and thinking through the problem would've been faster; the dopamine rush of rapid iteration is hard to resist 🙂.

*Link to original post on LinkedIn: https://www.linkedin.com/posts/inodb_been-using-ai-assisted-coding-across-a-bunch-activity-7335052413378138113-SNMj*