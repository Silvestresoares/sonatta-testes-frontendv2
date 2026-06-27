/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sonata: {
          bg: '#121214',       
          sidebar: '#18181b',  
          blue: '#1d4ed8',     
          card: '#27272a',     
          textMuted: '#a1a1aa' 
        }
      },
    },
  },
  plugins: [],
}