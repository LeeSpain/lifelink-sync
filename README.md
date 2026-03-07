# Welcome to your Lovable project

<!-- GitHub sync test - last updated: 2025-01-29T02:32:00Z -->

## Project info

**URL**: https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Deploy via Lovable (Recommended)
Simply open [Lovable](https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754) and click on Share -> Publish.

### Option 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect this as a Vite project
3. The build settings are configured in `vercel.json`
4. Environment variables are pre-configured in `vercel.json` for basic functionality
5. **Optional**: Override environment variables in Vercel dashboard if you need different production values:
   - `VITE_SUPABASE_URL`: Your production Supabase URL (defaults to development URL)
   - `VITE_SUPABASE_ANON_KEY`: Your production Supabase anon key (defaults to development key)
   - Any other production-specific variables

**Note**: The project includes fallback values in `vercel.json`, so deployments will work out of the box with the development Supabase instance.

### Option 3: Manual Deployment
```sh
# Build the project
npm run build

# The dist/ folder contains the built application
# Deploy the contents of dist/ to your hosting provider
```

### GitHub Integration
- The `.github/workflows/deploy.yml` file sets up automatic deployment to Vercel
- Configure the required secrets in your GitHub repository settings:
  - `VERCEL_TOKEN`: Get from [Vercel Account Settings](https://vercel.com/account/tokens)
  - `VERCEL_ORG_ID`: Found in your Vercel team settings
  - `VERCEL_PROJECT_ID`: Found in your project settings on Vercel

To set up GitHub secrets:
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each required secret
3. Once configured, pushes to main/master will automatically deploy to Vercel

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
