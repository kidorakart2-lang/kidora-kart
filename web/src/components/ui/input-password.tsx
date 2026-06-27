'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InputPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function InputPassword({ id, label = 'Password', placeholder = 'Enter your password', className = '', ...props }: InputPasswordProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = id || useId()

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        <Input 
          id={inputId} 
          type={isVisible ? 'text' : 'password'} 
          placeholder={placeholder} 
          className='pr-9' 
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isVisible ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      </div>
    </div>
  )
}

export default InputPassword