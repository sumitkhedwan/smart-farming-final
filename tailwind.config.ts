
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom colors for our agriculture app
				nature: {
					50: '#F2FCE2', 
					100: '#E3F8C7',
					200: '#D0F4A8',
					300: '#B3E87B',
					400: '#9EDC5E',
					500: '#7AC23F',
					600: '#5A9E2A',
					700: '#487F21',
					800: '#3A6619',
					900: '#2E5014',
					950: '#1E3A0A'
				},
				soil: {
					50: '#F9F1E8',
					100: '#F2E3D0',
					200: '#E6C6A2',
					300: '#D9A874',
					400: '#CC8B46',
					500: '#B06E2D',
					600: '#8D5823',
					700: '#6A421B',
					800: '#472C12',
					900: '#231609',
					950: '#120B04'
				},
				sky: {
					50: '#E9F6FD',
					100: '#D3EEFB',
					200: '#A8DCF7',
					300: '#7DCBF3',
					400: '#52B9EF',
					500: '#269BDB',
					600: '#1E7FB3',
					700: '#16638C',
					800: '#0F4764',
					900: '#072A3C',
					950: '#04172A'
				},
				alert: {
					50: '#FFF0EF',
					100: '#FFDFDF',
					200: '#FFB0AD',
					300: '#FF817D',
					400: '#FF524C',
					500: '#FF231A',
					600: '#E40E01',
					700: '#AF0B00',
					800: '#7B0800',
					900: '#460400',
					950: '#290200'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)', opacity: '1' },
					'100%': { transform: 'translateX(100%)', opacity: '0' }
				},
				'slide-in-bottom': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-out': 'fade-out 0.5s ease-out',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'slide-out-right': 'slide-out-right 0.5s ease-out',
				'slide-in-bottom': 'slide-in-bottom 0.4s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
			},
			boxShadow: {
				'subtle': '0 4px 20px rgba(0, 0, 0, 0.05)',
				'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)',
				'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)',
				'elevation-3': '0 10px 15px rgba(0, 0, 0, 0.03), 0 3px 6px rgba(0, 0, 0, 0.05)',
				'elevation-4': '0 20px 25px rgba(0, 0, 0, 0.03), 0 8px 10px rgba(0, 0, 0, 0.04)',
			},
			fontSize: {
				'xs': ['0.75rem', {lineHeight: '1rem'}],
				'sm': ['0.875rem', {lineHeight: '1.25rem'}],
				'base': ['1rem', {lineHeight: '1.5rem'}],
				'lg': ['1.125rem', {lineHeight: '1.75rem'}],
				'xl': ['1.25rem', {lineHeight: '1.75rem'}],
				'2xl': ['1.5rem', {lineHeight: '2rem'}],
				'3xl': ['1.875rem', {lineHeight: '2.25rem'}],
				'4xl': ['2.25rem', {lineHeight: '2.5rem'}],
				'5xl': ['3rem', {lineHeight: '1'}],
				'6xl': ['3.75rem', {lineHeight: '1'}],
			},
			backdropBlur: {
				xs: '2px',
				sm: '4px',
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
