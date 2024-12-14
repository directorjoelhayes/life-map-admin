<script>
import { useNotifications } from "./stores/notifications";
import { mount } from "./databases";
import TradingView from "./components/trading-view/TradingView.vue";
import { ref, onBeforeMount, onMounted } from "vue";
import UserLogin from "./components/user/UserLogin.vue";
import { useUserStore } from "./stores/user-store.js";
import { userDb, portfolioDb, balanceDb, globalValueDb } from "./databases";
import LoadingCircle from "./components/ui/loading/LoadingCircle.vue";
import getCookie from "/src/utils/get-cookie.js";
import setCookie from "/src/utils/set-cookie.js";
import { useGlobalStore } from "./stores/global-store";
import { socket } from "./socket";
import Notification from './components/ui/notifications/Notification.vue';

export default {
  components: {
    TradingView,
    UserLogin,
    LoadingCircle,
    Notification,
  },
  setup() {
    const isMobile = ref(false);
    const userStore = useUserStore();
    const globalStore = useGlobalStore();
    const notifications = useNotifications();
    mount(notifications);

    const oauth = ref(false);

    const loading = ref(true);

    const deleteCookie = (name) => {
      setCookie(name, "", -1);
    };

    onBeforeMount(async () => {
      if (!getCookie("token")) {
        loading.value = false;
        return;
      }

      try {
        const [{ user }, { refreshTokenExpired }] = await Promise.all([
          userDb.auth(),
          userDb.getRefreshTokenStatus()
        ]);

        userStore.setValue("user", user);
        oauth.value = refreshTokenExpired;

        // console.log(refreshTokenExpired, "expired?");
        // console.log(oauth.value, "oauth");
      } catch (err) {
        console.error("Authentication error:", err);
      } finally {
        loading.value = false;
      }
    });

    onMounted(async () => {
      try {
        const privacy = getCookie("privacyMode");
        if (privacy === "true") privacyMode.value = true;

        const portfolios = await portfolioDb.get();
        const balances = await balanceDb.get();

        globalStore.setValue(
          "balances",
          balances.sort((a, b) => b.date - a.date)
        );
        globalStore.setValue("portfolios", portfolios);

        const globalValues = await globalValueDb.get();

        const globalValuesObject = globalValues.reduce((obj, val) => {
          obj[val.key] = val;
          return obj;
        }, {});

        globalStore.setValue("data", globalValuesObject);

        socket.on("price-update", (args) => {
          // console.log(args, "price-update")

          if (!args?.[0]?.length) return;

          for (const update of args[0]) {
            globalStore.addStockPriceUpdate(update);

            const stock = globalStore.stocks[update.symbol];

            if (!stock) continue;

            if (stock.status === "false") continue;

            const updates = {};

            if (update.price)
              updates.price = parseFloat(update.price.toFixed(2));
            else updates.price = 0;

            if (stock.price === updates.price) {
              continue;
            } else if (stock.price < updates.price) {
              updates.priceMovement = "green";
            } else if (stock.price > updates.price) {
              updates.priceMovement = "red";
            }

            globalStore.socketUpdate("updateStock", [stock.s, updates]);
          }
        });
      } catch (err) {
        notifications.create({
          message: err,
          status: "error",
        });
      }
    });

    const appContainerRef = ref(null);
    const snackbar = ref(true);

    /**
     * Returns the corresponding icon name based on the status value.
     *
     * @param {string} value - The status value which can be either "success" or "error".
     * @returns {string} - The icon name corresponding to the status value.
     */
    function getIconFromStatus(value) {
      if (value === "success") return "mdi-check-circle-outline";
      if (value === "error") return "mdi-alpha-x-circle-outline";
    }

    const drawer = ref(false);
    const items = ref([
      {
        title: "Dashboard",
        url: "/",
        icon: "mdi-home",
      },
      {
        title: "Notes",
        url: "/notes",
        icon: "mdi-note-edit",
      },      
      {
        title: "Import",
        url: "/import",
        icon: "mdi-import",
      },
      {
        title: "Databases",
        url: "/database",
        icon: "mdi-database",
      },
      {
        title: "Routes",
        url: "/routes",
        icon: "mdi-map-marker",
      },
      {
        title: "Settings",
        url: "/settings",
        icon: "mdi-cog",
      },
    ]);

    return {
      oauth,
      drawer,
      items,
      getIconFromStatus,
      appContainerRef,
      isMobile,
      snackbar,
      notifications,
      userStore,
      loading,
      deleteCookie,
    };
  },
};
</script>

<template>
  <loading v-if="loading" />
  <div v-else-if="userStore.user">
    <v-alert
      class="v-alert"
      border="top"
      type="warning"
      variant="outlined"
      prominent
      v-if="oauth"
    >
      <div>
        Your Charles Schwab account is not connected. Please reconnect your
        account.
      </div>
      <a
        href="https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=tbTCcOtsWiBIq3mx2GGAaaxjkrrMxdGH&scope=readonly&redirect_uri=https://mindfultrading.io/oauth/schwab"
        >Login to account</a
      >
    </v-alert>
    <div class="app-container" ref="appContainerRef">
      <div class="side-bar-nav">
        <div class="fixed">
          <ul class="menu-items">
            <li class="nav-item" v-for="item in items" :key="item.url">
              <router-link :to="item.url"
                ><v-icon>{{ item.icon }}</v-icon
                ><span>{{ item.title }}</span></router-link
              >
            </li>
          </ul>
        </div>
      </div>
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
  </div>
  <div v-else>
    <div>
      <user-login />
    </div>
  </div>
  <div class="notifications">
    <transition-group name="list">
      <div
        class="notification"
        :class="item.status"
        v-for="item of notifications.items"
        :key="item.id"
      >
        <notification :item="item" />
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.side-bar-nav {
  position: relative;
  flex-basis: var(--menu-width);
  flex-grow: 0;
  flex-shrink: 0;
  min-height: 100vh;
}
.fixed {
  position: fixed;
  width: var(--menu-width);
}
.side-bar-nav {
  background-color: rgb(var(--v-theme-surface));
}
ul.menu-items {
  display: flex;
  flex-flow: column;
  width: 100%;
  padding: 20px;
}
.v-alert a {
  text-align: center;
  display: block;
}

.menu-items a:hover,
.menu-items a.router-link-active.router-link-exact-active {
  background: #2b354a;
  color: #ffffff;
}

ul.menu-items {
  display: flex;
  flex-flow: column;
  width: 100%;
  padding: 20px;
  gap: 10px;
}

.menu-items li {
  flex: 1;
  font-family: "Open Sans";
  font-size: 1.1em;
  list-style-type: none;
}

.menu-items li i {
  background: linear-gradient(
    0deg,
    rgb(121 39 255) 0%,
    rgb(132 84 255) 41%,
    rgb(121 132 255) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.menu-items a {
  border-radius: 10px;
  position: relative;
  color: #f1f1f1;
  display: flex;
  padding: 15px;
  transition: all 300ms ease;
}
.menu-items a > * {
  position: relative;
  z-index: 1;
}
</style>

<style>
.page-container {
  padding: 30px;
  margin-bottom: 150px;
  display: flex;
  position: relative;
  overflow-x: hidden;
  width: 100%;
  flex-flow: column;
}
.page-container.window-height {
  min-height: 100vh;
  height: 100%;
  margin-bottom: 0px;
}
.page-header {
  text-align: left;
}
/* Define the transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.table-container {
  flex-grow: 1; /* This allows the container to expand to fill available space */
  overflow-x: auto;
}
.table-container table {
  width: 100%; /* Makes the table take the full width of the container */
  min-width: 100%; /* Ensures the table doesn't shrink below its container's width */
  border-collapse: collapse; /* Optional: For better table appearance */
}
.ticker a {
  display: inline-block;
  vertical-align: middle;
}
.ticker button {
  margin-right: 10px;
}
table td {
  white-space: nowrap;
}

.loading-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Chrome, Edge, and Safari */
*::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
*::-webkit-scrollbar-track {
  background: #11151d00;
}
*::-webkit-scrollbar-thumb {
  background-color: #2b3448;
  border-radius: 10px;
}
*::-webkit-scrollbar-corner {
  background: rgba(32, 32, 39, 0);
}

.privacy .private span {
  display: none;
}

.privacy .private::after {
  content: "●●●●●";
  color: #2a3242;
}

.privacy .hide-private {
  display: none !important;
}

.privacy .disable-private {
  pointer-events: none;
}

:root,
:root.light {
  --bg-color: #fff;
  --point-color: #767676;
  --text-color: #123;
}

:root.dark {
  --menu-width: 275px;
  color: #eae7e7;
  --bg-color: #0e1525;
  --border-color: #475369;
  --bg-light-color: #242a3c;
  --bg-lighter-color: #3c445c;
  --secondary-text-color: #9faecc;
  --block-background-color: #1c2333;
  --bg-vibrant-color: #413992;
  --point-color: #544b6c;
  --accent-one: #5323ff;
  --default-outline-color: rgb(116 123 175 / 63%);
  --gradient: linear-gradient(13deg, #4a1bcd 0%, #aa33f3 100%);
  --gradient-button: linear-gradient(
    53deg,
    rgba(138, 89, 255, 1) 20%,
    rgb(81 112 219) 100%
  );
  --gradient-two: linear-gradient(13deg, #cb8585 0%, #9e19de 100%);
  --gradient-three: linear-gradient(13deg, #8021c0 0%, #12bdcb 100%);
  --accent-one-trans: rgba(249, 169, 94, 0.109);
  --accent-two: #8a59ff;
  --accent-two-trans: rgba(200, 94, 249, 0.103);
  --accent-three: #5eaff9;
  --accent-three-trans: rgba(94, 174, 249, 0.082);
  --success: #5ef980;
  --accent-color-trans: hsla(133, 93%, 67%, 0.084);
  --text-color: #f5f5f5;
  --warning: rgb(227, 31, 31);
}

.button-row {
  gap: 20px;
}

button.v-btn {
  font-family: "Open Sans";
  font-weight: 600;
}

/* Ripple effect */
.ripple {
  background-position: center;
  transition: background 0.8s;
}
.ripple:hover {
  background: #2a3242 radial-gradient(circle, transparent 1%, #2a3242 1%)
    center/15000%;
}
.ripple:active {
  background-color: rgb(89, 98, 118);
  background-size: 100%;
  transition: background 0s;
}

.simple-form {
  max-width: 1200px;
  position: relative;
  background-color: var(--bg-color);
  border-radius: 10px;
  padding: 20px;
  border-style: solid;
  border-width: 1px;
  border-color: var(--border-color);
}

/* v-list defaults */

.v-list i {
  color: #9d7ceb;
}
.v-list-item-title {
  gap: 20px;
  font-weight: 500;
  font-family: "Open Sans";
}

/* table styles */
table {
  text-align: left;
  font-family: "Open Sans";
  /* table-layout: fixed; */
  width: 100%;
}

table tr td {
  background-color: #182031;
}
table tr {
  border-bottom: solid;
  border-width: 1px;
  border-color: #2a3242;
}

table tr:last-child {
  border-bottom: none;
}
thead tr td,
tfoot tr td {
  background-color: #2a3242;
  padding: 10px;
  font-family: "Open Sans";
}

tbody td {
  padding: 10px;
  background-color: var(--block-background-color);
  transition: background-color 300ms ease;
}

thead td {
  background-color: #2a3242;
  padding: 10px;
  font-family: "Open Sans";
}

tbody td {
  padding: 10px;
  background-color: var(--block-background-color);
  transition: background-color 300ms ease;
}
td.cost > div {
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 15px;
}

td.cost .label {
  font-size: 12px;
  color: var(--secondary-text-color);
  opacity: 0.75;
}

li i {
  font-size: 27px;
}

.align-left {
  text-align: left;
}

a {
  display: flex;
  text-decoration: none;
  gap: 10px;
  color: #ffffff;
}

a:hover {
  color: #8a59ff;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /* color: #2c3e50; */
  margin-top: 0px;
  background-color: var(--bg-color);
}

.pill.red {
  color: #ff9b9b;
  background-color: #561733;
}
.pill.green {
  background-color: #114c3c;
  color: #0bf47d;
}
.pill {
  font-family: "Open Sans";
  padding: 5px 10px;
  border-radius: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.pill.purple {
  color: #d3c0ff;
  background-color: #4d28a7;
}
.pill.yellow {
  color: #fffca9;
  background-color: #aa9500;
}
.pill i {
  font-size: 15px;
}

body {
  margin: 0px;
  min-height: 100vh;
}

.block-container {
  position: relative;
  min-height: 100vh;
  flex: 1;
  display: flex;
  flex-flow: column;
  overflow-x: hidden;
}

.header {
  padding: 120px;
  color: #ffffff;
  position: relative;
  z-index: 1;
  background: #7444c4;
  background-image: linear-gradient(13deg, #1b64b0 0%, #a712cb 100%);
  border-radius: 20px;
}

.header .title,
.page-container > .header {
  font-size: 60px;
  font-family: "Open Sans";
  font-weight: 100;
}

h1 {
  font-family: "Open Sans";
  font-weight: 300;
  font-size: 52px;
}

h2,
.heading input {
  font-size: 30px;
  font-family: "Open Sans";
  font-weight: 100;
}

h3 {
  font-family: "Open Sans";
  font-weight: 500;
  font-size: 20px;
}

.app-container {
  display: flex;
}
.side-menu li.active {
  color: #8a59ff;
}

ul.menu-items {
  width: 100%;
  padding: 0px;
}

body {
  background-color: var(--bg-color);
}

body.disable-scroll {
  overflow: hidden;
  margin-right: 16px;
}

h2.title {
  font-weight: 500;
  font-size: 25px;
}

.notifications {
  position: fixed;
  z-index: 999999;
  right: 0px;
  top: 0px;
  display: flex;
  flex-flow: column;
  gap: 10px;
  padding: 20px;
  pointer-events: none;
}

.notification {
  pointer-events: all;
  border-radius: 10px;
  padding: 8px;
  background-color: var(--block-background-color);
  font-family: "Open Sans";
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 10px #00000061;
}

.notification.success {
  background-color: #13a263;
}

.notification.error {
  background-color: #a21347;
}

.notifications .content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.list-move,
/* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}
</style>
