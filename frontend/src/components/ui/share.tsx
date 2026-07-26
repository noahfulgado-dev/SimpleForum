export function Share({ fillColor }: { fillColor?: string }) {
  return (
    <svg className="shrink-0 w-7 h-7" width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7L7 4L10 7" stroke={fillColor || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4V15C7 16.1046 7.89543 17 9 17H11" stroke={fillColor || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 17L17 20L14 17" stroke={fillColor || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 20V9C17 7.89543 16.1046 7 15 7H13" stroke={fillColor || 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
