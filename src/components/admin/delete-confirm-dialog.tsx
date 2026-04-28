"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemCount?: number
  itemNames?: string[]
  onConfirm: () => Promise<void>
  variant?: "delete" | "warning"
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  description,
  itemCount = 1,
  itemNames = [],
  onConfirm,
  variant = "delete",
}: DeleteConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
      onOpenChange(false)
    }
  }

  const defaultDescription = itemCount > 1
    ? `You are about to remove ${itemCount} selected items.`
    : `You are about to remove this item.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl p-10">
        <DialogHeader>
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-inner ${
            variant === "delete" ? "bg-rose-50 dark:bg-rose-500/10" : "bg-amber-50 dark:bg-amber-500/10"
          }`}>
            <AlertTriangle className={`h-10 w-10 ${
              variant === "delete" ? "text-rose-500" : "text-amber-500"
            }`} />
          </div>
          <DialogTitle className="text-center text-xl font-black tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm pt-3 font-medium text-slate-500">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Item list preview */}
        {itemNames.length > 0 && (
          <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5 p-4 my-6 max-h-40 overflow-y-auto">
            <ul className="space-y-2">
              {itemNames.map((name, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-rose-700 dark:text-rose-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-slate-900 dark:bg-white px-5 py-4 text-xs font-bold text-white dark:text-slate-900 flex items-start gap-3 my-2 shadow-lg">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="leading-relaxed">This action is irreversible. All associated data will be purged from the system permanently.</span>
        </div>

        <DialogFooter className="gap-3 sm:gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1 rounded-xl h-12 font-bold hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-xl h-12 font-bold bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-5 w-5" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
