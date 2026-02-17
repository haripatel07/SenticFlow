# Feedback Funnel Frontend

The frontend for the Feedback Funnel application, built with Next.js 14, Tailwind CSS, and Recharts.

## Features

- **Dashboard**: Visualizes feedback sentiment and categories using interactive charts.
- **Real-time Stats**: Displays key metrics (total, processed, pending).
- **Feedback Table**: Searchable/filterable list of recent feedback with AI analysis results.
- **Responsive Design**: Fully responsive UI for desktop and mobile.

## Prerequisites

- Node.js 18+
- Backend service running on port 8080 (see backend README)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file (already created by setup script):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

## Running the Application

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Project Structure

- `app/`: Next.js App Router pages and layouts
  - `dashboard/`: Main dashboard page
  - `layout.tsx`: Root layout with font and global styles
  - `globals.css`: Tailwind imports and global styles
- `lib/`: Utility functions (API client)
- `components/`: (Optional) Reusable UI components
