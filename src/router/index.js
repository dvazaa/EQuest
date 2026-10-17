import { createRouter, createWebHistory } from 'vue-router'
import TaskChoiceView from '../views/TaskChoiceView.vue'

const routes = [
    {
        path: '/',
        component: () => import('../views/HomeView.vue'),
    },
    {
        path: '/login',
        component: () => import('../views/LoginView.vue'),
    },
    {
        path: '/register',
        component: () => import('../views/RegisterView.vue'),
    },
    {
        path: '/upload',
        component: () => import('../views/UploadView.vue'),
    },
    {
        path: '/tasks',
        component: () => import('../views/TasksView.vue'),
    },
    {
        path: '/answer-upload',
        component: () => import('../views/AnswerUploadView.vue'),
    },
    {
        path: '/answer',
        component: () => import('../views/AnswerView.vue'),
    },
    {
        path: '/task-choice',
        component: TaskChoiceView,
    }
]

console.log('DAFTAR ROUTE:', routes.map(route => route.path))

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
    ]

    if (protectedPages.includes(to.path) && !isLoggedIn) {
        return '/login'
    }

    if (
        (to.path === '/login' || to.path === '/register') &&
        isLoggedIn
    ) {
        return '/'
    }
})

export default router