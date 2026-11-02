import { createRouter, createWebHistory } from 'vue-router'
import TaskChoiceView from '../views/TaskChoiceView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('../views/UploadView.vue'),
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/TasksView.vue'),
  },
  {
    path: '/answer-upload',
    name: 'AnswerUpload',
    component: () => import('../views/AnswerUploadView.vue'),
  },
  {
    path: '/answer',
    name: 'Answer',
    component: () => import('../views/AnswerView.vue'),
  },
  {
    path: '/task-choice',
    name: 'TaskChoice',
    component: TaskChoiceView,
  },
  {
    path: '/blind-box',
    name: 'BlindBox',
    component: () => import('../views/BlindBoxView.vue'),
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('../views/ProgressView.vue'),
  },
  {
    path: '/riwayat',
    name: 'Riwayat',
    component: () => import('../views/HistoryView.vue'),
  },
  {
    path: '/history',
    redirect: '/riwayat',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const isLoggedIn = localStorage.getItem('equestUser')

  const protectedPages = [
    '/upload',
    '/tasks',
    '/answer-upload',
    '/answer',
    '/task-choice',
    '/blind-box',
    '/progress',
    '/riwayat',
  ]

  if (protectedPages.includes(to.path) && !isLoggedIn) {
    return '/login'
  }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return '/'
  }
})

export default router
