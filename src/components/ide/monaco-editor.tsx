'use client'

import { useEffect, useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { customThemes } from '@/lib/ide/custom-themes'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  height?: string
  width?: string
  readOnly?: boolean
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
}

export const MonacoEditor = ({
  value,
  onChange,
  language = 'cpp',
  theme = 'vs-dark',
  height = '100%',
  width = '100%',
  readOnly = false,
  onMount: onMountProp
}: MonacoEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Define custom themes
    Object.entries(customThemes).forEach(([themeName, themeData]) => {
      monaco.editor.defineTheme(themeName, themeData as any)
    })

    // Configure language-specific settings
    if (language === 'cpp' || language === 'c') {
      monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // Add C++ keywords and common functions
        const suggestions = [
          // Keywords
          ...['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 
              'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto',
              'if', 'int', 'long', 'register', 'return', 'short', 'signed',
              'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
              'unsigned', 'void', 'volatile', 'while', 'class', 'namespace',
              'template', 'this', 'using', 'virtual', 'typename', 'bool',
              'true', 'false', 'public', 'private', 'protected'].map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
          })),
          // Common STL containers
          ...['vector', 'map', 'set', 'unordered_map', 'unordered_set', 
              'queue', 'stack', 'deque', 'priority_queue', 'pair', 
              'string', 'array', 'list'].map(container => ({
            label: container,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: container,
            range: range,
          })),
          // Common functions
          ...['cout', 'cin', 'endl', 'printf', 'scanf', 'sort', 'reverse',
              'min', 'max', 'swap', 'push_back', 'pop_back', 'push', 'pop',
              'size', 'empty', 'clear', 'begin', 'end', 'find', 'insert',
              'erase', 'lower_bound', 'upper_bound'].map(func => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func,
            range: range,
          })),
        ]

        return { suggestions }
      },
    })
    } else if (language === 'python') {
      // Python-specific completions
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          }

          const suggestions = [
            // Python keywords
            ...['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return',
                'import', 'from', 'as', 'try', 'except', 'finally', 'with',
                'lambda', 'pass', 'break', 'continue', 'global', 'nonlocal',
                'assert', 'yield', 'raise', 'del', 'True', 'False', 'None',
                'and', 'or', 'not', 'in', 'is', 'async', 'await'].map(keyword => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
            })),
            // Common Python functions
            ...['print', 'len', 'range', 'input', 'int', 'str', 'float', 'list',
                'dict', 'set', 'tuple', 'sorted', 'min', 'max', 'sum', 'abs',
                'round', 'enumerate', 'zip', 'map', 'filter', 'open', 'type'].map(func => ({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func,
              range: range,
            })),
          ]

          return { suggestions }
        },
      })
    }

    // Set editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, monospace',
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      cursorStyle: 'line',
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      parameterHints: {
        enabled: true,
      },
      readOnly: readOnly,
    })

    // Add keyboard shortcuts
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        // This will be handled by the parent component
        const event = new CustomEvent('run-code')
        window.dispatchEvent(event)
      },
    })

    editor.addAction({
      id: 'save-code',
      label: 'Save Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        const event = new CustomEvent('save-code')
        window.dispatchEvent(event)
      },
    })

    if (onMountProp) {
      onMountProp(editor)
    }
  }

  const handleEditorChange: OnChange = (value) => {
    onChange(value || '')
  }

  return (
    <Editor
      height={height}
      width={width}
      language={language}
      theme={theme}
      value={value}
      onMount={handleEditorMount}
      onChange={handleEditorChange}
      loading={
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      }
      options={{
        selectOnLineNumbers: true,
        roundedSelection: false,
        cursorStyle: 'line',
        automaticLayout: true,
      }}
    />
  )
}
