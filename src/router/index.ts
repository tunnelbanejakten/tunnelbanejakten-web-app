import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import About from '../views/About.vue'
import DeviceTest from '../views/DeviceTest.vue'
import Tickets from '../views/Tickets.vue'
import Map from '../views/Map.vue'
import Duels from '../views/Duels.vue'
import Home from '../views/Home.vue'
import Settings from '../views/Settings.vue'
import Profile from '../views/Profile.vue'
import AnswerSingleQuestion from '../views/AnswerSingleQuestion.vue'
import AnswerMainPage from '../views/AnswerMainPage.vue'
import AnswerQuestionGroup from '../views/AnswerQuestionGroup.vue'
import Checkin from '../views/Checkin.vue'

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
    path: '/:authId?/duels',
    name: 'Duels',
    component: Duels
  },
  {
    path: '/:authId?/answers/question-group/:questionGroupId',
    name: 'AnswerQuestionGroup',
    component: AnswerQuestionGroup
  },
  {
    path: '/:authId?/answers/question/:questionId',
    name: 'AnswerQuestion',
    component: AnswerSingleQuestion
  },
  {
    path: '/:authId?/answers',
    name: 'Answer',
    component: AnswerMainPage
  },
  {
    path: '/:authId?/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/:authId?/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/:authId?/checkin/:stepNumber?',
    name: 'Checkin',
    component: Checkin
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
