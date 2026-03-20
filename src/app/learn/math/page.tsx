'use client'

import { useEffect, useState } from 'react'

type Question = {
  question: string
  answer: number
  hint: string
}

type Phase = 'loading' | 'error' | 'quiz' | 'done'

const PASS_THRESHOLD = 8 // out of 10
const QUEST_ID = 'math'

function sendCompletion() {
  if (window.opener) {
    window.opener.postMessage({ type: 'QUEST_COMPLETE', questId: QUEST_ID }, 'https://www.youtube.com')
  }
}

export default function MathPage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'math' }),
    })
      .then(r => r.json())
      .then(data => {
        const arr: Question[] = Array.isArray(data) ? data : []
        if (arr.length === 0) throw new Error('No questions received')
        setQuestions(arr)
        setAnswers(new Array(arr.length).fill(null))
        setPhase('quiz')
      })
      .catch(e => {
        setError(e.message)
        setPhase('error')
      })
  }, [])

  const q = questions[current]
  const score = answers.filter((a, i) => a !== null && Math.abs(a - questions[i].answer) < 0.01).length

  function submit() {
    const parsed = parseFloat(input.trim())
    if (isNaN(parsed)) return

    const correct = Math.abs(parsed - q.answer) < 0.01
    setFeedback(correct ? 'correct' : 'wrong')

    const newAnswers = [...answers]
    newAnswers[current] = parsed
    setAnswers(newAnswers)

    setTimeout(() => {
      setFeedback(null)
      setShowHint(false)
      setInput('')
      if (current + 1 >= questions.length) {
        setPhase('done')
      } else {
        setCurrent(c => c + 1)
      }
    }, 900)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit()
  }

  if (phase === 'loading') return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center text-neutral-400">
        <div className="text-4xl mb-4 animate-pulse">🧮</div>
        <p>Generating questions...</p>
      </div>
    </main>
  )

  if (phase === 'error') return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-400">
        <p className="text-xl mb-2">Failed to load questions</p>
        <p className="text-sm text-neutral-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg text-white hover:bg-neutral-700 transition">
          Try again
        </button>
      </div>
    </main>
  )

  if (phase === 'done') {
    const passed = score >= PASS_THRESHOLD
    if (passed) sendCompletion()
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">{passed ? '🎉' : '😔'}</div>
          <h1 className="text-2xl font-bold mb-2">{passed ? 'Quest Complete!' : 'Not quite...'}</h1>
          <p className="text-neutral-400 mb-2">
            You got <span className="text-white font-bold">{score} / {questions.length}</span>
          </p>
          {passed ? (
            <p className="text-green-400 font-medium mb-6">+20 min of Shorts unlocked! You can close this window.</p>
          ) : (
            <p className="text-neutral-400 mb-6">You need {PASS_THRESHOLD}/10 to pass. Try again!</p>
          )}

          <div className="space-y-2 text-left mb-6">
            {questions.map((q, i) => {
              const userAns = answers[i]
              const correct = userAns !== null && Math.abs(userAns - q.answer) < 0.01
              return (
                <div key={i} className={`text-sm p-2 rounded-lg ${correct ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                  <span className="font-medium">Q{i + 1}:</span> {q.question}
                  {!correct && <span className="block text-xs mt-0.5 text-neutral-400">Answer: {q.answer}</span>}
                </div>
              )
            })}
          </div>

          {!passed && (
            <button onClick={() => window.location.reload()} className="w-full py-2 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition">
              Try again with new questions
            </button>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex justify-between text-sm text-neutral-500 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{score} correct so far</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-6">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((current) / questions.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className={`bg-neutral-900 border rounded-2xl p-8 transition-colors ${feedback === 'correct' ? 'border-green-500' : feedback === 'wrong' ? 'border-red-500' : 'border-neutral-700'}`}>
          <p className="text-lg font-medium mb-6 leading-relaxed">{q.question}</p>

          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Your answer..."
            disabled={feedback !== null}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition mb-4"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={feedback !== null || input.trim() === ''}
              className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {feedback === 'correct' ? '✓ Correct!' : feedback === 'wrong' ? '✗ Wrong' : 'Submit'}
            </button>
            <button
              onClick={() => setShowHint(h => !h)}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition text-sm"
            >
              Hint
            </button>
          </div>

          {showHint && (
            <p className="mt-4 text-sm text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
              💡 {q.hint}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
