import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'NostrWallet',
  description: 'All-in-one Nostr identity signer for the web (NIP-07).',
  version: pkg.version,
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icons/icon-16.png',
      32: 'public/icons/icon-32.png',
    },
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage', 'alarms'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/inpage.ts'],
      world: 'MAIN',
      run_at: 'document_start',
      all_frames: true,
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/isolated.ts'],
      world: 'ISOLATED',
      run_at: 'document_start',
      all_frames: true,
    },
  ],
})
