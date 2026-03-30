"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"

interface SoundContextType {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soundEnabled")
      if (saved !== null) {
        setSoundEnabled(saved === "true")
      }
    } catch (error) {
      console.error("Failed to load sound settings", error)
    }
  }, [])

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("soundEnabled", soundEnabled.toString())
    } catch (error) {
      console.error("Failed to save sound settings", error)
    }
  }, [soundEnabled])

  // Preload audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio("/mixkit-fast-double-click-on-mouse-275.wav")
      audioRef.current.preload = "auto"
    }
  }, [])

  const playClickSound = () => {
    if (soundEnabled && audioRef.current) {
      const audio = audioRef.current
      // Create a shallow clone or reset state to allow rapid clicking overlapping sounds
      const playPromise = audio.paused ? audio.play() : (() => {
        const sound = audio.cloneNode() as HTMLAudioElement
        return sound.play()
      })()

      playPromise?.catch((err) => {
        // Silently fail if blocked by browser auto-play policy
      })
    }
  }

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (!soundEnabled) return

      const target = event.target as HTMLElement
      // Play sound on buttons, links, and switches
      const isValidTarget = 
        target.closest("button") || 
        target.closest('input[type="checkbox"]') ||
        target.closest('input[type="radio"]') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[role="switch"]')

      if (isValidTarget) {
        playClickSound()
      }
    }

    window.addEventListener("mousedown", handleGlobalClick)
    return () => window.removeEventListener("mousedown", handleGlobalClick)
  }, [soundEnabled])

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider")
  }
  return context
}
