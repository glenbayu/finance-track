# Finance Tracker 💰

Welcome to **Finance Tracker**, a modern personal finance tracking application built to help you monitor your income, expenses, budgets, and analytics effortlessly.

## 🚀 Features

- **Dashboard Analytics:** Visual charts to understand your spending patterns over time.
- **Transaction Management:** Easily add, edit, or delete income and expense records.
- **Progressive Web App (PWA):** Install this app on your mobile device for offline support and native app-like experience.
- **Authentication & Security:** Secure login and session management powered by Supabase. (Includes auto-logout on idle).
- **Responsive Design:** Beautifully stylized with Tailwind CSS, ensuring it looks amazing on both desktop and mobile devices.

## 🛠️ Technology Stack

This project is built using modern web development standards:
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

## 💻 Getting Started

Follow these steps to run the application locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or newer recommended)
- A [Supabase](https://supabase.com/) account and project.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/glenbayu/finance-track.git
   cd finance-track
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

The easiest way to deploy this Next.js app is by using [Vercel](https://vercel.com/new).

When deploying, make sure to add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the environment variables section in your deployment platform's dashboard.

---

*Built with ❤️ to keep your finances on track.*

*Salam hangat,*  
*Glend*
