import { useEffect, useMemo, useRef, useState } from 'react'

// Segmented OTP input with 6 boxes, paste support, and auto focus/advance
export default function OtpInput({ length = 6, value = '', onChange, autoFocus = true, disabled = false }) {
  const sanitize = (str) => (str || '').replace(/[^0-9]/g, '')
  const initial = useMemo(() => {
    const digits = sanitize(value).slice(0, length).split('')
    return Array.from({ length }, (_, i) => digits[i] || '')
  }, [length, value])

  const [digits, setDigits] = useState(initial)
  const inputsRef = useRef([])

  useEffect(() => {
    // Keep in sync if parent value changes externally
    setDigits(initial)
  }, [initial])

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
      inputsRef.current[0].select?.()
    }
  }, [autoFocus])

  const commit = (arr) => {
    const next = arr.map((c) => (c || '').slice(0, 1))
    setDigits(next)
    const code = next.join('')
    onChange && onChange(code)
  }

  const handleChange = (idx, e) => {
    const char = sanitize(e.target.value).slice(-1)
    const next = [...digits]
    next[idx] = char
    commit(next)
    if (char && idx < length - 1) {
      // Use setTimeout to ensure focus works on iOS
      setTimeout(() => {
        inputsRef.current[idx + 1]?.focus()
        inputsRef.current[idx + 1]?.select?.()
      }, 0)
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]
        next[idx] = ''
        commit(next)
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (idx, e) => {
    const text = sanitize(e.clipboardData.getData('text'))
    if (!text) return
    e.preventDefault()
    const next = [...digits]
    for (let i = 0; i < length - idx; i++) {
      next[idx + i] = text[i] || ''
    }
    commit(next)
    const last = Math.min(idx + text.length - 1, length - 1)
    inputsRef.current[last]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={digits[i]}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 tracking-widest touch-manipulation"
        />
      ))}
    </div>
  )
}
