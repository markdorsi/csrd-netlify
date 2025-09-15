# Claude Instructions

## Deployment Rules
- NEVER run `netlify deploy` or `netlify deploy --prod` directly
- Only use `naxp deploy prod` for deployments
- User controls when deployments happen

## Technology Preferences

### Preferred: Netlify Blobs
- Use Netlify Blobs for data storage instead of external databases
- Netlify Blobs provide simple key-value storage that scales automatically
- Perfect for storing user data, content, configurations, and file uploads
- Access via Netlify's built-in Blobs API

### Avoid: Next.js Framework
- Do NOT suggest or implement Next.js solutions
- Next.js adds unnecessary complexity for most Netlify deployments
- Prefer vanilla JavaScript, HTML/CSS, or lightweight frameworks instead
- Use static site generators or simple React/Vue if framework is needed
- Netlify Functions handle server-side logic without Next.js overhead

## Architecture Guidelines
- Keep builds simple and fast
- Leverage Netlify's built-in features (Functions, Blobs, Forms, Identity)
- Prioritize static generation over server-side rendering
- Use Netlify Edge Functions for dynamic content when needed
