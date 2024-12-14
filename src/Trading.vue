<template>
  <div
    class="page-container"
    ref="containerRef"
    :class="{ privacy: privacyMode }"
  >
    <div class="simple-header">
      <v-container-fluid>
        <v-row>
          <v-col lg="4" sm="12" xs="8" class="branding">
            <img src="/icon.svg" />
            <h1>Welcome, {{ user.user.firstName }}!</h1>
          </v-col>
          <v-col lg="8" sm="12" xs="4" class="nav-col">
            <mobile-nav class="show-tablet" />
            <div class="desktop-nav header-tabs-menu">
              <div>
                <toggle-switch
                  :modelValue="privacyMode"
                  @update:modelValue="($event) => (privacyMode = $event)"
                ></toggle-switch>
              </div>
              <router-link to="/focus-list" :class="isActive('watching')"
                >Focus List</router-link
              >
              <router-link to="/open" :class="isActive('active')"
                >Open</router-link
              >
              <router-link to="/closed" :class="isActive('closed')"
                >Closed</router-link
              >
              <!-- <router-link to="/design" :class="isActive('closed')"
                >Design</router-link
              > -->
              <user-menu />
            </div>
            
            <!-- <a href="#portfolios" :class="isActive('portfolios')">Portfolios</a> -->
          </v-col>
        </v-row>
      </v-container-fluid>
    </div>
    <div class="page-body">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch, defineComponent, h } from "vue";
import { useRoute } from "vue-router";

import FocusList from "./trading/FocusList.vue";
import ActiveList from "./trading/ActiveList.vue";

import Socket from "./Socket.vue";

import Portfolios from "./trading/Portfolios.vue";
import ImportCSV from "./trading/ImportCSV.vue";
import ImportCSV2 from "./trading/ImportCSV2.vue";
import { socket } from "../socket";
import { useTradingStore } from "../stores/trading-store";
import { useGlobalStore } from "../stores/global-store";
import { useNotifications } from "../stores/notifications";
import UserMenu from "./trading/UserMenu.vue";
import { useUserStore } from "../stores/user-store";

import { portfolioDb, balanceDb, globalValueDb } from "../databases";
import ToggleSwitch from "./trading/ToggleSwitch.vue";
import MobileNav from "./trading/MobileNav.vue";

export default {
  components: {
    MobileNav,
    FocusList,
    Socket,
    ActiveList,
    Portfolios,
    ImportCSV,
    ImportCSV2,
    UserMenu,
    ToggleSwitch,
  },
  setup() {
    const store = useTradingStore();
    const route = useRoute();
    const tab = ref("watching");
    const globalStore = useGlobalStore();
    const notification = useNotifications();
    const privacyMode = ref(false);
    const user = useUserStore();

    watch(privacyMode, (value) => {
      document.cookie = "privacyMode=" + value;
    });

    socket.on("price-update", (args) => {
      // console.log(args, "price-update")

      if (!args?.[0]?.length) return;

      for (const update of args[0]) {
        globalStore.addStockPriceUpdate(update);

        const stock = globalStore.stocks[update.symbol];

        if (!stock) continue;

        if (stock.status === "false") continue;

        const updates = {};

        if (update.price) updates.price = parseFloat(update.price.toFixed(2));
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

    const containerRef = ref(null);

    function getCookie(cname) {
      let name = cname + "=";
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }

    onMounted(async () => {
      try {
        const privacy = getCookie("privacyMode");
        if (privacy === "true") privacyMode.value = true;

        console.log(route, "routing");
        console.log(route.query, "routing");
        if (route.hash) {
          console.log(parseHash(route.hash), "hash!!!");
          tab.value = parseHash(route.hash);
        }
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

        console.log(globalValuesObject, "global values");

        globalStore.setValue("data", globalValuesObject);
      } catch (err) {
        notification.create({
          message: err,
          status: "error",
        });
      }
    });

    function parseHash(hash) {
      console.log(hash.split("?"));
      return hash.split("?")[0].split("#")[1];
    }

    watch(route, () => {
      if (route.hash) {
        tab.value = parseHash(route.hash);
      } else {
        tab.value = "";
      }
    });

    function isActive(value) {
      if (tab.value === value) return "active";
      else return false;
    }

    const unsubscribe = store.$onAction(
      ({
        name, // name of the action
        store, // store instance, same as `someStore`
        args, // array of parameters passed to the action
        after, // hook after the action returns or resolves
        onError, // hook if the action throws or rejects
      }) => {
        // a shared variable for this specific action call
        const startTime = Date.now();
        // this will trigger before an action on `store` is executed
        console.log(`Start "${name}" with params [${args.join(", ")}].`);

        // this will trigger if the action succeeds and after it has fully run.
        // it waits for any returned promised
        after(() => {
          if (name === "socketUpdate") return;
          socket.emit("action", [name, args]);
        });

        // this will trigger if the action throws or returns a promise that rejects
        onError((error) => {
          console.warn(
            `Failed "${name}" after ${
              Date.now() - startTime
            }ms.\nError: ${error}.`
          );
        });
      }
    );

    socket.on("action", (data) => {
      store.socketUpdate(data[0], data[1]);
    });

    return {
      user,
      containerRef,
      tab,
      isActive,
      privacyMode,
    };
  },
};
</script>

<style>
.table-container {
  overflow-x: auto;
  width: 100%;
}

.v-card {
  height: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-flow: column;
  /* max-width: 700px; */
}

.v-card h3 {
  font-family: "Open Sans";
  font-weight: 500;
  font-size: 17px;
  color: #9c9eaf;
}
.v-card {
  padding: 10px;
  border-color: #475369 !important;
}
.v-card h3 {
  font-family: "Open Sans";
  font-weight: 500;
  font-size: 17px;
  color: #9264ff;
}

.v-card.v-theme--darkTheme.v-card--density-default.v-card--variant-elevated {
  padding: 20px 20px;
}
</style>
<style scoped>
.simple-header .lm-row {
  align-items: center;
}

.simple-header .header-tabs-menu {
  justify-content: flex-end;
}

h1 {
  text-align: left;
}

.page-container {
  position: relative;
  width: 100%;
  padding: 20px;
  padding-left: 100px;
}

.header {
  padding: 100px 50px;
  font-size: 20px;
  background: #7444c4;
  background-image: linear-gradient(13deg, #070743 0%, #7941ff 100%);
}

.header .title-section {
  text-align: left;
  align-items: center;
  display: flex;
}

.page-body {
  width: 100%;
  margin-bottom: 400px;
  gap: 30px;
  display: flex;
  flex-flow: column;
}

.header-tabs-menu {
  width: 100%;
  display: flex;
  gap: 50px;
  align-items: center;
  justify-content: center;
}

.header-tabs-menu a {
  list-style-type: none;
  padding: 20px;
  font-family: "Open Sans";
  font-size: 20px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f0f0f0;
}

.amount {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.amount .number {
  z-index: 1;
  font-family: "Open Sans";
  font-weight: 600;
  font-size: 45px;
  line-height: 60px;
  color: #e0e0e0;
}

.v-card .v-icon {
  font-size: 78px;
  color: rgb(61 73 147 / 47%);
  background: -webkit-linear-gradient(#9a6ee9, #8914ca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.v-card {
  background: var(--block-background-color);
}

i {
  margin-bottom: -10px;
}

a.router-link-active {
  border-bottom: solid;
  border-color: var(--accent-two);
}

.simple-header .v-col {
  align-items: center;
  display: flex;
}
h1 {
  display: flex;
  align-items: center;
}
h1 img {
  display: block;
  width: 100%;
  max-width: 500px;
}

.nav-col {
  display: flex;
  justify-content: space-between;
}
.branding {
  gap: 20px;
}
.branding img {
  width: 65px;
  height: auto;
}
.simple-header {
  margin: 20px 0px;
}

.show-tablet {
  display: none;
}

@media only screen and (max-width: 1279px) {
  .simple-header .header-tabs-menu {
    justify-content: center;
  }
}
@media only screen and (max-width: 872px) {
  .simple-header .header-tabs-menu {
    display: none;
  }
  .show-tablet {
    display: initial;
  }
}
</style>
