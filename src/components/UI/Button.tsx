import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent' | 'danger'
  size?: 'default' | 'sm' | 'icon'
}

export function Button({ variant = 'default', size = 'default', className = '', children, ...props }: ButtonProps) {
  const classes = [
    'btn',
    variant !== 'default' ? `btn-${variant}` : '',
    size !== 'default' ? `btn-${size}` : '',
    className,
  ].filter(Boolean).join(' ')

  return <button className={classes} {...props}>{children}</button>
}
