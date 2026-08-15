import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CheckToken from '../views/CheckToken.vue'
import Screening from '../views/Screening.vue'
import ListToken from '../views/ListToken.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/check-token', name: 'check-token', component: CheckToken },
  { path: '/screening', name: 'screening', component: Screening },
  { path: '/list-token', name: 'list-token', component: ListToken }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router