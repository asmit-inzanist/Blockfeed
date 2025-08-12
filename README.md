# BlockFeed

A cyberpunk-inspired news aggregation platform that combines AI-powered content curation with a retro-futuristic aesthetic. BlockFeed delivers personalized news feeds based on your interests, featuring real-time updates and intelligent topic categorization.

## Features

- **AI-Powered News Curation**: Intelligent selection and categorization of news articles
- **Personalized Feed**: Customizable interest selection for tailored content delivery
- **Daily Briefings**: Automated email digests of your most relevant news
- **Topic Suggestions**: User-driven content expansion through topic suggestions
- **Retro-Futuristic UI**: Cyberpunk-inspired design with modern functionality
- **Real-Time Updates**: Fresh content through automated RSS feed processing

## Tech Stack

This project is built with modern web technologies:

- **Frontend**
  - React with TypeScript
  - Vite for build tooling
  - shadcn/ui components
  - Tailwind CSS for styling
  
- **Backend**
  - Supabase for database and authentication
  - Edge Functions for serverless computing
  - RSS feed processing
  - Email notification system

## Getting Started

1. **Clone the repository**
```sh
git clone https://github.com/asmit-inzanist/Blockfeed.git
cd Blockfeed
```

2. **Install dependencies**
```sh
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server**
```sh
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
Blockfeed/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # Third-party service integrations
│   ├── lib/          # Utility functions
│   └── pages/        # Page components
├── supabase/
│   ├── functions/    # Edge Functions
│   └── migrations/   # Database migrations
└── public/          # Static assets
```

## Development

- Run tests: `npm test`
- Build for production: `npm run build`
- Format code: `npm run format`
- Lint code: `npm run lint`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright © 2025 BlockFeed. All rights reserved.
