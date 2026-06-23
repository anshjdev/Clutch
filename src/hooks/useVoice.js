import { useState, useRef, useCallback } from 'react'

export const useVoice = (onTranscript) => {
  const [recording, setRecording]   = useState(false)
  const [supported, setSupported]   = useState('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const recognitionRef              = useRef(null)
  const transcriptRef               = useRef('')

  const start = useCallback(() => {
    if (!supported) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()

    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-IN'

    transcriptRef.current = ''

    recognition.onresult = (e) => {
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
      }
      transcriptRef.current = final
    }

    recognition.onerror = () => {
      setRecording(false)
    }

    recognition.onend = () => {
      setRecording(false)
      if (transcriptRef.current.trim()) {
        onTranscript(transcriptRef.current.trim())
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [supported, onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const toggle = useCallback(() => {
    recording ? stop() : start()
  }, [recording, start, stop])

  return { recording, supported, toggle, start, stop }
}
