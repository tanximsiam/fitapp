import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

const config: CapacitorConfig = {
  appId: 'io.github.tanximsiam.fitapp',
  appName: 'FitApp',
  webDir: 'dist',
  plugins: {
    // Resize the content, not the whole webview, so focused fields stay above the keyboard.
    Keyboard: { resize: KeyboardResize.Ionic },
  },
}

export default config
