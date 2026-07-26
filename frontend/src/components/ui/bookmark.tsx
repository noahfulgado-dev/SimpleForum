export function Bookmark({ fillColor }: { fillColor?: string }) {
  return (
    <svg className="shrink-0 w-7 h-7" width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5V19L12 15.5L19 19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5Z" stroke={fillColor || 'currentColor'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function Bookmarked({ fillColor }: { fillColor?: string }) {
  return (
    <svg className="shrink-0 w-[1.8rem] h-[1.8rem]" width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5V19L12 15.5L19 19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5Z" fill={fillColor || 'currentColor'} />
    </svg>
  )
}
