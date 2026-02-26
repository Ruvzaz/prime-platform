"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loadingText?: string
}

export function SubmitButton({ children, loadingText = "กำลังดำเนินการ...", className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      className={className}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? loadingText : children}
    </Button>
  )
}
