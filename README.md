# Crypto Comparison Tool

A real-time cryptocurrency comparison tool that allows users to analyze and compare multiple cryptocurrencies across various metrics including market data, social metrics, and supply information. Features include dynamic charts, customizable comparisons, and data export capabilities.

## Features

- Multi-token comparison with no selection limit
- Real-time market data from CoinMarketCap
- Twitter follower tracking
- Interactive charts for visual comparison
- Downloadable comparison tables and charts
- Responsive design
- UTC time synchronization
- Automatic data formatting for readability

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Data Sources**:
  - CoinMarketCap API
  - Twitter API/Web Scraping
- **Image Generation**: html2canvas
- **Icons**: Font Awesome

## Prerequisites

- Node.js 16+
- npm or yarn
- CoinMarketCap API Key
- Twitter Bearer Token (optional)

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:
