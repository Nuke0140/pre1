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
  			brand: {
  				'50': 'var(--brand-50)',
  				'100': 'var(--brand-100)',
  				'200': 'var(--brand-200)',
  				'300': 'var(--brand-300)',
  				'400': 'var(--brand-400)',
  				'500': 'var(--brand-500)',
  				'600': 'var(--brand-600)',
  				'700': 'var(--brand-700)',
  				'800': 'var(--brand-800)',
  				'900': 'var(--brand-900)',
  				DEFAULT: 'var(--brand-600)',
  			},
  			card: {
  				DEFAULT: 'var(--card, var(--surface))',
  				foreground: 'var(--card-foreground, var(--foreground))'
  			},
  			surface: {
  				DEFAULT: 'var(--surface)',
  				solid: 'var(--surface-solid)',
  				'2': 'var(--surface-2)',
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
  				'1': 'var(--text-1)',
  				'2': 'var(--text-2)',
  				'3': 'var(--text-3)',
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
  			'r-sm': 'var(--r-sm)',
  			'r-md': 'var(--r-md)',
  			'r-lg': 'var(--r-lg)',
  			'r-xl': 'var(--r-xl)',
  			'r-pill': 'var(--r-pill)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'1': 'var(--shadow-1)',
  			'2': 'var(--shadow-2)',
  			'3': 'var(--shadow-3)',
  			'card-rest': 'var(--shadow-card-rest)',
  			'card-hover': 'var(--shadow-card-hover)',
  			'premium-card': 'var(--shadow-premium-card, var(--shadow-card-rest))',
  			'premium-card-hover': 'var(--shadow-premium-card-hover, var(--shadow-card-hover))',
  		},
  		fontFamily: {
  			display: ['var(--font-display)', 'Poppins', 'sans-serif'],
  			heading: ['var(--font-heading)', 'Poppins', 'sans-serif'],
  			body: ['var(--font-body)', 'Nunito', 'sans-serif'],
  			sans: ['var(--font-body)', 'Nunito', 'sans-serif'],
  			mono: ['var(--font-mono)', 'monospace'],
  		},
  		fontWeight: {
  			normal: '400',
  			regular: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  		},
  		fontSize: {
  			// Canonical PreOne Typography Scale
  			'type-display': ['clamp(32px, 3.5vw + 12px, 44px)', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
  			'page-title': ['clamp(26px, 1.2vw + 22px, 34px)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
  			'section-title': ['20px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
  			'card-title': ['16px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
  			'body-copy': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
  			'body-copy-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  			'field-label': ['13px', { lineHeight: '1.4', fontWeight: '500' }],
  			'meta-copy': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
  			'data-copy': ['13.5px', { lineHeight: '1.5', fontWeight: '400' }],

  			// Canonical t-* Scale Mappings
  			't-display': ['clamp(32px, 3.5vw + 12px, 44px)', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
  			't-h1': ['clamp(26px, 1.2vw + 22px, 34px)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
  			't-h2': ['20px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
  			't-h3': ['18px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
  			't-h4': ['16px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
  			't-body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
  			't-body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
  			't-body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
  			't-caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
  			't-label': ['13px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
  			't-btn': ['14px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
  			't-kpi': ['clamp(28px, 2.5vw + 16px, 36px)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
  			't-data': ['13.5px', { lineHeight: '1.5', fontWeight: '400' }]
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
