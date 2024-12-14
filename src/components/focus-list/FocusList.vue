<template>
  <div class="page-container">
    <template v-if="!pageLoading">
      <list-settings-header 
        v-on:confirm-modal="($event) => (modals.confirmModal = $event)"
      />
      <v-container
        fluid
        v-for="list in store.lists"
        :key="list._id"
        :ref="
          (el) => {
            list.ref = el;
          }
        "
      >
        <v-row>
          <list-header
            :list="list"
            @list-update="handleListUpdate(...$event)"
            @add-stock="handleAddStock($event)"
            @import-list="handleImportList($event)"
          />
        </v-row>
        <!-- FEATURE add the simple list type -->
        <v-row>
          <v-col>
            <div
              class="table-container"
              :ref="(el) => (refsObject[list._id] = el)"
            >
              <table v-on="dragOverDefaults">
                <list-table-header :list="list" />
                <Sortable
                  :list="list.stocks"
                  :options="{ group: 'stocks' }"
                  itemKey="_id"
                  tag="tbody"
                  @remove="handleOnRemove(list._id, $event)"
                  @end="handleOnEnd(list._id, $event)"
                  @add="handleOnAdd(list._id, $event)"
                  @start="handleSortStart(list._id, $event)"
                >
                  <template #item="{ element, index }">
                    <focus-list-row
                      :element="element"
                      :index="index"
                      :list="list"
                      v-on:buy-sell-shares="handleBuySellShares($event)"
                      v-on:remove="handleRemove(...$event)"
                    />
                  </template>
                </Sortable>
              </table>
              <sticky-wrapper :parent="refsObject[list._id]">
                <multi-select-menu-wrapper :storeId="list._id">
                  <multi-select-menu
                    :list="list"
                    v-on:confirm-modal="
                      ($event) => (modals.confirmModal = $event)
                    "
                    v-on:close-confirm-modal="
                      () => (modals.confirmModal = false)
                    "
                  />
                </multi-select-menu-wrapper>
              </sticky-wrapper>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>
    <template v-else>
      <div class="lm-container">
        <div class="lm-row">
          <div class="lm-col">
            <v-progress-circular
              :size="50"
              color="var(--accent-two)"
              indeterminate
            ></v-progress-circular>
          </div>
        </div>
      </div>
    </template>
    <!-- #region modals -->
    <Modal
      :open="modals.overlay"
      v-on:close="handleModalClose('overlay')"
      class="center"
    >
      <simple-form>
        <AddStockForm
          :open="modals.overlay"
          v-on:close-modal="handleModalClose('overlay')"
          class="center"
        />
      </simple-form>
    </Modal>
    <Modal
      :open="modals.importList"
      v-on:close="handleModalClose('importList')"
      class="center"
    >
      <simple-form>
        <ImportListForm
          :open="modals.importList"
          v-on:close-modal="handleModalClose('importList')"
          class="center"
        />
      </simple-form>
    </Modal>
    <Modal
      :open="modals.confirmModal"
      v-on:close="handleModalClose('confirmModal')"
      class="center"
    >
      <confirmation-pop-up
        message="Are you sure you'd like to delete?"
        v-on:confirm="handleConfirm($event)"
        :action="modals.confirmModal"
        v-on:reject="handleModalClose('confirmModal')"
      />
    </Modal>
    <Modal
      :open="modals.buyForm"
      v-on:close="handleModalClose('buyForm')"
      class="center"
    >
      <simple-form>
        <BuySellStockForm
          :open="modals.buyForm"
          v-on:close-modal="handleModalClose('buyForm')"
        />
      </simple-form>
    </Modal>
    <Modal
      :open="modals.alreadyTrading"
      v-on:close="handleModalClose('alreadyTrading')"
      class="center"
    >
      <simple-form :set="(portfolios = globalStore.portfolios)">
        <h2>You're already trading this stock:</h2>
        <div class="lm-container" v-for="port in portfolios" :key="port._id">
          <template v-if="isTrading(port, modals.alreadyTrading)">
            <div
              class="lm-row"
              :set="(trade = getTrade(port, modals.alreadyTrading))"
            >
              <div class="lm-col">
                {{ trade.s }}
              </div>
              <div class="lm-col">
                {{ port.name }}
              </div>
              <div class="lm-col">
                {{ formatDate(trade.date) }}
              </div>
              <div class="lm-col">
                <v-btn
                  color="var(--accent-two)"
                  v-on:click="redirectToTrade(port, trade)"
                  >Buy / Sell</v-btn
                >
              </div>
            </div>
          </template>
        </div>
        <h2>Other Portfolios:</h2>
        <div class="lm-container" v-for="port in portfolios" :key="port._id">
          <template v-if="!isTrading(port, modals.alreadyTrading)">
            <div
              class="lm-row"
              :set="(symbol = getSymbol(port, modals.alreadyTrading))"
            >
              <div class="lm-col">
                {{ port.name }}
              </div>
              <div class="lm-col">
                <v-btn v-on:click="redirectToBuy(port, symbol)">Buy</v-btn>
              </div>
            </div>
          </template>
        </div>
      </simple-form>
    </Modal>
  </div>
</template>
  
<script>
import { ref, reactive, onMounted, watch } from "vue";

import { useRouter, useRoute } from "vue-router";
import ConfirmationPopUp from "../ui/pop-overs/ConfirmationPopUp.vue";
import AddStockForm from "/src/components/ui/forms/AddStockForm.vue";
import Modal from "../ui/modals/Modal.vue";
import { socket } from "./../../socket";
import { v4 as uuid } from "uuid";
import dragOverDefaults from "/src/utils/drag-over-defaults.js";
import BuySellStockForm from "./BuySellStockForm.vue";
import EditValue from "/src/components/ui/forms/EditValue.vue";
import { stockDb, tradesDb, listDb, globalValueDb } from "../../databases";
import { formatMoney, formatDate } from "../../utils/number-format";
import { useNotifications } from "/src/stores/notifications";
import { useFocusStore } from "/src/stores/focus-store";
import { useGlobalStore } from "/src/stores/global-store";
import { Sortable } from "sortablejs-vue3";
import SimpleForm from "/src/components/ui/forms/SimpleForm.vue";
import ImportListForm from "./ImportListForm.vue";
import StockPrice from "/src/components/ui/stocks/StockPrice.vue";
import ListMenu from "/src/components/focus-list/ListMenu.vue";
import ListHeader from "/src/components/focus-list/ListHeader.vue";
import ListTableHeader from "./ListTableHeader.vue";
import ListSettingsHeader from "./ListSettingsHeader.vue";
import FocusListRow from "./FocusListRow.vue";
import MultiSelectMenuWrapper from "../ui/pop-overs/MultiSelectMenuWrapper.vue";
import StickyWrapper from "/src/components/ui/pop-overs/StickyWrapper.vue";
import MultiSelectMenu from "./MultiSelectFocusMenu.vue";
import { makeList } from "../../core/models";

export default {
  components: {
    MultiSelectMenu,
    MultiSelectMenuWrapper,
    StickyWrapper,
    ListSettingsHeader,
    Sortable,
    ConfirmationPopUp,
    Modal,
    AddStockForm,
    BuySellStockForm,
    EditValue,
    SimpleForm,
    ImportListForm,
    StockPrice,
    ListMenu,
    ListHeader,
    ListTableHeader,
    FocusListRow,
  },
  setup(props, ctx) {
    const pageLoading = ref(false);
    const store = useFocusStore();
    const globalStore = useGlobalStore();
    const alreadyTrading = ref(false);
    const route = useRoute();
    const notification = useNotifications();
    //pop up multi select menu
    const refsObject = reactive({});
    function applyQuery(route) {
      Object.keys(modals).map((key) => {
        if (key === route.query.modal) return;
        modals[key] = false;
      });

      //do stuff
      if (route.query.modal === "buyForm" && !modals["buyForm"]) {
        //open buy modal
        handleBuySellShares(
          {
            s: route.query.ticker,
          },
          route.query.portfolio
        );
      } else if (
        route.query.modal === "alreadyTrading" &&
        !modals["alreadyTrading"]
      ) {
        handleBuySellShares({
          s: route.query.ticker,
        });
      } else if (route.query.modal === "importList" && !modals["importList"]) {
        const list = store.lists.find((lst) => lst._id === route.query.listId);
        modals.importList = { list: list };
      } else if (route.query.modal === "overlay" && !modals["overlay"]) {
        const list = store.lists.find((lst) => lst._id === route.query.listId);
        modals.overlay = { list: list };
      }
    }

    function checkModals() {
      if (route.query.modal) {
        Object.keys(modals).map((key) => {
          if (route.query.modal === key && !modals[key]) {
            //open
            // return;
            modals[key] = {
              ...route.query,
            };
          }
        });
      }
    }

    onMounted(() => {
      //handle route
      applyQuery(route);

      checkModals();

      getFocusList();

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

          // this will trigger if the action succeeds and after it has fully run.
          // it waits for any returned promised
          after((result) => {
            if (name !== "ignoreUpdate") {
              Object.keys(globalStore.stocks).map((key) => {
                const isOnList = store.lists.filter((list) => {
                  if (list.stocks.some((stk) => stk.s === key)) {
                    return true;
                  }
                }).length;

                if (!isOnList) {
                  globalStore.removeStock(key);
                }
              });
            }
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
    });

    watch(route, (newValue) => {
      applyQuery(newValue);
    });

    async function handleBuySellShares(stock, port = false) {
      const trades = await tradesDb.get({
        ticker: stock.s,
        exclude: "closed",
      });

      if (trades.length) {
        //if portfolio specified
        if (port) {
          //is not trading
          if (!isTrading(port, { trades })) {
            modals.buyForm = { ...stock, stock: true, portfolio: port };
            return;
          }
          //is trading
        }

        //if already trading
        router.push({
          query: {
            modal: "alreadyTrading",
            ticker: stock.s,
          },
        });

        modals.alreadyTrading = {
          trades,
        };
      } else {
        //not trading
        router.push({
          query: {
            ...stock,
            stock: true,
            modal: "buyForm",
          },
        });
        modals.buyForm = { ...stock, stock: true };
      }
    }

    /*-----------list sorting---------------*/

    let sortItem = null;
    let sortEvent = false;

    function handleSortStart(listId, event) {
      const list = store.lists.find((item) => listId === item._id);
      if (!list) return;
      sortEvent = true;
      sortItem = { ...list.stocks[event.oldIndex] };
    }
    async function handleOnEnd(listId, event) {
      if (event.to !== event.from) return;
      store.reorderList(listId, event.newIndex, event.oldIndex);
      await saveList(listId);

      notification.create({
        status: "success",
        message: "List order updated",
      });
    }
    function handleOnRemove(listId, event) {
      if (!sortEvent) {
        //FEATURE should restore element that wasn't successfully transfered
        console.log(listId, event.oldIndex, sortItem);
        return;
      }

      store.removeFromList(listId, event.oldIndex);
      saveList(listId);
    }
    async function handleOnAdd(listId, event) {
      const list = store.lists.find(({ _id }) => listId === _id);
      event.item.remove();
      if (list.stocks.some(({ s }) => sortItem.s === s)) {
        //get list from and return it
        sortEvent = false;
        notification.create({
          status: "error",
          message: "Already on list.",
        });
        return;
      }

      store.addToList(listId, event.newIndex, sortItem);

      await saveList(listId);

      notification.create({
        status: "success",
        message: "Item successfully moved",
      });
    }
    async function saveList(id) {
      try {
        const list = store.lists.find((item) => item._id === id);
        if (!list) return;
        const update = {
          ...list,
          stocks: list.stocks.map((item) => {
            return item.s;
          }),
        };

        await listDb.update(update);
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    const modals = reactive({
      overlay: false,
      importList: false,
      confirmModal: false,
      confirmAction: false,
      buyForm: false,
    });

    function handleAddStock(list) {
      router.push({
        ...route,
        query: {
          listId: list._id,
          modal: "overlay",
        },
      });
      modals.overlay = { list: list };
    }

    function handleImportList(list) {
      router.push({
        ...route,
        query: {
          listId: list._id,
          modal: "importList",
        },
      });
      modals.importList = { list: list };
    }

    async function handleListUpdate(key, value, list) {
      try {
        store.updateListValue(key, value, list._id);

        const updates = {
          ...list,
          stocks: list.stocks.map((el) => el.s),
        };

        updates[key] = value;

        await listDb.update(updates);

        notification.create({
          status: "success",
          message: "Name successfully updated",
        });
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    function removeStockFromList(list, stock) {
      return async () => {
        try {
          //remove from list
          store.removeFromListById(list._id, stock._id);
          await listDb.update(makeList(list));

          notification.create({
            status: "success",
            message: "Successfully removed " + stock.s,
          });
        } catch (err) {
          notification.create({
            status: "error",
            message: err,
          });
        }
      };
    }
    async function handleConfirm() {
      modals.confirmModal = false;
      modals.confirmAction = {};
    }

    async function getFocusList() {
      try {
        pageLoading.value = true;

        const request = await listDb.get();
        store.ignoreUpdate("setValue", ["lists", request]);

        for (const list of request) {
          //get live price updates on complex lists only
          if (list.type !== "complex") continue;
          for (const stock of list.stocks) {
            globalStore.addStock(stock.s, {
              s: stock.s,
              price: 0.0,
              priceMovement: "",
              priceUpdates: [],
            });
          }
        }

        pageLoading.value = false;
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    function handleModalClose(name) {
      modals[name] = false;
      router.push({
        hash: route.hash,
        query: {},
      });
    }

    function handleRemove(stock, list) {
      modals.confirmModal = {
        value: removeStockFromList(list, stock),
      };
    }

    const router = useRouter();

    function redirectToBuy(port, symbol) {
      router.push({
        ...route,
        query: {
          ticker: symbol,
          portfolio: port._id,
          modal: "buyForm",
        },
      });
    }

    function redirectToTrade(port, trade) {
      router.push({
        path: "/open",
        query: {
          portfolioId: port._id,
          tradeId: trade._id,
          buySell: true,
        },
      });
    }

    function getSymbol(port, { trades }) {
      return trades[0].s;
    }

    function isTrading(port, { trades }) {
      return trades.some(({ portfolios }) => portfolios.includes(port._id));
    }

    function getTrade(port, { trades }) {
      return trades.find(({ portfolios }) => portfolios.includes(port._id));
    }

    return {
      refsObject,
      modals,
      redirectToBuy,
      redirectToTrade,
      getSymbol,
      getTrade,
      isTrading,
      globalStore,
      pageLoading,
      dragOverDefaults,
      handleAddStock,
      handleListUpdate,
      handleSortStart,
      handleOnEnd,
      handleOnAdd,
      handleOnRemove,
      store,
      handleRemove,
      handleImportList,
      handleModalClose,
      formatDate,
      handleConfirm,
      uuid,
      handleBuySellShares,
      formatMoney,
      alreadyTrading,
    };
  },
};
</script>
  
<style scoped>
.table-container {
  overflow-x: auto;
  width: 100%;
}
span.ticker {
  margin-left: 15px;
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
:deep(.v-checkbox .v-input__details) {
  display: none;
}
</style>
  