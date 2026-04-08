import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import WeeklyTaskTracker from '../components/WeeklyTaskTracker.vue'
import TasksPage from '../views/TasksPage.vue'
import PurchasesPage from '../views/PurchasesPage.vue'

// Определение маршрутов приложения
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/weekly-tasks',
    name: 'weekly-tasks',
    component: WeeklyTaskTracker
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
  }
]

// Создание и экспорт роутера
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
