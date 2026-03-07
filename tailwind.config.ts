import type { Config } from "tailwindcss";

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
			spacing: {
				'section': '7rem', // 112px - standard section spacing
				'page-top': '7rem', // 112px - page top spacing
			},
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
				'poppins': ['Poppins', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				emergency: {
					DEFAULT: 'hsl(var(--emergency))',
					foreground: 'hsl(var(--emergency-foreground))',
					glow: 'hsl(var(--emergency-glow))'
				},
				guardian: {
					DEFAULT: 'hsl(var(--guardian))',
					foreground: 'hsl(var(--guardian-foreground))',
					glow: 'hsl(var(--guardian-glow))'
				},
				wellness: {
					DEFAULT: 'hsl(var(--wellness))',
					foreground: 'hsl(var(--wellness-foreground))'
				},
				'accent-red': {
					DEFAULT: 'hsl(var(--accent-red))',
					foreground: 'hsl(var(--accent-red-foreground))'
				},
				neutral: {
					DEFAULT: 'hsl(var(--neutral))',
					foreground: 'hsl(var(--neutral-foreground))'
				},
				green: {
					DEFAULT: 'hsl(var(--wellness))',
					foreground: 'hsl(var(--wellness-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
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
				map: {
					background: 'hsl(var(--map-background))',
					border: 'hsl(var(--map-border))',
					control: 'hsl(var(--map-control))',
					'control-foreground': 'hsl(var(--map-control-foreground))',
					'control-hover': 'hsl(var(--map-control-hover))',
					overlay: 'hsl(var(--map-overlay))',
					info: 'hsl(var(--map-info))'
				}
			},
			backgroundImage: {
				'gradient-emergency': 'var(--gradient-emergency)',
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-guardian': 'var(--gradient-guardian)',
				'gradient-wellness': 'var(--gradient-wellness)',
				'gradient-hero': 'var(--gradient-hero)'
			},
			boxShadow: {
				'emergency': 'var(--shadow-emergency)',
				'primary': 'var(--shadow-primary)',
				'guardian': 'var(--shadow-guardian)',
				'wellness': 'var(--shadow-wellness)',
				'glow': 'var(--shadow-glow)',
				'wellness-glow': 'var(--shadow-wellness-glow)',
				'map': 'var(--map-shadow)',
				'map-glow': 'var(--map-glow)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'emergency': 'var(--transition-emergency)',
				'map': 'var(--transition-map)'
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
				'slide-testimonials': {
					'0%': {
						transform: 'translateX(0)'
					},
					'100%': {
						transform: 'translateX(-100%)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-testimonials': 'slide-testimonials 30s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
