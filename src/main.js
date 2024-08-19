//import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Vue3Sanitize from 'vue-3-sanitize'

const app = createApp(App)

app.use(VueAxios, axios)
app.use(Vue3Sanitize)

app.mount('#app')
