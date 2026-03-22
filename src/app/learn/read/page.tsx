'use client'

import { useEffect, useState } from 'react'

type ReadQuestion = {
  question: string
  choices: { A: string; B: string; C: string; D: string }
  explanations?: { A: string; B: string; C: string; D: string }
  answer: string
}

type ReadData = {
  topic: string
  passage: string
  questions: ReadQuestion[]
}

type Phase = 'loading' | 'error' | 'reading' | 'quiz' | 'done'

const QUEST_ID = 'reading'

function getTodayKey(questId: string) {
  const d = new Date()
  return `quest_done_${questId}_${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function alreadyClaimed(questId: string) {
  return !!localStorage.getItem(getTodayKey(questId))
}

function markClaimed(questId: string) {
  localStorage.setItem(getTodayKey(questId), '1')
}

function sendCompletion() {
  if (alreadyClaimed(QUEST_ID)) return  // already got reward today
  markClaimed(QUEST_ID)
  if (window.opener) {
    window.opener.postMessage({ type: 'QUEST_COMPLETE', questId: QUEST_ID }, 'https://www.youtube.com')
  }
}


export default function ReadPage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [data, setData] = useState<ReadData | null>(null)
  const [selected, setSelected] = useState<(string | null)[]>([null, null, null])
  const [submittedAt, setSubmittedAt] = useState<boolean[]>([false, false, false])
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'read' }),
    })
      .then(r => r.json())
      .then(d => {
        if (!d.passage || !d.questions) throw new Error('Invalid response')
        setData(d)
        setPhase('reading')
      })
      .catch(e => {
        setError(e.message)
        setPhase('error')
      })
  }, [])

  if (!data) {
    if (phase === 'loading') return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <div className="text-4xl mb-4 animate-pulse">📖</div>
          <p>Finding something interesting to read...</p>
        </div>
      </main>
    )
    if (phase === 'error') return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">Failed to load</p>
          <p className="text-sm text-neutral-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg text-white hover:bg-neutral-700 transition">
            Try again
          </button>
        </div>
      </main>
    )
    return null
  }

  const score = selected.filter((s, i) => s === data.questions[i]?.answer).length
  const passed = score >= 2 // 2 out of 3

  if (phase === 'done') {
    if (passed) sendCompletion()
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">{passed ? '🎉' : '😔'}</div>
          <h1 className="text-2xl font-bold mb-2">{passed ? 'Quest Complete!' : 'Not quite...'}</h1>
          <p className="text-neutral-400 mb-2">
            You got <span className="text-white font-bold">{score} / 3</span> correct
          </p>
          {passed ? (
            alreadyClaimed(QUEST_ID)
            ? <p className="text-amber-400 font-medium mb-6">You already claimed this quest today. Come back tomorrow!</p>
            : <p className="text-green-400 font-medium mb-6">+15 min of Shorts unlocked! You can close this window.</p>
          ) : (
            <p className="text-neutral-400 mb-6">You need 2/3 to pass. Read more carefully!</p>
          )}

          <div className="space-y-3 text-left mb-6">
            {data.questions.map((q, i) => {
              const userAns = selected[i]
              const correct = userAns === q.answer
              return (
                <div key={i} className={`text-sm p-3 rounded-lg ${correct ? 'bg-green-900/30 border border-green-800/40' : 'bg-red-900/30 border border-red-800/40'}`}>
                  <p className={`font-medium ${correct ? 'text-green-300' : 'text-red-300'}`}>{q.question}</p>
                  {!correct && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Your answer: {userAns ?? 'none'} — Correct: {q.answer}: {q.choices[q.answer as keyof typeof q.choices]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {!passed && (
            <button onClick={() => window.location.reload()} className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg transition">
              Try a new passage
            </button>
          )}
        </div>
      </main>
    )
  }

  if (phase === 'reading') return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8">
          <div className="text-xs text-purple-400 font-medium uppercase tracking-widest mb-3">{data.topic}</div>
          <p className="text-neutral-200 leading-relaxed text-base mb-8">{data.passage}</p>
          <button
            onClick={() => setPhase('quiz')}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition"
          >
            I&apos;ve read it — start questions →
          </button>
        </div>
      </div>
    </main>
  )



  // Quiz phase
  const q = data.questions[current]
  const choices = ['A', 'B', 'C', 'D'] as const
  const isSubmitted = submittedAt[current]
  const pickedLetter = selected[current]
  const isCorrectPick = pickedLetter === q.answer

  function pick(letter: string) {
    if (isSubmitted) return
    const newSelected = [...selected]
    newSelected[current] = letter
    setSelected(newSelected)
  }

  function checkAnswer() {
    if (!pickedLetter) return
    const updated = [...submittedAt]
    updated[current] = true
    setSubmittedAt(updated)
  }

  function next() {
    if (current + 1 >= data!.questions.length) {
      setPhase('done')
    } else {
      setCurrent(c => c + 1)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex justify-between text-sm text-neutral-500 mb-2">
          <span>Question {current + 1} of {data.questions.length}</span>
          <span>{score} correct</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-6">
          <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${(current / data.questions.length) * 100}%` }} />
        </div>

        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 mb-4 text-sm text-neutral-400 italic">
          {data.passage.slice(0, 120)}...
        </div>

        <div className={`bg-neutral-900 border rounded-2xl p-6 transition-colors ${
          isSubmitted
            ? isCorrectPick ? 'border-green-500' : 'border-red-500'
            : 'border-neutral-700'
        }`}>
          <p className="font-medium mb-5">{q.question}</p>

          <div className="space-y-2">
            {choices.map(letter => {
              const isSelected = pickedLetter === letter
              const isCorrectChoice = letter === q.answer
              const isDimmed = isSubmitted
                ? false // after submit show all with their state
                : !!pickedLetter && !isSelected // before submit: dim unselected if something is picked

              // State after submit
              const showCorrect = isSubmitted && isCorrectChoice
              const showWrong   = isSubmitted && isSelected && !isCorrectChoice
              const showDimmed  = isSubmitted && !isCorrectChoice && !isSelected

              const explanation = q.explanations?.[letter]

              return (
                <button
                  key={letter}
                  onClick={() => pick(letter)}
                  disabled={isSubmitted}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm
                    ${showCorrect  ? 'bg-green-900 border-green-500 text-green-200' :
                      showWrong    ? 'bg-red-900 border-red-500 text-red-200' :
                      showDimmed   ? 'bg-neutral-900 border-neutral-800 text-neutral-600' :
                      isDimmed     ? 'bg-neutral-800 border-neutral-700/50 text-neutral-500' :
                      isSelected   ? 'bg-white-900 border-purple-400 text-purple-100' :
                      'bg-neutral-800 border-neutral-700 hover:border-neutral-500 text-neutral-300'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-bold shrink-0 mt-0.5 ${
                      showCorrect ? 'text-green-400' :
                      showWrong   ? 'text-red-400' :
                      showDimmed  ? 'text-neutral-700' :
                      isSelected  ? 'text-purple-300' : 'text-neutral-500'
                    }`}>{letter}.</span>
                    <div className="flex-1">
                      <span>{q.choices[letter]}</span>
                      {isSubmitted && explanation && (
                        <p className={`mt-1.5 text-xs leading-relaxed ${
                          showCorrect ? 'text-green-400/80' :
                          showWrong   ? 'text-red-400/80' :
                          'text-neutral-500'
                        }`}>
                          {explanation}
                        </p>
                      )}
                    </div>
                    {showCorrect && <span className="text-green-400 shrink-0">✓</span>}
                    {showWrong   && <span className="text-red-400 shrink-0">✗</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            {!isSubmitted ? (
              <button
                onClick={checkAnswer}
                disabled={!pickedLetter}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                Check answer
              </button>
            ) : (
              <button
                onClick={next}
                className={`w-full py-2.5 text-white font-semibold rounded-lg transition ${
                  isCorrectPick ? 'bg-green-700 hover:bg-green-600' : 'bg-neutral-700 hover:bg-neutral-600'
                }`}
              >
                {current + 1 >= data.questions.length ? 'See results →' : 'Next question →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}