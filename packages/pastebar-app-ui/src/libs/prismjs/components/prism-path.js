Prism.languages.path = {
  slash: {
    pattern: /[\/\\]/,
    alias: 'cdata',
  },
  property: {
    pattern: /[\w\s-]+(?=[\/\\])/,
    lookbehind: true,
    greedy: true,
    alias: 'folder',
  },
  string: {
    pattern:
      /\.(html|css|js|ts|json|md|svg|png|jpg|gif|woff2|exe|com|app|sh|bat|rs|txt|docx|xlsx|pptx|pdf|psd|mp3|mp4|avi|mov|mkv|flac|wav|ai|eps|zip|rar|7z|tar\.gz|deb|pkg|dmg)$/,
    inside: {
      punctuation: /^\./,
    },
    alias: 'extension',
  },
  selector: {
    pattern: /[\w\s\-\(\)]+(?=\.[\w-]+$|$)/,
    lookbehind: true,
    greedy: true,
    alias: 'filename',
  },
}
