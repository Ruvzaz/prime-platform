"use client"

import { useState, useRef, useCallback } from "react"
import { UploadCloud, X, File as FileIcon, Loader2, CheckCircle2 } from "lucide-react"
import { getPresignedUrl } from "@/app/actions/upload"

interface FileUploadProps {
  id: string
  name: string
  eventSlug: string
  disabled?: boolean
  required?: boolean
}

export function FileUpload({ id, name, eventSlug, disabled, required }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 20MB")
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsUploading(true)

    try {
      // 1. Get Pre-signed URL
      const { success, presignedUrl, publicUrl, error: actionError } = await getPresignedUrl(
        selectedFile.name,
        selectedFile.type,
        eventSlug,
        "uploads" // Generic folder since we don't have attendee name yet in the form phase
      )

      if (!success || !presignedUrl || !publicUrl) {
        throw new Error(actionError || "Failed to get upload URL")
      }

      // 2. Upload directly to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      // 3. Save URL for form submission
      setUploadedUrl(publicUrl)
    } catch (err: any) {
      console.error(err)
      setError("ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง")
      setFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isUploading) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [disabled, isUploading])

  const removeFile = () => {
    setFile(null)
    setUploadedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      <input
        type="hidden"
        name={name}
        value={uploadedUrl || ""}
        required={required && !uploadedUrl}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
        }}
        disabled={disabled || isUploading}
        accept="image/*,.pdf,.doc,.docx"
      />

      {!file ? (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-background/50
            ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${error ? "border-destructive/50 bg-destructive/5" : ""}
          `}
        >
          <div className="w-12 h-12 mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            คลิก หรือ ลากไฟล์มาวางที่นี่
          </p>
          <p className="text-xs text-muted-foreground">
            รองรับไฟล์รูปภาพ และ PDF ขนาดไม่เกิน 20MB
          </p>
          {error && <p className="text-xs text-destructive font-medium mt-3">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : uploadedUrl ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <FileIcon className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {isUploading && " • กำลังอัปโหลด..."}
                {uploadedUrl && " • อัปโหลดเสร็จสิ้น"}
              </span>
            </div>
          </div>
          
          {!isUploading && !disabled && (
            <button
              type="button"
              onClick={removeFile}
              className="p-2 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
