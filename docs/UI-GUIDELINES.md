# UI Guidelines – Handwerker-CRM Design System

## 1. Design-Philosophie

### Kernprinzipien
1. **Radikal Einfach**: Jeder Screen hat maximal 1 primäre Aktion
2. **Mobile-First**: Designed für den Einsatz auf der Baustelle
3. **Große Touch-Targets**: Mindestens 48x48px für alle klickbaren Elemente
4. **Sofortiges Feedback**: Jede Interaktion wird visuell bestätigt
5. **Professionell aber Freundlich**: Seriös genug für Geschäftsunterlagen, warm genug für tägliche Nutzung

### Ästhetische Richtung
**"Handwerker-Modern"** – Eine Balance zwischen der Solidität traditioneller Handwerksbetriebe und moderner, cleaner Software-Ästhetik. Inspiriert von skandinavischem Design: funktional, unaufdringlich, mit gezielten Farbakzenten.

---

## 2. Farbsystem

### 2.1 Primärpalette

```css
:root {
  /* Primär: Vertrauenswürdiges Dunkelblau */
  --primary-50: #e6eef6;
  --primary-100: #ccdded;
  --primary-200: #99bbdb;
  --primary-300: #6699c9;
  --primary-400: #3377b7;
  --primary-500: #1b4d89;  /* Hauptfarbe */
  --primary-600: #163e6e;
  --primary-700: #102e52;
  --primary-800: #0b1f37;
  --primary-900: #050f1b;

  /* Akzent: Energetisches Gelb */
  --accent-50: #fefcf0;
  --accent-100: #fdf9e1;
  --accent-200: #fbf3c3;
  --accent-300: #faea97;
  --accent-400: #f9e45b;  /* Hauptfarbe */
  --accent-500: #e6ce41;
  --accent-600: #c4a920;
  --accent-700: #917b16;
  --accent-800: #5e4e0e;
  --accent-900: #2b2406;

  /* Erfolg: Natürliches Grün */
  --success-50: #edf7f0;
  --success-100: #dbefe1;
  --success-200: #b7dfc3;
  --success-300: #93cfa5;
  --success-400: #6db784;  /* Hauptfarbe */
  --success-500: #5a9e70;
  --success-600: #478259;
  --success-700: #356243;
  --success-800: #23422c;
  --success-900: #112116;

  /* Hintergrund: Sanftes Mint */
  --bg-mint: #e8f5f2;
  --bg-mint-light: #f3faf8;
  --bg-mint-dark: #d1ebe5;
}
```

### 2.2 Semantische Farben

```css
:root {
  /* Status */
  --color-error: #dc2626;
  --color-error-light: #fef2f2;
  --color-warning: #f59e0b;
  --color-warning-light: #fffbeb;
  --color-info: #3b82f6;
  --color-info-light: #eff6ff;
  --color-success: #6db784;
  --color-success-light: #edf7f0;

  /* Graustufen */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### 2.3 Farbverwendung

| Kontext | Farbe | Verwendung |
|---------|-------|------------|
| Primäre Aktionen | `--primary-500` | Buttons, Links, Navigation |
| Call-to-Action | `--accent-400` | Hervorgehobene Buttons, Badges |
| Erfolg/Positiv | `--success-400` | "Bezahlt", Bestätigungen |
| Hintergrund | `--bg-mint` | Page Background |
| Cards | `#ffffff` | Content-Container |
| Text | `--gray-800` | Haupttext |
| Subtext | `--gray-500` | Beschreibungen, Timestamps |

---

## 3. Typografie

### 3.1 Font Stack

```css
:root {
  /* Headings: Markant, professionell */
  --font-heading: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Body: Lesbar, freundlich */
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Monospace: Für Nummern, Codes */
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
```

### 3.2 Type Scale

```css
/* Tailwind Config */
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px - Standard für Inputs
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
}
```

### 3.3 Typografie-Anwendung

```tsx
// Headings
<h1 className="font-heading text-3xl font-bold text-gray-900">Dashboard</h1>
<h2 className="font-heading text-2xl font-semibold text-gray-800">Kunden</h2>
<h3 className="font-heading text-xl font-semibold text-gray-800">Offene Aufträge</h3>

// Body
<p className="font-body text-base text-gray-700">Beschreibungstext</p>
<span className="font-body text-sm text-gray-500">Subtext oder Label</span>

// Monospace für Nummern
<span className="font-mono text-sm">RE-2025-0001</span>
<span className="font-mono text-lg font-medium">€ 1.234,56</span>
```

---

## 4. Spacing System

### 4.1 Base Unit
Alle Abstände basieren auf einem **4px Grid**.

```css
spacing: {
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
}
```

### 4.2 Spacing Guidelines

| Kontext | Spacing |
|---------|---------|
| Innerhalb von Buttons | `px-6 py-3` (24px / 12px) |
| Innerhalb von Cards | `p-6` (24px) |
| Zwischen Formfeldern | `space-y-4` (16px) |
| Zwischen Sections | `space-y-8` (32px) |
| Page Padding (Mobile) | `p-4` (16px) |
| Page Padding (Desktop) | `p-8` (32px) |

---

## 5. Komponenten

### 5.1 Buttons

```tsx
// Primary Button (Hauptaktionen)
<button className="
  bg-primary-500 hover:bg-primary-600 active:bg-primary-700
  text-white font-medium
  px-6 py-3
  rounded-xl
  shadow-md hover:shadow-lg
  transition-all duration-200
  min-h-[48px]
">
  Speichern
</button>

// Secondary Button
<button className="
  bg-white hover:bg-gray-50
  text-primary-500 font-medium
  border-2 border-primary-500
  px-6 py-3
  rounded-xl
  transition-all duration-200
  min-h-[48px]
">
  Abbrechen
</button>

// Accent Button (CTA)
<button className="
  bg-accent-400 hover:bg-accent-500 active:bg-accent-600
  text-gray-900 font-semibold
  px-6 py-3
  rounded-xl
  shadow-md hover:shadow-lg
  transition-all duration-200
  min-h-[48px]
">
  Neuer Kunde
</button>

// Destructive Button
<button className="
  bg-red-600 hover:bg-red-700
  text-white font-medium
  px-6 py-3
  rounded-xl
  transition-all duration-200
  min-h-[48px]
">
  Löschen
</button>

// Icon Button
<button className="
  p-3
  bg-gray-100 hover:bg-gray-200
  rounded-xl
  transition-colors
  min-w-[48px] min-h-[48px]
  flex items-center justify-center
">
  <PlusIcon className="w-6 h-6 text-gray-700" />
</button>
```

### 5.2 Input Fields

```tsx
// Text Input
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Firmenname
  </label>
  <input
    type="text"
    className="
      w-full
      px-4 py-3
      text-lg
      border border-gray-300
      rounded-xl
      bg-white
      focus:ring-2 focus:ring-primary-500 focus:border-transparent
      placeholder:text-gray-400
      transition-shadow
    "
    placeholder="z.B. Müller Elektrotechnik"
  />
  <p className="text-sm text-gray-500">Optional</p>
</div>

// Error State
<input
  className="
    ...
    border-red-500
    focus:ring-red-500
  "
/>
<p className="text-sm text-red-600">Bitte gib einen gültigen Namen ein</p>

// Select
<select className="
  w-full
  px-4 py-3
  text-lg
  border border-gray-300
  rounded-xl
  bg-white
  focus:ring-2 focus:ring-primary-500
  cursor-pointer
">
  <option>Bitte wählen...</option>
</select>

// Textarea
<textarea className="
  w-full
  px-4 py-3
  text-lg
  border border-gray-300
  rounded-xl
  bg-white
  focus:ring-2 focus:ring-primary-500
  min-h-[120px]
  resize-y
" />
```

### 5.3 Cards

```tsx
// Standard Card
<div className="
  bg-white
  rounded-2xl
  shadow-sm hover:shadow-md
  border border-gray-100
  p-6
  transition-shadow
">
  {/* Content */}
</div>

// Clickable Card
<button className="
  w-full text-left
  bg-white
  rounded-2xl
  shadow-sm hover:shadow-md
  border border-gray-100 hover:border-primary-300
  p-6
  transition-all
">
  {/* Content */}
</button>

// Highlight Card (z.B. für wichtige Infos)
<div className="
  bg-accent-50
  border-2 border-accent-400
  rounded-2xl
  p-6
">
  {/* Content */}
</div>

// Status Card
<div className="
  bg-success-50
  border-l-4 border-success-400
  rounded-r-xl
  p-4
">
  <span className="text-success-700 font-medium">Bezahlt</span>
</div>
```

### 5.4 Navigation

```tsx
// Mobile Bottom Nav
<nav className="
  fixed bottom-0 left-0 right-0
  bg-white
  border-t border-gray-200
  px-4 pb-safe
">
  <div className="flex justify-around py-2">
    <NavItem icon={HomeIcon} label="Start" active />
    <NavItem icon={UsersIcon} label="Kunden" />
    <NavItem icon={FileTextIcon} label="Aufträge" />
    <NavItem icon={CalendarIcon} label="Kalender" />
  </div>
</nav>

// Nav Item
const NavItem = ({ icon: Icon, label, active }) => (
  <a className={`
    flex flex-col items-center gap-1
    min-w-[64px] py-2
    ${active 
      ? 'text-primary-500' 
      : 'text-gray-500 hover:text-gray-700'
    }
  `}>
    <Icon className="w-6 h-6" />
    <span className="text-xs font-medium">{label}</span>
  </a>
)
```

### 5.5 Badges & Tags

```tsx
// Status Badge
<span className="
  inline-flex items-center
  px-3 py-1
  text-sm font-medium
  rounded-full
  bg-success-100 text-success-700
">
  Bezahlt
</span>

// Neutral Badge
<span className="
  inline-flex items-center
  px-3 py-1
  text-sm font-medium
  rounded-full
  bg-gray-100 text-gray-700
">
  Entwurf
</span>

// Warning Badge
<span className="
  inline-flex items-center
  px-3 py-1
  text-sm font-medium
  rounded-full
  bg-red-100 text-red-700
">
  Überfällig
</span>
```

---

## 6. Layout Patterns

### 6.1 Page Structure

```tsx
// Mobile Page
<div className="min-h-screen bg-[#e8f5f2] pb-20">
  {/* Header */}
  <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
    <h1 className="text-xl font-bold text-gray-900">Kunden</h1>
  </header>
  
  {/* Content */}
  <main className="p-4 space-y-4">
    {/* Cards, Lists, etc. */}
  </main>
  
  {/* Floating Action Button */}
  <button className="
    fixed bottom-24 right-4
    w-14 h-14
    bg-accent-400 hover:bg-accent-500
    rounded-full
    shadow-lg
    flex items-center justify-center
  ">
    <PlusIcon className="w-6 h-6 text-gray-900" />
  </button>
  
  {/* Bottom Nav */}
  <BottomNav />
</div>
```

### 6.2 List Pattern

```tsx
<ul className="divide-y divide-gray-100">
  {customers.map((customer) => (
    <li key={customer.id}>
      <a className="
        flex items-center gap-4
        px-4 py-4
        hover:bg-gray-50
        active:bg-gray-100
        transition-colors
      ">
        {/* Avatar */}
        <div className="
          w-12 h-12 
          bg-primary-100 
          rounded-full 
          flex items-center justify-center
        ">
          <span className="text-primary-600 font-semibold">
            {customer.initials}
          </span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {customer.name}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {customer.city}
          </p>
        </div>
        
        {/* Chevron */}
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
      </a>
    </li>
  ))}
</ul>
```

---

## 7. Animation & Transitions

### 7.1 Standard Transitions

```css
/* Buttons, Links */
transition-colors: color 150ms ease;
transition-shadow: box-shadow 150ms ease;
transition-all: all 200ms ease;

/* Page Transitions */
transition-opacity: opacity 300ms ease;
transition-transform: transform 300ms ease;
```

### 7.2 Micro-Interactions

```tsx
// Button Press
<button className="
  ...
  active:scale-95
  transition-transform
">

// Card Hover
<div className="
  ...
  hover:-translate-y-0.5
  transition-transform
">

// Success Checkmark Animation
<CheckIcon className="
  animate-[scale-in_200ms_ease-out]
  text-success-500
" />
```

### 7.3 Loading States

```tsx
// Spinner
<div className="
  w-6 h-6
  border-2 border-primary-200
  border-t-primary-500
  rounded-full
  animate-spin
" />

// Skeleton
<div className="
  h-4 w-3/4
  bg-gray-200
  rounded
  animate-pulse
" />

// Button Loading
<button disabled className="opacity-70 cursor-not-allowed">
  <Spinner className="mr-2" />
  Wird gespeichert...
</button>
```

---

## 8. Icons

### 8.1 Icon Library
**Lucide Icons** (https://lucide.dev)

### 8.2 Icon Sizes

| Context | Size | Class |
|---------|------|-------|
| Inline (Text) | 16px | `w-4 h-4` |
| Buttons | 20px | `w-5 h-5` |
| Navigation | 24px | `w-6 h-6` |
| Features | 32px | `w-8 h-8` |
| Empty States | 48px | `w-12 h-12` |

### 8.3 Häufig verwendete Icons

```tsx
import {
  // Navigation
  Home,
  Users,
  FileText,
  Calendar,
  Settings,
  
  // Actions
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Download,
  Send,
  
  // Status
  Check,
  X,
  AlertCircle,
  Clock,
  
  // Misc
  Phone,
  Mail,
  MapPin,
  Euro,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
```

---

## 9. Responsive Breakpoints

```css
screens: {
  'sm': '640px',   // Große Phones im Landscape
  'md': '768px',   // Tablets
  'lg': '1024px',  // Kleine Laptops
  'xl': '1280px',  // Desktop
  '2xl': '1536px', // Große Monitore
}
```

### Responsive Patterns

```tsx
// Mobile-First Grid
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  gap-4
">

// Hiding/Showing
<span className="hidden sm:inline">Kunde hinzufügen</span>
<span className="sm:hidden">Neu</span>

// Responsive Padding
<div className="p-4 md:p-8">
```

---

## 10. Tailwind Config

```javascript
// tailwind.config.js
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6eef6',
          100: '#ccdded',
          200: '#99bbdb',
          300: '#6699c9',
          400: '#3377b7',
          500: '#1b4d89',
          600: '#163e6e',
          700: '#102e52',
          800: '#0b1f37',
          900: '#050f1b',
        },
        accent: {
          50: '#fefcf0',
          100: '#fdf9e1',
          200: '#fbf3c3',
          300: '#faea97',
          400: '#f9e45b',
          500: '#e6ce41',
          600: '#c4a920',
          700: '#917b16',
          800: '#5e4e0e',
          900: '#2b2406',
        },
        success: {
          50: '#edf7f0',
          100: '#dbefe1',
          200: '#b7dfc3',
          300: '#93cfa5',
          400: '#6db784',
          500: '#5a9e70',
          600: '#478259',
          700: '#356243',
          800: '#23422c',
          900: '#112116',
        },
        mint: {
          light: '#f3faf8',
          DEFAULT: '#e8f5f2',
          dark: '#d1ebe5',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 11. Dark Mode (Future)

Dark Mode ist für v2 geplant. Vorbereitung:

```tsx
// Immer semantische Farben verwenden
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">

// Tailwind Config
darkMode: 'class',
```
