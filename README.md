# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2facda13-c620-41e4-bf45-39f6ddef5bde

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2facda13-c620-41e4-bf45-39f6ddef5bde) and start prompting.

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

Simply open [Lovable](https://lovable.dev/projects/2facda13-c620-41e4-bf45-39f6ddef5bde) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## LabelGuard - Barcode Scanning Feature

LabelGuard uses Google ML Kit for accurate barcode scanning on mobile devices.

### Supported Barcode Formats:
- EAN-13 (European products)
- EAN-8 (European products)
- UPC-A (American products)
- UPC-E (American products)
- QR Codes
- Code 128, Code 39

### Setup for Mobile Development:

After cloning the project:

```bash
# Install dependencies
npm install

# Add iOS and/or Android platforms
npx cap add ios
npx cap add android

# Sync Capacitor
npx cap sync

# Run on device or emulator
npx cap run android
# or
npx cap run ios
```

### Camera Permissions:

The app requests camera access the first time you try to scan.

If you denied permissions, you can enable them in:
- **Android**: Settings > Apps > LabelGuard > Permissions > Camera
- **iOS**: Settings > LabelGuard > Camera

### Important Notes:

- Barcode scanning **only works on physical devices or emulators** (iOS/Android)
- The web version will show "Scan only available on mobile"
- Use manual input or test codes when testing in the browser
- After pulling changes, run `npx cap sync` to update native platforms
