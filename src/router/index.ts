import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import * as AuthUtils from '@/utils/Auth'

Vue.use(VueRouter)

const ROUTE_NAME_ABOUT = 'About'
const ROUTE_NAME_DEVICETEST = 'DeviceTest'
const ROUTE_NAME_TICKETS = 'Tickets'
const ROUTE_NAME_MAP = 'Map'
const ROUTE_NAME_AUTH = 'Auth'
const ROUTE_NAME_HOME = 'Home'

const SECURED_ROUTES = [ROUTE_NAME_HOME, ROUTE_NAME_MAP, ROUTE_NAME_TICKETS]

const routes: Array<RouteConfig> = [
  {
    path: '/:authId?/about',
    name: ROUTE_NAME_ABOUT,
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/:authId?/devicetest',
    name: ROUTE_NAME_DEVICETEST,
    // route level code-splitting
    // this generates a separate chunk (devicetest.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "devicetest" */ '../views/DeviceTest.vue')
  },
  {
    path: '/:authId?/tickets',
    name: ROUTE_NAME_TICKETS,
    // route level code-splitting
    // this generates a separate chunk (map.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "map" */ '../views/Tickets.vue')
  },
  {
    path: '/:authId?/map',
    name: ROUTE_NAME_MAP,
    // route level code-splitting
    // this generates a separate chunk (map.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "map" */ '../views/Map.vue')
  },
  {
    path: '/auth',
    name: ROUTE_NAME_AUTH,
    // route level code-splitting
    // this generates a separate chunk (auth.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "auth" */ '../views/Auth.vue')
  },
  {
    path: '/:authId?',
    name: ROUTE_NAME_HOME,
    component: Home
  }
]

const router = new VueRouter({
  routes
})

router.beforeEach((to: any, from: any, next) => {
  const token = AuthUtils.getTokenCookie()
  if (!token) {
    // User not signed in...
    const id = to.params?.authId
    if (id || SECURED_ROUTES.includes(to.name)) {
      // ...and log-in credentials (i.e. group key) has been supplied,
      // or current page requires that user is signed in.

      const newPath = to.fullPath
      next({
        path: '/auth',
        query: { newPath, id }
      })
      return
    }
  }

  next()
})

export default router
