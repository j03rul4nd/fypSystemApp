# fypSystemApp

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deploying on Vercel

To deploy this project on Vercel, follow these steps:

1.  **Create a new project on Vercel:** Connect your GitHub repository to Vercel.
2.  **Configure Environment Variables:** You will need to set the following environment variables in your Vercel project settings:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations).

    Make sure to add these for the correct environments (e.g., Development, Production).

3.  **Build and Deployment Settings:** Vercel should automatically detect that this is a Next.js project and configure the build settings correctly. The build command is typically `next build`.

4.  **Start Command:** The command to start the application on Vercel is typically `next start`. Vercel handles this automatically for Next.js projects.

5.  **Deploy:** Vercel will build and deploy your project automatically on every push to the connected branch.

