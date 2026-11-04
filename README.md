# alyananwar.github.io

**My portfolio site. Vibe-Coded HTML, CSS, and JavaScript, no framework, hosted on GitHub Pages.**

<p align="center">
  <img src="docs/demo.gif" alt="Scrolling through the portfolio site: hero, projects, experience, and about" width="800">
</p>

**Live:** [alyananwar.github.io](https://alyananwar.github.io)

I'm a Computer Science student at the University of the Pacific. This site has my projects, experience, certifications, and resume. Each project has its own case study page under `projects/`.

## What's in it

- **A paper panel over old paintings.** Public-domain landscapes and seascapes from the Met's Open Access collection sit behind the page and crossfade as you scroll.
- **A rotating file selector for projects.** Projects are 3D file cards on a slow-turning ring. Hover to pick one up, click to open it. Phones get a swipe row instead.
- **Project case studies** for TigerTrack, CyberPartner, the AI Virtual Patient, EasyReview, bbagent, Pipeline, a network pentest, and more.
- **"Connect with me" form** and visit tracking, backed by a small Cloudflare Worker I wrote (`net.js`, `connect.js`).

## Run it locally

There's no build step, so any static server works:

```bash
git clone https://github.com/alyananwar/alyananwar.github.io && cd alyananwar.github.io && python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

| File                   | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `index.html`           | The main page                                                  |
| `site.css`, `site.js`  | Styles for every page, the backdrop crossfade, the project ring |
| `net.js`, `connect.js` | Visit tracking and the contact form, both talk to the Worker   |
| `projects/`            | One page per project                                           |
| `images/bg/`           | Public-domain paintings from the Met used as backgrounds       |
| `images/files/`        | Project card images                                            |
| `images/gallery/`      | Photography (gallery section stays hidden until it has photos)  |
