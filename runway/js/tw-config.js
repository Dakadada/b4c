// Shared Tailwind Play CDN config — load immediately after the CDN script.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        porcelain: '#F5F4F0',
        ink: '#1B1A17',
        pewter: '#C9C7BE',
        garnet: '#7C2136',
        pearl: '#EDEAE3',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
};
