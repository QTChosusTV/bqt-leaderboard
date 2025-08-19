'use client'

import { useEffect, useState } from 'react'

export interface EditorTheme {
  name: string
  value: string
  description: string
}

export const editorThemes: EditorTheme[] = [
  { name: 'VS Dark', value: 'vs-dark', description: 'Default VS Code dark theme' },
  { name: 'VS Light', value: 'vs', description: 'Default VS Code light theme' },
  { name: 'Monokai', value: 'monokai', description: 'Popular dark theme' },
  { name: 'GitHub Dark', value: 'github-dark', description: 'GitHub-inspired dark theme' },
  { name: 'Dracula', value: 'dracula', description: 'Dark theme with vibrant colors' },
  { name: 'One Dark', value: 'one-dark', description: 'Atom One Dark theme' },
  { name: 'Nord', value: 'nord', description: 'Arctic, north-bluish theme' },
  { name: 'Solarized Dark', value: 'solarized-dark', description: 'Precision colors for machines' },
  { name: 'High Contrast', value: 'hc-black', description: 'High contrast dark' },
  { name: 'High Contrast Light', value: 'hc-light', description: 'High contrast light' },
]

interface ThemeSwitcherProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export const ThemeSwitcher = ({ currentTheme, onThemeChange }: ThemeSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('editor-theme')
    if (savedTheme && editorThemes.find(t => t.value === savedTheme)) {
      onThemeChange(savedTheme)
    }
  }, [])

  const handleThemeChange = (theme: string) => {
    onThemeChange(theme)
    localStorage.setItem('editor-theme', theme)
    setIsOpen(false)
  }

  const currentThemeObj = editorThemes.find(t => t.value === currentTheme) || editorThemes[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        {currentThemeObj.name}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
          {editorThemes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors duration-200 ${
                currentTheme === theme.value ? 'bg-gray-700 text-purple-400' : 'text-gray-200'
              }`}
              title={theme.description}
            >
              <div className="font-medium">{theme.name}</div>
              <div className="text-xs text-gray-400">{theme.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
