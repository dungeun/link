/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 프로덕션 최적화
  ...(process.env.NODE_ENV === 'production' && {
    // CSS 최적화
    future: {
      hoverOnlyWhenSupported: true,
    },
  }),
  theme: {
    extend: {},
  },
  plugins: [],
}