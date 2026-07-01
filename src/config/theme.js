/**
 * Daruhan brand palette — navy shield + metallic gold from the logo.
 * Used in JS (inline styles) and mirrored in index.css @theme tokens.
 */
export const THEME = {
  navy: {
    950: '#0a1220',
    900: '#0f1a2e',
    800: '#152238',
    700: '#1c2f4d',
    600: '#243a5c',
    500: '#2f4a73',
  },
  gold: {
    50: '#faf6eb',
    100: '#f3ead4',
    200: '#e8d5a3',
    300: '#d4bc6a',
    400: '#c9a227',
    500: '#b8922a',
    600: '#9a7b1a',
    700: '#7a6115',
  },
  cream: '#faf8f3',
  gradients: {
    primary: 'linear-gradient(135deg, #f0e0b8 0%, #d4af37 45%, #a67c00 100%)',
    primaryHover: 'linear-gradient(135deg, #f4e4bc 0%, #e0c060 45%, #b8922a 100%)',
    hero: 'linear-gradient(150deg, #0a1220 0%, #0f1a2e 22%, #152238 48%, #1c2f4d 72%, #2a4068 88%, #faf6eb 100%)',
    heroAccent: 'linear-gradient(90deg, #f4e4bc 0%, #d4af37 50%, #c9a227 100%)',
    navy: 'linear-gradient(135deg, #0f1a2e 0%, #1c2f4d 55%, #243a5c 100%)',
    textGold: 'linear-gradient(135deg, #f4e4bc 0%, #e8d5a3 40%, #d4af37 100%)',
    adminHero: 'linear-gradient(135deg, #0a1220 0%, #152238 40%, #1c2f4d 75%, #243a5c 100%)',
  },
  shadow: {
    gold: '0 4px 20px rgba(201, 162, 39, 0.35)',
    goldLg: '0 8px 32px rgba(201, 162, 39, 0.4)',
    navy: '0 4px 24px rgba(15, 26, 46, 0.25)',
  },
}
