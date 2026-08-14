import { type RefObject } from 'react'

interface ProfileAvatarProps {
  src: string
  uploading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onClick: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ProfileAvatar({ src, uploading, fileInputRef, onClick, onChange }: ProfileAvatarProps) {
  return (
    <div className="relative w-24 h-24 shrink-0 group">
      <img
        src={src}
        alt="Avatar"
        className="w-24 h-24 border border-border rounded-full object-cover ring-4 ring-card"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={uploading}
      />
      <button
        onClick={onClick}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {uploading ? (
          <svg className="w-6 h-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </button>
    </div>
  )
}