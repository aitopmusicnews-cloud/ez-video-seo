# EZ Video SEO — Render edition

Upload a song or music video to create three YouTube title options, an editable description, keywords, hashtags, and live YouTube autocomplete discovery signals when available. Copy or export the result as text.

## Deploy on Render

1. Create a GitHub repository named `ez-video-seo` (private is fine).
2. Extract this ZIP. Upload the **contents** of `ez-video-seo-render` into the repository root, including `render.yaml`, `package.json`, and `pnpm-lock.yaml`.
3. In Render, select the intended workspace. Choose **New → Blueprint** and connect the repository.
4. Enter your OpenAI API key when prompted for `OPENAI_API_KEY`. Keep it out of code and chat. Your API account needs billing and access to `gpt-audio` and `gpt-4.1-mini`.
5. Apply the Blueprint. It creates one free web service and generates `APP_PASSWORD`.
6. Open the service's **Environment** settings and reveal/copy `APP_PASSWORD`. This is your app login password.
7. Open the live Render URL, enter that password, and upload your music video.

If creating a Web Service manually instead, use Node runtime, the build/start commands from render.yaml, and set both environment variables yourself. APP_PASSWORD must be at least 16 characters. PORT is supplied by Render.

## Video analysis

- MP4 with H.264 video and AAC audio is the recommended format. MOV/WebM support depends on browser codecs.
- Limit: 150 MB and 8 minutes.
- Samples 10 evenly spaced frames and up to 45 seconds of audio (start/middle/end); it does not analyze every frame or the complete soundtrack.
- The browser prepares media samples; those samples and supplied release details are sent to OpenAI through the server. Artist/song search terms may also be sent to Google's YouTube autocomplete service to collect discovery phrases.
- No videos or generated results are saved by this app. Copy/export before refreshing.
- Keywords combine content analysis with live YouTube autocomplete suggestions when artist/song details are available. Autocomplete helps reveal current search phrasing; it is not an exact search-volume metric and does not guarantee rankings.
- Only one analysis runs at a time. API errors and missing settings are shown in the interface.

## Security and operation

A server-side signed session cookie protects paid analysis. Passwords and API keys are not stored in the browser. The cookie expires after seven days. Changing APP_PASSWORD invalidates sessions. The login endpoint has a basic per-IP, in-memory attempt limit; it resets on process restart and is intended for a personal single-instance app.

Free Render services can sleep when inactive, so the first page load may take longer. OpenAI API usage is billed separately. No paid Render resources are specified.

## Development

Use Node 22.16 or compatible Node 22+, then `corepack enable`, `pnpm install --frozen-lockfile`. Copy `.env.example` to `.env.local` and enter your values locally. Run `pnpm dev`.

Validation: `pnpm typecheck` and `pnpm build`. Live AI analysis must be tested after adding your key. Browser codec compatibility also needs checking with your actual video.
