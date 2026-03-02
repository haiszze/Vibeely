# Vibely

A real-time chat application that connects users based on shared interests. Users select their interests, create a profile, and join real-time chat rooms to meet like-minded people.

## Features

- **Interest Selection** - Users choose their interests during onboarding
- **User Profiles** - Create profiles with name, university, and interests
- **Real-time Chat** - Live messaging powered by Supabase Realtime
- **Session Management** - Secure session handling with localStorage
- **Responsive Design** - Mobile-friendly interface

## Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: [Supabase](https://supabase.com)
- **Real-time**: Supabase Realtime
- **UI Components**: Shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/haiszze/vibely.git
cd vibely
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```
You can ask for a copy of the file to @haiszze for access
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
vibely/
├── app/                   # Page Layouts
│   ├── page.tsx          # Home page
│   ├── interest/         # Interest selection page
│   └── chat/             # Chat page
├── components/           # Reusable UI components
│   ├── supabase/         # Supabase-related components
│   └── ui/               # Shadcn/ui components
├── services/             # Services & Hooks
│   ├── session/          # Session management
│   └── hooks/            # Custom React hooks
└── public/               # Static assets
```
## Learn More

To learn more about Next.js and Supabase, check out:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Deploy on Vercel

The easiest way to deploy Vibely is on the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add environment variables
4. Deploy

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is open source and available under the MIT License.
