# TSID Government Module - Deployment Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account

## Environment Variables
Create a `.env.local` file with:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

## Development
npm install
npm run dev

## Build
npm run build

## Deployment to Vercel
vercel
vercel --prod

## Database Migrations
supabase migration up
