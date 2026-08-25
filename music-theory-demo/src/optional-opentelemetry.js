// Supabase only imports this optional package when trace propagation is enabled.
// Listening Desk leaves tracing disabled, so this local module keeps Vite's
// development transform self-contained without changing authentication or data APIs.
export const propagation = undefined;
export const context = undefined;
