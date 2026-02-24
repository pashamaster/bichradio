# bichradio

A minimal PWA radio that shuffles tracks from a bichradio playlist.

## Deploy in 5 steps

### 1. Create a GitHub repository

Go to [github.com/new](https://github.com/new) and create a **public** repository named `bichradio`.

### 2. Upload these files

You need these files in the root of the repo:
```
bichradio/
├── index.html
├── manifest.json
├── sw.js
├── icon-192.png       ← add your own icon (192×192px PNG)
├── icon-512.png       ← add your own icon (512×512px PNG)
└── .github/
    └── workflows/
        └── deploy.yml
```

Upload via GitHub's web UI (drag & drop) or use Git:
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bichradio.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

The GitHub Action will now auto-deploy on every push to `main`.

Your site will be live at:
**`https://YOUR_USERNAME.github.io/bichradio`**

### 4. Connect a custom domain (optional)

If you have a domain (e.g. `bichradio.com`):

1. Go to **Settings → Pages → Custom domain**
2. Enter your domain and click Save
3. At your domain registrar, add these DNS records:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | YOUR_USERNAME.github.io  |

4. Check **Enforce HTTPS** (required for PWA to work)

DNS changes take up to 24–48 hours to propagate.

### 5. Add icons (for PWA install)

Create two PNG icons and add them to the repo root:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

You can use [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net) to generate them.

---

## How it works

- Loads the SoundCloud playlist via the embedded widget API
- Shuffles all tracks randomly on each visit
- Plays continuously, auto-advancing to the next track
- Works as an installable PWA on iOS and Android
