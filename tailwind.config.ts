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
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
