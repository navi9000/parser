import { createWebHistory, createRouter, type RouteRecordRaw } from "vue-router"

import { HomePage } from "../pages/home"
import { LoginPage } from "../pages/login"
import { NotFoundPage } from "../pages/not-found"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundPage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
