<template>
  <div class="page-container">
    <template v-if="!loading">
      <v-container
        fluid
        class="strategy-container"
      >
        <template v-if="trades.length === 0 && !portfolio">
          <loading-page :strat="portfolio" />
        </template>
        <template v-else>
          <v-row>
            <v-col class="strategy-head">
              <h2>Main Portfolio</h2>
              <!-- <p>
                {{ strat.description }}
                <template v-if="strat.description">|</template>
                <span
                  v-for="(portfolioId, index) of strat.portfolios"
                  :key="portfolioId"
                >
                  <template v-if="index !== 0">, </template>
                  {{ store.getPortfolioName(portfolioId) }}
                </span>
              </p> -->
            </v-col>
          </v-row>

          <!-- <open-trades-stats :strat="portfolio" /> -->

          <v-row>
            <v-col class="table-header">
              <v-btn
                size="large"
                variant="outlined"
                :id="'menu-activator-' + portfolio._id"
              >
                Add Trades
              </v-btn>
              <v-menu :activator="'#menu-activator-' + portfolio._id">
                <v-list>
                  <v-list-item
                    @click="handleAddTrade(portfolio)"
                    :key="1"
                    :value="1"
                  >
                    <v-list-item-title>Add Trade</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    @click="handleImportTrades(portfolio)"
                    :key="2"
                    :value="2"
                  >
                    <v-list-item-title>Import Trades</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>
          </v-row>
          <div
            class="table-container"
            :ref="(el) => (refsObject[portfolio._id] = el)"
          >
            <table v-if="!loading">
              <thead>
                <!-- {{ portfolio }} -->
                <open-trades-table-header :strat="portfolio" />
              </thead>
              <tbody>
                <open-trades-row
                  v-for="trade in trades"
                  :trade="trade"
                  :key="trade._id"
                  :strat="portfolio"
                  v-on:handle-edit="handleEdit(...$event)"
                  v-on:handle-remove="handleRemove"
                  v-on:trade-update="($event) => handleTradeUpdate(...$event)"
                  v-on:open-date-update="
                    ($event) => handleOpenDateUpdate(...$event)
                  "
                />
              </tbody>
            </table>
            <!-- <sticky-wrapper :parent="refsObject[portfolio._id]">
              <multi-select-menu-wrapper :storeId="portfolio._id">
                <multi-select-menu
                  :strat="portfolio"
                  v-on:confirm-modal="($event) => (modals.confirmModal = $event)"
                  v-on:close-confirm-modal="() => (modals.confirmModal = false)"
                />
              </multi-select-menu-wrapper>
            </sticky-wrapper> -->
          </div>
        </template>
      </v-container>
    </template>
    <template v-else>
      <loading-page />
    </template>
    <Modal :open="modals.overlay" v-on:close="handleModalClose('overlay')">
      <OpenTradeModal
        :open="modals.overlay"
        v-on:close-modal="handleModalClose('overlay')"
        v-on:order-delete="handleOrderDelete"
      />
    </Modal>
    <Modal
      :open="modals.importTrades"
      v-on:close="handleModalClose('importTrades')"
    >
      <simple-form>
        <import-orders-form
          :open="modals.importTrades"
          v-on:import="handleImport(event, importTrades)"
          v-on:close-modal="handleModalClose('importTrades')"
        />
      </simple-form>
    </Modal>
    <Modal :open="modals.addTrade" v-on:close="handleModalClose('addTrade')">
      <!-- //FEATURE add an option to lock values such as Buy / Sell -->
      <simple-form>
        <buy-sell-stock-form
          :open="modals.addTrade"
          v-on:close-modal="handleModalClose('addTrade')"
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
        v-on:confirm="handleModalClose('confirmModal')"
        :action="modals.confirmModal"
        v-on:reject="handleModalClose('confirmModal')"
      />
    </Modal>
  </div>
</template>
  
<script>
import ConfirmationPopUp from "/src/components/ui/pop-overs/ConfirmationPopUp.vue";
import AddStockForm from "/src/components/ui/forms/AddStockForm.vue";
import Modal from "/src/components/ui/modals/Modal.vue";
import { ref, reactive, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import "@vuepic/vue-datepicker/dist/main.css";
import { formatMoney, formatDate } from "/src/utils/number-format";
import {
  tradesDb,
  strategyDb,
  orderDb,
  portfolioDb,
  globalValueDb,
  stockDb,
} from "../../databases";
import EditValue from "/src/components/ui/forms/EditValue.vue";
import OpenTradeModal from "./OpenTradeModal.vue";
import { useOpenTrades } from "/src/stores/open-trades";
import { useGlobalStore } from "/src/stores/global-store";
import { useNotifications } from "/src/stores/notifications";
import CalendarIcon from "/src/components/ui/icons/CalendarIcon.vue";
import { getSummary, ordersToTradeGroups } from "/src/core/financial-formulas";

import SimpleForm from "/src/components/ui/forms/SimpleForm.vue";
import StockPrice from "/src/components/ui/stocks/StockPrice.vue";
import HoverPopOver from "/src/components/ui/pop-overs/HoverPopOver.vue";
import StickyWrapper from "/src/components/ui/pop-overs/StickyWrapper.vue";
import LoadingPage from "/src/components/ui/loading/LoadingPage.vue";

import ImportOrdersForm from "./ImportOrdersForm.vue";
import BuySellStockForm from "/src/components/ui/forms/BuySellStockForm.vue";
import OpenTradesStats from "./OpenTradesStats.vue";
import OpenTradesTableHeader from "./OpenTradesTableHeader.vue";
import OpenTradesRow from "./OpenTradesRow.vue";

import { makeSelectedStore } from "/src/stores/selected-store";
import MultiSelectMenu from "./MultiSelectMenu.vue";
import MultiSelectMenuWrapper from "../ui/pop-overs/MultiSelectMenuWrapper.vue";

export default {
  components: {
    OpenTradesTableHeader,
    LoadingPage,
    SimpleForm,
    ImportOrdersForm,
    ConfirmationPopUp,
    Modal,
    AddStockForm,
    EditValue,
    OpenTradeModal,
    CalendarIcon,
    BuySellStockForm,
    StockPrice,
    HoverPopOver,
    StickyWrapper,
    OpenTradesStats,
    OpenTradesRow,
    MultiSelectMenu,
    MultiSelectMenuWrapper,
  },
  setup() {
    const store = useOpenTrades();
    const globalStore = useGlobalStore();
    const notification = useNotifications();

    const router = useRouter();
    const route = useRoute();

    const loading = ref(true);

    const strategy = reactive({
      value: [],
    });
    const stocks = ref([]);

    //pop up multi select menu
    const refsObject = reactive({});

    const modals = reactive({
      tradeModal: false,
      confirmModal: false,
      confirmAction: false,
      importTrades: false,
      addTrade: false,
    });

    function handleImportTrades(strat) {
      //specifiy port
      console.log(strat, "strat");
      modals.importTrades = {
        portfolio: strat.portfolios[0],
        map: [
          ["s", "Symbol", (val) => String(val).toUpperCase()],
          ["shares", "Quantity", Number],
          ["date", "Date", stringToDate, formatDate],
          ["price", "Price", cleanNumber],
          ["amount", "Amount", cleanNumber],
          ["fee", "Fees & Comm", (value) => (value ? cleanNumber(value) : 0)],
        ],
        preFilter: filterRows,
        onImport: handleImport,
      };

      function filterRows(row) {
        //filters out orders that aren't sell or buy orders
        return row.some((val) => {
          console.log(val, "val!", val.includes("Buy"));
          return val.includes("Buy") || val.includes("Sell");
        });
      }

      function stringToDate(string) {
        string = string.trim();

        let divider = "-";
        if (string.includes("/")) {
          divider = "/";
        }

        string = string.split(divider);

        if (string.length < 3) {
          const date = new Date();
          string.push(date.getFullYear());
          //add year
          string.join(divider);
        }

        return new Date(string).getTime();
      }

      function cleanNumber(string) {
        let allowed = [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          ".",
          "-",
        ];
        function filterString(inputString, allowedChars) {
          // Create a new string with only allowed characters
          let filteredString = "";
          for (let char of inputString) {
            if (allowedChars.includes(char)) {
              filteredString += char;
            }
          }
          return filteredString;
        }

        return Number(filterString(string, allowed));
      }
    }

    function handleDate(e, stock) {
      console.log(e);
      if (e != stock.date) stock.date = e;
    }

    function applyQuery(route) {
      if (route.query.tradeId && !modals.overlay) {
        //open trade modal
        const trade = store.trades.find((trade) => {
          return (route.query.tradeId = trade._id);
        });

        if (!trade) return;

        handleEdit({}, trade);
      } else if (modals.overlay && !route.query.tradeId) {
        modals.overlay = false;
      }
    }

    const trades = ref([]);
    const portfolio = ref(false);

    onMounted(async () => {
      try {
        loading.value = true;

        //get strategies strategies are a collection of portfolios
        const strategies = await strategyDb.get();

        trades.value = await orderDb.getOpenTrades({
          startDate: "2024-10-31T00:01:15.000Z",
          endDate: "2024-11-08T00:01:15.000Z",
        });

        const portfolios = await portfolioDb.get();

        console.log(trades.value, "trades.value");

        if (trades.value.length !== 0) {
          
          const portfolioId = trades.value[0].portfolioId;
          console.log(portfolioId, "portfolioId");
          portfolio.value = portfolios.find((p) => p._id === portfolioId);
          // strategy.value = {
          //   ...strategy.value,
          //   portfolios: [portfolio],
          // };
        }

        stocks.value = await stockDb.get();

        applyQuery(route);

        if (portfolios) store.setValue("portfolios", portfolios);
        if (strategies) store.setValue("strategies", strategies);
        // if (trades) {
        //   trades.map((trade) => {
        //     trade.orders.sort((a, b) => a.date - b.date);
        //   });

        //   console.log(trades, stocks.value, "trades!!");

        //   store.setValue("trades", trades);
        // }

        console.log(stocks.value, "stocks value");

        store.trades.filter((stock) => {
          const find = stocks.value.find((stk) => {
            return stk.s === stock.s;
          });

          globalStore.addStock(stock.s, {
            ...find,
            priceMovement: "",
            priceUpdates: [],
          });
        });

        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    });

    watch(route, (newValue) => {
      applyQuery(newValue);
    });

    onBeforeUnmount(() => {
      globalStore.clearStocks();
    });

    async function handleTradeUpdate(value, trade, field) {
      try {
        const updates = {
          _id: trade._id,
        };
        updates[field] = value;

        store.setTradeValue(value, trade, field);
        await tradesDb.update(updates);

        notification.create({
          message: "Updated trade",
          status: "success",
        });
      } catch (err) {
        notification.create({
          message: err,
          status: "error",
        });
      }
    }
    async function handleOpenDateUpdate(value, trade) {
      try {
        const order = trade.orders[0];

        const updates = {
          _id: order._id,
          trade: order.trade,
          date: value,
        };

        store.updateOrder(updates);
        await orderDb.update(updates);

        notification.create({
          message: "Updated trade",
          status: "success",
        });
      } catch (err) {
        notification.create({
          message: err,
          status: "error",
        });
      }
    }

    async function handleOrderDelete({ trade, order }) {
      await orderDb.update({ ...order, deleted: Date.now() });

      const index = trade.orders.findIndex((item) => item._id === order._id);
      if (index !== -1) trade.orders.splice(index, 1);
    }
    async function handleOrderUpdate({ trade, order }) {
      await orderDb.update({ ...order });
      const index = trade.orders.findIndex((item) => item._id === order._id);
      if (index !== -1) trade.orders.splice(index, 1, order);
    }
    async function handleOrderCreate({ trade, order }) {
      await orderDb.update({ ...order });
      trade.orders.push(order);
    }

    function handleAddTrade(strat) {
      modals.addTrade = {
        portfolio: strat.portfolios[0],
      };
    }

    function handleModalClose(name) {
      modals[name] = false;

      router.push({
        query: {},
      });
    }

    function handleEdit(e, stock) {
      modals.overlay = stock;
      if (!route.query.tradeId) {
        router.push({
          query: {
            tradeId: stock._id,
          },
        });
      }
    }

    function handleRemove(data) {
      modals.confirmModal = {
        value: async () => {
          try {
            await tradesDb.update({ _id: data._id, deleted: Date.now() });
            store.removeTrade(data);

            notification.create({
              status: "success",
              message: "Deleted trade",
            });

            modals.confirmModal = false;
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }
        },
      };
    }

    function handleGlobalUpdate(field, value) {
      //TODO if global value doesn't exist - create it

      const previousValue = globalStore.getValue(field);

      globalStore.updateValue(field, String(value));
      modals.confirmModal = {
        value: async () => {
          try {
            globalValueDb.update(globalStore.data[field]);
            notification.create({
              status: "success",
              message: `${field.toUpperCase()} has been updated.`,
            });
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }
        },
        cancelAction: () => {
          globalStore.updateValue(field, String(previousValue));
        },
        message: `Are you sure you want to change the value?`,
      };
    }

    function makeTrades(trades) {
      return trades.map((orders) => {
        const { portfolio, s, date } = orders[0];
        return {
          portfolios: [portfolio],
          s,
          date,
          status: "open",
          orders,
        };
      });
    }

    async function handleImport(csvData) {
      try {
        //group by symbols
        const trades = {};

        //ensure correct order
        csvData.mappedRows.sort((a, b) => a.date - b.date);

        //format rows, and push to trades array by ticker / key
        csvData.mappedRows.map((row) => {
          const { s, shares, date, price, amount, fee } = row;

          //format orders
          const order = {
            //determine if buy by the amount being positive or negative
            type: amount > 0 ? "Sell" : "Buy",
            date,
            s,
            portfolio: csvData.portfolio,
            //negative shares for Sell, positive shares for Buy
            shares: Math.sign(amount) * -1 * shares,
            price,
            fee: fee ? fee : 0,
          };

          if (!trades[s]) {
            trades[s] = [order];
          } else {
            trades[s].push(order);
          }
          return order;
        });

        const payload = [];

        Object.keys(trades).map((symbol) => {
          //create trades
          makeTrades(
            //group orders into trades
            ordersToTradeGroups(trades[symbol])
          ).map((trade) => {
            //flatten all trade groups
            payload.push(trade);
          });
        });

        console.log(payload, "payload");

        const results = await tradesDb.bulkInsert(payload);

        console.log(results, "server response");
        notification.create({
          status: "success",
          message: "Successfully imported trades",
        });
      } catch (err) {
        throw err;
      }
    }

    return {
      portfolio,
      trades,
      handleOpenDateUpdate,
      refsObject,
      loading,
      handleAddTrade,
      handleImportTrades,
      modals,
      handleGlobalUpdate,
      handleTradeUpdate,
      store,
      handleOrderDelete,
      strategy,
      formatMoney,
      formatDate,
      handleDate,
      handleEdit,
      handleRemove,
      handleModalClose,
      stocks,
      handleOrderUpdate,
      handleOrderCreate,
      globalStore,
      getSummary,
      refsObject,
    };
  },
};
</script>
  
<style scoped>
.table-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

table {
  /* width: 100%; */
  text-align: left;
  margin-top: 20px;
  font-family: "Open Sans";
}

.strategy-head {
  text-align: left;
}

:deep(.v-checkbox .v-input__details) {
  display: none;
}

.button-row {
  padding: 10px;
  display: flex;
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

.operator {
  color: var(--secondary-text-color);
}

td .date :deep(div) {
  display: flex;
  align-items: center;
}

:deep(button.v-btn.v-btn--disabled .v-btn__overlay) {
  background: transparent !important;
}
:deep(button.v-btn.v-btn--disabled i) {
  opacity: 0.4;
}

.v-card.v-theme--darkTheme.v-card--density-default.v-card--variant-outlined {
  box-shadow: 5px 5px 20px #3b3b6e33;
}
</style>
  