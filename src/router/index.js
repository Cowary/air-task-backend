import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import WeeklyTaskTracker from '../components/WeeklyTaskTracker.vue'
import TasksPage from '../views/TasksPage.vue'
import ProjectsPage from '../views/ProjectsPage.vue'
import WorkspacePage from '../views/WorkspacePage.vue'
import PurchasesPage from '../views/PurchasesPage.vue'
import RemindersPage from '../views/RemindersPage.vue'
import LoginPage from '../views/LoginPage.vue'
import { initAuth, useAuth } from '../store/auth'

initAuth()

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/workspace',
    name: 'workspace',
    component: WorkspacePage
  },
  {
    path: '/weekly-tasks',
    name: 'weekly-tasks',
    component: WeeklyTaskTracker
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsPage
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: TasksPage
  },
  {
    path: '/purchases',
    name: 'purchases',
    component: PurchasesPage
  },
  {
    path: '/reminders',
    name: 'reminders',
    component: RemindersPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  if (to.name !== 'login' && !auth.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
