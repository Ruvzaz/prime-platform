"use client"

import { useState, useRef } from "react"
import { UploadCloud, X, File as FileIcon, Loader2, CheckCircle2 } from "lucide-react"
import { getPresignedUrl } from "@/app/actions/upload"
import { Button } from "@/components/ui/button"

interface AdminFileUploadProps {
  id: string
  name: string
  eventSlug?: string
  defaultValue?: string | null
  accept?: string
  label?: string
  folder?: string
}

export function AdminFileUpload({ 
  id, 
  name, 
  eventSlug = "admin-uploads", 
  defaultValue, 
  accept = "image/*", 
  label = "Upload File",
  folder = "uploads"
}: AdminFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultValue || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    // 5MB limit for Admin uploads as per current requirement, but could be higher with R2
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File size too large (Max 20MB)")
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
        folder
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
        throw new Error("Failed to upload file to storage")
      }

      // 3. Save URL for form submission
      setUploadedUrl(publicUrl)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Upload failed. Please try again.")
      setFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="hidden"
        name={name}
        value={uploadedUrl || ""}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
        }}
        accept={accept}
      />

      {!uploadedUrl && !isUploading ? (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-dashed py-8 flex flex-col gap-2 h-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded bg-primary/10 flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">
                {file ? file.name : "Existing File"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isUploading ? "Uploading to storage..." : "Ready for submission"}
              </span>
            </div>
          </div>
          
          {!isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={removeFile}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      
      {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
      
      {uploadedUrl && !isUploading && (
        <div className="text-[10px] text-muted-foreground italic truncate">
          URL: <a href={uploadedUrl} target="_blank" className="underline">{uploadedUrl}</a>
        </div>
      )}
    </div>
  )
}
