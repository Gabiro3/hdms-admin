"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ImagePlus, X, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void
  maxImages?: number
}

export default function ImageUploader({ onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check if adding these files would exceed the maximum
    if (selectedImages.length + files.length > maxImages) {
      setError(`You can only upload a maximum of ${maxImages} images`)
      return
    }

    // Validate file types
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/dicom", "application/dicom"]
    const invalidFiles = files.filter((file) => !validImageTypes.includes(file.type))

    if (invalidFiles.length > 0) {
      setError("Only image files (JPEG, PNG, GIF, DICOM) are allowed")
      return
    }

    // Check file sizes (limit to 10MB per file)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize)

    if (oversizedFiles.length > 0) {
      setError("One or more files exceed the 10MB size limit")
      return
    }

    // Clear any previous errors
    setError(null)

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file))

    // Update state
    const updatedImages = [...selectedImages, ...files]
    setSelectedImages(updatedImages)
    setPreviews([...previews, ...newPreviews])

    // Notify parent component
    onImagesChange(updatedImages)
  }

  const removeImage = (index: number) => {
    const updatedImages = [...selectedImages]
    updatedImages.splice(index, 1)
    setSelectedImages(updatedImages)

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index])
    const updatedPreviews = [...previews]
    updatedPreviews.splice(index, 1)
    setPreviews(updatedPreviews)

    // Notify parent component
    onImagesChange(updatedImages)

    // Clear error if we're now under the limit
    if (error && updatedImages.length < maxImages) {
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)

      // Use the file input's change handler to process the files
      const dataTransfer = new DataTransfer()
      files.forEach((file) => dataTransfer.items.add(file))

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/dicom,application/dicom"
          multiple
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <ImagePlus className="h-6 w-6 text-primary" />
          </div>
          <div className="text-sm font-medium">Drag and drop images or click to browse</div>
          <div className="text-xs text-muted-foreground">Supported formats: JPEG, PNG, GIF, DICOM</div>
          <Button variant="outline" size="sm" className="mt-2">
            <Upload className="mr-2 h-4 w-4" />
            Select Files
          </Button>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {previews.map((preview, index) => (
            <Card key={index} className="relative overflow-hidden group">
              <img
                src={preview || "/placeholder.svg"}
                alt={`Preview ${index + 1}`}
                className="w-full h-40 object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="p-2 text-xs truncate">{selectedImages[index]?.name}</div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {selectedImages.length} of {maxImages} images selected
      </div>
    </div>
  )
}
