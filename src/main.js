import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as labsComponents from 'vuetify/labs/components'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import Dashboard from './components/dashboard/Dashboard.vue'
import FocusList from './components/focus-list/FocusList.vue'
import OpenTrades from './components/open-trades/OpenTrades.vue'
import ClosedTrades from './components/closed-trades/ClosedTrades.vue'
import DesignPage from './components/admin/DesignPage.vue'
import Portfolios from './components/portfolios/Portfolios.vue'
import Order from './components/orders/Order.vue'
import OrderSingle from './components/orders/OrderSingle.vue'
import ImportPage from './components/import/ImportPage.vue'
import Database from './components/database/Database.vue'
import Routes from './components/routes/Routes.vue'
const darkTheme = {
    dark: true,
    colors: {
        background: '#0e1525',
        tooltip: '#8a59ff',
        surface: "#1c2333",
        primary: '#6200EE',
        // 'primary-darken-1': '#3700B3',
        // secondary: '#03DAC6',
        // 'secondary-darken-1': '#018786',
        // error: '#B00020',
        // info: '#2196F3',
        // success: '#4CAF50',
        // warning: '#FB8C00',
    },
}

const vuetify = createVuetify({
    components: {
        ...components,
        ...labsComponents
    },
    directives,
    theme: {
        defaultTheme: 'darkTheme',
        themes: {
            darkTheme
        }

    }
})

const pinia = createPinia();
const app = createApp(App);

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/import',
            component: ImportPage
        },
        {
            path: '/routes',
            component: Routes
        },
        {
            path: '/orders',
            component: Order,
        },
        {
            path: '/orders/:id',
            component: OrderSingle,
        },
        // Define your routes here
        {
            path: '/',
            component: Dashboard, // default child path
        },
        {
            // UserProfile will be rendered inside User's <router-view>
            // when /user/:id/profile is matched
            path: '/focus-list',
            component: FocusList,
        },
        {
            // UserPosts will be rendered inside User's <router-view>
            // when /user/:id/posts is matched
            path: '/open-trades',
            component: OpenTrades,
        },
        {
            // UserPosts will be rendered inside User's <router-view>
            // when /user/:id/posts is matched
            path: '/closed-trades',
            component: ClosedTrades,
        },
        {
            path: '/portfolios',
            component: Portfolios
        },
        {
            path: '/email-signups'
        },
        {
            // UserPosts will be rendered inside User's <router-view>
            // when /user/:id/posts is matched
            path: '/design',
            component: DesignPage,
        },
        {
            path: '/database',
            component: Database
        },
    ],
});

app.use(router);
app.use(pinia);
app.use(vuetify)

console.log(app);

app.mount('#app');