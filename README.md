# bichradio — Telegram Mini App setup

## What's different from the web version
- Telegram WebApp SDK integrated (`telegram-web-app.js`)
- Haptic feedback on all buttons (iOS & Android)
- `tg.expand()` — opens full screen automatically
- `tg.disableVerticalSwipes()` — prevents accidental close
- Header/background color set to match dark theme
- Mixcloud opens via `tg.openLink()` (Telegram's in-app browser)
- No PWA banner, no service worker, no version check (not needed inside Telegram)
- Artwork URLs use absolute `https://bichradio.com/` paths for lock screen

## Hosting the Mini App

The Mini App is just a hosted webpage. You need it on HTTPS.

**Option A — same GitHub Pages repo**
1. Create a `/telegram/` folder in your `bichradio` repo
2. Put `index.html` there
3. It will be live at `https://USERNAME.github.io/bichradio/telegram/`

**Option B — subdomain (cleaner)**
1. Host at `https://tma.bichradio.com/`
2. Point CNAME to your GitHub Pages

## Setting up the Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Create a new bot: `/newbot`
3. Give it a name (e.g. `bichradio`) and username (e.g. `bichradiobot`)
4. Configure the Mini App:
   ```
   /newapp
   ```
   Then select your bot, and set:
   - **Title**: bichradio
   - **Description**: ambient radio · shuffle · two channels
   - **URL**: https://USERNAME.github.io/bichradio/telegram/
   - **Photo**: upload your icon (512×512 recommended)

5. To add a button that opens the Mini App:
   ```
   /mybots → your bot → Bot Settings → Menu Button
   ```
   Set button text to `🎵 open radio` and the URL to your Mini App URL.

## Adding GIST credentials

Same as the web version — replace in `index.html`:
```js
const GIST_ID  = 'YOUR_GIST_ID';
const GH_TOKEN = 'YOUR_GITHUB_TOKEN';
```

The counter is shared between the web and Telegram versions
(same Gist, same count).

## Testing

Open your bot in Telegram → tap the menu button.
On desktop Telegram you can also test at:
https://t.me/YOUR_BOT_USERNAME/YOUR_APP_SHORTNAME
