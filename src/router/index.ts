import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import About from '../views/About.vue'
import DeviceTest from '../views/DeviceTest.vue'
import Tickets from '../views/Tickets.vue'
import Map from '../views/Map.vue'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/:authId?/about',
    name: 'About',
    component: About
  },
  {
    path: '/:authId?/devicetest',
    name: 'DeviceTest',
    component: DeviceTest
  },
  {
    path: '/:authId?/tickets',
    name: 'Tickets',
    component: Tickets
  },
  {
    path: '/:authId?/map',
    name: 'Map',
    component: Map
  },
  {
    path: '/:authId?',
    name: 'Home',
    component: Home
  }
]

const router = new VueRouter({
  routes
})

export default router
