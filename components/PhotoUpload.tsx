'use client'

import { useRef, useState } from 'react'

interface Props {
  label: string
  accept?: string
  multiple?: boolean
  files: File[]
  onChange: (files: File[]) => void
}

export default function PhotoUpload({ label, accept = 'image/*', multiple = true, files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const newFiles = Array.from(incoming)
    onChange(multiple ? [...files, ...newFiles] : newFiles)
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
      >
        <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-green-600 dark:text-green-400">Tap to upload</span> or drag &amp; drop
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{multiple ? 'Multiple photos supported' : 'One photo'}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {files.map((file, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Photo ${i + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
