'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InputPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  inputClassName?: string
}

export function InputPassword({
  id,
  label = 'Password',
  placeholder = 'Enter your password',
  className = '',
  inputClassName = '',
  ...props
}: InputPasswordProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = id || useId()

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label
          htmlFor={inputId}
          className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65"
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder}
          className={`pr-11 ${inputClassName}`}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(!isVisible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-[var(--brand-gold-dark)] hover:bg-[var(--brand-cream)]"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default InputPassword