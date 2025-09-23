"use client"

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <div className={open ? "fixed inset-0 z-50" : "hidden"}>
      {children}
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps & { onClose?: () => void }> = ({ 
  className = "", 
  children, 
  onClose 
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  const handleCloseClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleOverlayClick}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 ${className}`}>
        {children}
        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
          onClick={handleCloseClick}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className = "", children }) => {
  return (
    <div className={`flex flex-col space-y-2 p-6 pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className = "", children }) => {
  return (
    <h2 className={`text-xl font-semibold leading-none tracking-tight text-gray-900 ${className}`}>
      {children}
    </h2>
  )
}

const DialogTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
