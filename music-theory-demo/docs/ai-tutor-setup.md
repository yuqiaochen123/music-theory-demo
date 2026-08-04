# AI mistake tutor setup

The practice page can request a short AI explanation after a signed-in learner chooses an incorrect answer. Answer grading remains local and deterministic; the tutor only explains the already-known result.

## Required secret

Set `OPENAI_API_KEY` as a Supabase Edge Function secret. Never place it in HTML, browser JavaScript, `VITE_*` variables, or any committed `.env` file.

```sh
supabase secrets set OPENAI_API_KEY=your_api_key
```

The function defaults to `gpt-5.6-terra`. To test a different compatible model without changing source code, set:

```sh
supabase secrets set OPENAI_TUTOR_MODEL=gpt-5.6-luna
```

## Deploy

Confirm the CLI version and available flags before deployment:

```sh
supabase --version
supabase functions deploy --help
```

Deploy the function with JWT verification enabled:

```sh
supabase functions deploy ai-tutor
```

`supabase/config.toml` keeps `verify_jwt = true`. The browser uses the learner's existing Supabase session when it invokes the function, and the function verifies the user again before calling OpenAI.

## Safe rollout

The site does not require the Edge Function to load or complete practice. If the learner is signed out, the function is undeployed, the secret is missing, OpenAI times out, or the returned payload is invalid, the current deterministic “Not quite” feedback remains and practice continues normally.

Run the focused checks before deployment:

```sh
node --test src/ai-tutor.test.js src/ai-tutor-ui.test.js supabase/functions/ai-tutor/tutor-core.test.js
npm test
npm run build
npm run test:sites
```
