import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'

import VueSanitize from "vue-sanitize";

Vue.use(VueSanitize);

Vue.config.productionTip = false

Vue.prototype.$http = axios

new Vue({
  render: h => h(App),
}).$mount('#app')
