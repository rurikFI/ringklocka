'use client'

import { useEffect, useRef, useState } from 'react'

const FOCUS_MS = 20 * 60 * 1000
const BREAK_MS = 20 * 1000

type Phase = 'idle' | 'focus' | 'break' | 'blocked'

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState(
    'Press the button to start 20-20-20 reminders.'
  )
  const [remainingMs, setRemainingMs] = useState(FOCUS_MS)
  const cycleTimeoutRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const targetTimeRef = useRef<number | null>(null)

  function clearTimers() {
    if (cycleTimeoutRef.current !== null) {
      window.clearTimeout(cycleTimeoutRef.current)
      cycleTimeoutRef.current = null
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    targetTimeRef.current = null
  }

  function pushNotification(body: string) {
    if (Notification.permission !== 'granted') {
      return
    }

    new Notification('Save your eyes', {
      body,
      tag: 'save-your-eyes-reminder',
    })
  }

  function startCountdown(duration: number, nextPhase: Exclude<Phase, 'idle' | 'blocked'>) {
    clearTimers()

    const target = Date.now() + duration
    targetTimeRef.current = target
    setPhase(nextPhase)
    setRemainingMs(duration)

    countdownIntervalRef.current = window.setInterval(() => {
      const nextRemaining = (targetTimeRef.current ?? Date.now()) - Date.now()
      setRemainingMs(Math.max(0, nextRemaining))
    }, 1000)
  }

  function scheduleFocusWindow() {
    startCountdown(FOCUS_MS, 'focus')
    setMessage('Reminders are active. Your next eye break is coming up.')

    cycleTimeoutRef.current = window.setTimeout(() => {
      pushNotification('20 second eye break starts... now!')
      scheduleBreakWindow()
    }, FOCUS_MS)
  }

  function scheduleBreakWindow() {
    startCountdown(BREAK_MS, 'break')
    setMessage('Look away now for 20 seconds.')

    cycleTimeoutRef.current = window.setTimeout(() => {
      pushNotification('Good. Keep on working.')
      scheduleFocusWindow()
    }, BREAK_MS)
  }

  function stopReminders() {
    clearTimers()
    setIsRunning(false)
    setPhase('idle')
    setRemainingMs(FOCUS_MS)
    setMessage('Reminders stopped. Press the button to start again.')
  }

  async function handleToggle() {
    if (isRunning) {
      stopReminders()
      return
    }

    if (!('Notification' in window)) {
      setPhase('blocked')
      setMessage('This browser does not support desktop notifications.')
      return
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') {
      setPhase('blocked')
      setMessage('Notifications were not allowed, so reminders cannot start.')
      return
    }

    setIsRunning(true)
    scheduleFocusWindow()
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  const buttonLabel = isRunning ? 'Stop saving your eyes' : 'Save your eyes'
  const phaseLabel =
    phase === 'focus'
      ? 'Next reminder in'
      : phase === 'break'
        ? 'Break ends in'
        : phase === 'blocked'
          ? 'Notifications unavailable'
          : 'Ready when you are'

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(232,240,255,0.92)_28%,_rgba(203,223,255,0.82)_58%,_rgba(125,158,214,0.95)_100%)] px-6 py-10 text-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/65 p-8 text-center shadow-[0_30px_120px_rgba(38,73,133,0.25)] backdrop-blur-xl sm:p-12">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
          20 · 20 · 20 Rule
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Save your eyes
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Every 20 minutes you will get a notification
          telling you to look away for 20 seconds at something 20 feet (6 meters) away.
        </p>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex min-h-28 w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-6 text-2xl font-semibold text-white shadow-[0_18px_50px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-300 active:translate-y-0 sm:min-h-32 sm:text-3xl"
          >
            {buttonLabel}
          </button>
        </div>

        <div className="mt-8 rounded-[1.5rem] bg-slate-950/5 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {phaseLabel}
          </p>
          <p className="mt-3 text-5xl font-semibold tabular-nums text-slate-950 sm:text-6xl">
            {phase === 'blocked' ? '--:--' : formatRemaining(remainingMs)}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
            {message}
          </p>
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          Keep this tab open in a desktop browser on Windows, macOS, or Linux
          and allow notifications when prompted.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-600">
          Made with &lt;3 by DCBA
        </p>
      </section>
    </main>
  )
}
