import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Screening from '../views/Screening.vue'
import TokenList from '../views/TokenList.vue'
import DexscreenerList from '../views/DexscreenerList.vue'
import FomofamilyList from '../views/FomofamilyList.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/screening', name: 'screening', component: Screening },
  { path: '/token-list', name: 'token-list', component: TokenList },
  { path: '/dexscreener-list', name: 'dexscreener-list', component: DexscreenerList },
  { path: '/fomofamily-list', name: 'fomofamily-list', component: FomofamilyList }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router