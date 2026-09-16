import { createApp } from 'vue'
import '@fontsource/exo-2/cyrillic-400.css'
import '@fontsource/exo-2/cyrillic-500.css'
import '@fontsource/exo-2/cyrillic-600.css'
import '@fontsource/exo-2/cyrillic-700.css'
import '@fontsource/exo-2/latin-400.css'
import '@fontsource/exo-2/latin-500.css'
import '@fontsource/exo-2/latin-600.css'
import '@fontsource/exo-2/latin-700.css'
import '@fontsource/jetbrains-mono/cyrillic-400.css'
import '@fontsource/jetbrains-mono/cyrillic-500.css'
import '@fontsource/jetbrains-mono/cyrillic-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import './style.css'
import App from './App.vue'
import AppIcon from './components/AppIcon.vue'
import router from './router'

const app = createApp(App)

app.component('AppIcon', AppIcon)
app.use(router)
app.mount('#app')
