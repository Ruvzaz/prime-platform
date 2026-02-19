"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-3 ${
            variant === "delete" ? "bg-red-50" : "bg-amber-50"
          }`}>
            <AlertTriangle className={`h-7 w-7 ${
              variant === "delete" ? "text-red-500" : "text-amber-500"
            }`} />
          </div>
          <DialogTitle className="text-center text-lg">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Item list preview */}
        {itemNames.length > 0 && (
          <div className="rounded-lg border border-red-100 bg-red-50/50 p-3 my-2 max-h-32 overflow-y-auto">
            <ul className="space-y-1">
              {itemNames.map((name, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                  <Trash2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2 my-1">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Data will be hidden from the system but remains in the database and can be restored.</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
