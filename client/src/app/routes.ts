import { createWebHistory, createRouter, type RouteRecordRaw } from "vue-router"

import { HomePage } from "../pages/home"
import { LoginPage } from "../pages/login"
import { NotFoundPage } from "../pages/not-found"
import { isAuthenticated } from "../shared/auth"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundPage,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { path: "/login" }
  }

  if (to.path === "/login" && isAuthenticated.value) {
    return "/"
  }
})

export { router }
