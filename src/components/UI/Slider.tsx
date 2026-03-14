import React from 'react'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  label?: string
  onChange: (value: number) => void
}

export function Slider({ value, min = 0, max = 1, step = 0.01, label, onChange }: SliderProps) {
  return (
    <div className="slider-container">
      {label && <span className="panel-label">{label}</span>}
      <input
        type="range"
        className="slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="panel-value">{value.toFixed(2)}</span>
    </div>
  )
}
