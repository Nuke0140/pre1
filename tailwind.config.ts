import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class", '[data-theme="dark"]'],
    content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--surface)',
  				foreground: 'var(--foreground)'
  			},
  			surface: {
  				DEFAULT: 'var(--surface)',
  				elevated: 'var(--surface-elevated)',
  				muted: 'var(--surface-muted)'
  			},
  			popover: {
  				DEFAULT: 'var(--surface-elevated)',
  				foreground: 'var(--foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)',
  				hover: 'var(--primary-hover)',
  				active: 'var(--primary-active)',
  				light: 'var(--primary-light)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--primary-foreground)',
  				hover: 'var(--secondary-hover)',
  				light: 'var(--secondary-light)'
  			},
  			muted: {
  				DEFAULT: 'var(--surface-muted)',
  				foreground: 'var(--text-muted)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--primary-foreground)',
  				light: 'var(--accent-light)'
  			},
  			success: {
  				DEFAULT: 'var(--success)',
  				soft: 'var(--success-soft)'
  			},
  			warning: {
  				DEFAULT: 'var(--warning)',
  				soft: 'var(--warning-soft)'
  			},
  			danger: {
  				DEFAULT: 'var(--danger)',
  				soft: 'var(--danger-soft)'
  			},
  			destructive: {
  				DEFAULT: 'var(--danger)',
  				foreground: 'var(--primary-foreground)'
  			},
  			info: {
  				DEFAULT: 'var(--info)',
  				soft: 'var(--info-soft)'
  			},
  			text: {
  				primary: 'var(--text-primary)',
  				secondary: 'var(--text-secondary)',
  				muted: 'var(--text-muted)',
  				disabled: 'var(--text-disabled)',
  				inverse: 'var(--text-inverse)'
  			},
  			border: 'var(--border)',
  			input: 'var(--input-border)',
  			ring: 'var(--border-focus)',
  			chart: {
  				'1': 'var(--primary)',
  				'2': 'var(--info)',
  				'3': 'var(--success)',
  				'4': 'var(--warning)',
  				'5': 'var(--accent)'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			't-display': ['clamp(34px, 5vw, 54px)', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
  			't-h1': ['clamp(26px, 3.4vw, 36px)', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '800' }],
  			't-h2': ['clamp(21px, 2.6vw, 28px)', { lineHeight: '1.25', letterSpacing: '-0.025em', fontWeight: '700' }],
  			't-h3': ['19px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
  			't-h4': ['15.5px', { lineHeight: '1.35', fontWeight: '700' }],
  			't-body-lg': ['16.5px', { lineHeight: '1.65', fontWeight: '400' }],
  			't-body': ['14.5px', { lineHeight: '1.65', fontWeight: '400' }],
  			't-body-sm': ['13px', { lineHeight: '1.6', fontWeight: '400' }],
  			't-caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
  			't-label': ['12.5px', { lineHeight: '1.4', letterSpacing: '0.03em', fontWeight: '700' }],
  			't-btn': ['14px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '650' }],
  			't-kpi': ['34px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
  			't-data': ['13px', { lineHeight: '1.5', fontWeight: '600' }]
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
