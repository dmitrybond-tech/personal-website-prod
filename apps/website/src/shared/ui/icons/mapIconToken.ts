/**
 * Maps string tokens to iconify-icon components
 * Safe default: render no icon if token is unknown
 */

export interface IconToken {
  token: string;
  iconify: string;
}

// Common icon mappings
const ICON_MAP: Record<string, string> = {
  // User and profile icons
  'user': 'fa6-solid:user',
  'profile': 'fa6-solid:user',
  'person': 'fa6-solid:user',
  
  // Work and business icons
  'briefcase': 'fa6-solid:briefcase',
  'work': 'fa6-solid:briefcase',
  'job': 'fa6-solid:briefcase',
  'career': 'fa6-solid:briefcase',
  'suitcase': 'fa6-solid:suitcase',
  
  // Education icons
  'education': 'fa6-solid:graduation-cap',
  'school': 'fa6-solid:graduation-cap',
  'university': 'fa6-solid:graduation-cap',
  'degree': 'fa6-solid:graduation-cap',
  'graduation-cap': 'fa6-solid:graduation-cap',
  
  // Calendar and time icons
  'calendar': 'fa6-solid:calendar',
  'schedule': 'fa6-solid:calendar',
  'time': 'fa6-solid:clock',
  'clock': 'fa6-solid:clock',
  
  // Code and development icons
  'code': 'fa6-solid:code',
  'development': 'fa6-solid:code',
  'programming': 'fa6-solid:code',
  'tech': 'fa6-solid:code',
  
  // Communication icons
  'email': 'fa6-solid:envelope',
  'mail': 'fa6-solid:envelope',
  'contact': 'fa6-solid:envelope',
  'phone': 'fa6-solid:phone',
  'call': 'fa6-solid:phone',
  
  // Social media icons
  'github': 'fa6-brands:github',
  'linkedin': 'fa6-brands:linkedin-in',
  'twitter': 'fa6-brands:twitter',
  'facebook': 'fa6-brands:facebook-f',
  'instagram': 'fa6-brands:instagram',
  'pinterest': 'fa6-brands:pinterest',
  'codepen': 'fa6-brands:codepen',
  'dev': 'fa6-brands:dev',
  'medium': 'fa6-brands:medium',
  'reddit': 'fa6-brands:reddit',
  'quora': 'fa6-brands:quora',
  'stack-overflow': 'fa6-brands:stack-overflow',
  'behance': 'fa6-brands:behance',
  'dribbble': 'fa6-brands:dribbble',
  'figma': 'fa6-brands:figma',
  'spotify': 'fa6-brands:spotify',
  'soundcloud': 'fa6-brands:soundcloud',
  'youtube': 'fa6-brands:youtube',
  'twitch': 'fa6-brands:twitch',
  'vimeo': 'fa6-brands:vimeo',
  
  // File and document icons
  'file': 'fa6-solid:file',
  'document': 'fa6-solid:file',
  'pdf': 'fa6-solid:file-pdf',
  'download': 'fa6-solid:download',
  'cv': 'fa6-solid:file-pdf',
  'resume': 'fa6-solid:file-pdf',
  
  // Location icons
  'location': 'fa6-solid:location-dot',
  'map': 'fa6-solid:location-dot',
  'address': 'fa6-solid:location-dot',
  
  // Skills and tools icons
  'skills': 'fa6-solid:bars-progress',
  'tools': 'fa6-solid:tools',
  'technologies': 'fa6-solid:tools',
  'stack': 'fa6-solid:tools',
  'bars-progress': 'fa6-solid:bars-progress',
  
  // Project and portfolio icons
  'project': 'fa6-solid:folder',
  'portfolio': 'fa6-solid:folder',
  'rocket': 'fa6-solid:rocket',
  'images': 'fa6-solid:images',
  
  // Experience icons
  'experience': 'fa6-solid:briefcase',
  'history': 'fa6-solid:clock-rotate-left',
  'timeline': 'fa6-solid:clock-rotate-left',
  
  // Testimonials and reviews icons
  'testimonial': 'fa6-solid:comment',
  'review': 'fa6-solid:star',
  'rating': 'fa6-solid:star',
  'recommendation': 'fa6-solid:thumbs-up',
  'comment': 'fa6-solid:comment',
  
  // Favorites and interests icons
  'favorite': 'fa6-solid:star',
  'interest': 'fa6-solid:heart',
  'hobby': 'fa6-solid:heart',
  'passion': 'fa6-solid:heart',
  'star': 'fa6-solid:star',
  
  // Search and find icons
  'search': 'fa6-solid:magnifying-glass',
  'find': 'fa6-solid:magnifying-glass',
  'lookup': 'fa6-solid:magnifying-glass',
  
  // Link and external icons
  'link': 'fa6-solid:link',
  'external': 'fa6-solid:arrow-up-right-from-square',
  'external-link': 'fa6-solid:arrow-up-right-from-square', // Fix broken token
  'url': 'fa6-solid:link',
  'globe': 'fa6-solid:globe',
  'desktop': 'fa6-solid:desktop',
  'paintbrush': 'fa6-solid:paintbrush',
  'code-branch': 'fa6-solid:code-branch',
  
  // Menu and navigation icons
  'menu': 'fa6-solid:bars',
  'hamburger': 'fa6-solid:bars',
  'nav': 'fa6-solid:bars',
  
  // Settings and configuration icons
  'settings': 'fa6-solid:gear',
  'config': 'fa6-solid:gear',
  'preferences': 'fa6-solid:gear',
  
  // Info and help icons
  'info': 'fa6-solid:circle-info',
  'help': 'fa6-solid:circle-question',
  'question': 'fa6-solid:circle-question',
  
  // Success and error icons
  'success': 'fa6-solid:check',
  'error': 'fa6-solid:xmark',
  'warning': 'fa6-solid:triangle-exclamation',
  
  // Arrow icons
  'arrow-right': 'fa6-solid:arrow-right',
  'arrow-left': 'fa6-solid:arrow-left',
  'arrow-up': 'fa6-solid:arrow-up',
  'arrow-down': 'fa6-solid:arrow-down',
  
  // Plus and minus icons
  'plus': 'fa6-solid:plus',
  'add': 'fa6-solid:plus',
  'minus': 'fa6-solid:minus',
  'remove': 'fa6-solid:minus',
  
  // Edit and delete icons
  'edit': 'fa6-solid:pencil',
  'delete': 'fa6-solid:trash',
  
  // Technology and framework icons
  'react': 'fa6-brands:react',
  'typescript': 'fa6-brands:typescript',
  'node': 'fa6-brands:node-js',
  'python': 'fa6-brands:python',
  'rust': 'fa6-brands:rust',
  'go': 'fa6-brands:golang',
  'next': 'fa6-brands:next-js',
  'vue': 'fa6-brands:vue',
  'mongodb': 'fa6-brands:mongodb',
  'docker': 'fa6-brands:docker',
  'postgresql': 'fa6-brands:postgresql',
  'stripe': 'fa6-brands:stripe',
  'socketio': 'fa6-brands:socket-io',
  'tailwind': 'fa6-brands:tailwind-css',
  
  // Language icons
  'english': 'fa6-solid:flag-usa',
  'russian': 'fa6-solid:flag',
  'spanish': 'fa6-solid:flag',
  
  // Additional icons
  'camera': 'fa6-solid:camera',
  'travel': 'fa6-solid:plane',
  'book': 'fa6-solid:book',
  'ml': 'fa6-solid:brain',
  'circle': 'fa6-solid:circle',
};

/**
 * Maps a string token to an iconify icon string
 * @param token - The string token to map
 * @returns The iconify icon string, or null if not found
 */
export function mapIconToken(token: string): string | null {
  if (!token) return null;
  
  const normalizedToken = token.toLowerCase().trim();
  return ICON_MAP[normalizedToken] || null;
}

/**
 * Gets all available icon tokens
 * @returns Array of available icon tokens
 */
export function getAvailableIconTokens(): string[] {
  return Object.keys(ICON_MAP);
}

/**
 * Checks if a token is a valid icon token
 * @param token - The token to check
 * @returns True if the token is valid
 */
export function isValidIconToken(token: string): boolean {
  return mapIconToken(token) !== null;
}