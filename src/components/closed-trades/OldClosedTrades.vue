<template>
  <div class="page-container">
    <v-container fluid>
      <v-row class="lm-row filter-row">
        <v-col class="lm-col-2">
          <label> Date Range </label>
          <edit-value
            :editValue="dateRange.value"
            type="select"
            :items="[...Object.keys(dateRangeMethods)]"
            v-on:value-update="handleDateUpdate($event, 'dateRange')"
          >
            <div class="date"><calendar-icon />{{ dateRange.value }}</div>
          </edit-value>
        </v-col>
        <v-col class="lm-col-2">
          <label> Start Date </label>
          <edit-value
            :editValue="data.startDate"
            type="datetime-local"
            :onBlur="true"
            v-on:value-update="handleDateUpdate($event, 'startDate')"
          >
            <div class="date">
              <calendar-icon />{{ formatDate(data.startDate) }}
            </div>
          </edit-value>
        </v-col>
        <v-col class="lm-col-2">
          <label> End Date </label>
          <edit-value
            :editValue="data.endDate"
            type="datetime-local"
            :onBlur="true"
            v-on:value-update="handleDateUpdate($event, 'endDate')"
          >
            <div class="date">
              <calendar-icon />{{ formatDate(data.endDate) }}
            </div>
          </edit-value>
        </v-col>
        <v-col class="lm-col-2">
          <label> Strategies </label>
          <v-select
            v-model="stratFilter"
            :items="
              store.strategies.map((strat) => {
                return {
                  title: strat.name,
                  value: strat,
                };
              })
            "
            multiple
            variant="underlined"
            density="compact"
          ></v-select>
        </v-col>
      </v-row>
    </v-container>
    <v-container fluid
      v-for="strat in store.strategies"
      :key="strat.name"
      v-show="stratFilter.some(({ _id }) => _id === strat._id)"
    >
      <v-row class="lm-row">
        <div class="lm-col strategy-head">
          <h2>{{ strat.name }}</h2>
          <p>
            {{ strat.description }}
            <template v-if="strat.description">|</template>
            <span
              v-for="(portfolioId, index) of strat.portfolios"
              :key="portfolioId"
            >
              <template v-if="index !== 0">, </template>
              {{ store.getPortfolioName(portfolioId) }}
            </span>
          </p>
        </div>
      </v-row>
      <v-row
        class="lm-row stats"
        v-if="store.getTradesByStrategy(strat._id).length"
      >
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Batting Average</h3>
            <h2>
              {{
                formatFloat(
                  battingAverage(store.getTradesByStrategy(strat._id))
                )
              }}%
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average Stop</h3>
            <h2>
              {{
                formatPercentage(
                  averageStop(store.getTradesByStrategy(strat._id))
                )
              }}%
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average Profit</h3>
            <h2>
              {{
                formatFloat(
                  averageProfit(store.getTradesByStrategy(strat._id))
                )
              }}%
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average Loss</h3>
            <h2>
              {{
                formatFloat(averageLoss(store.getTradesByStrategy(strat._id)))
              }}%
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average R Win</h3>
            <h2>
              {{
                formatFloat(averageWinR(store.getTradesByStrategy(strat._id)))
              }}
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average R Loss</h3>
            <h2>
              {{
                formatFloat(averageLossR(store.getTradesByStrategy(strat._id)))
              }}
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average Hold Win</h3>
            <h2>
              {{
                millToDays(averageHoldWin(store.getTradesByStrategy(strat._id)))
              }}
            </h2>
          </v-card>
        </v-col>
        <v-col class="lm-col">
          <v-card variant="outlined">
            <h3>Average Hold Loss</h3>
            <h2>
              {{
                millToDays(
                  averageHoldLoss(store.getTradesByStrategy(strat._id))
                )
              }}
            </h2>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="store.getFlatTradesByStrategy(strat._id, data).length">
        <table-container>
          <thead>
            <tr>
              <td>Ticker</td>
              <td
                class="ripple"
                v-on:click="handleSort('closeDate', strat._id)"
              >
                <div class="sortable">
                  Date Close <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
                </div>
              </td>
              <td class="ripple" v-on:click="handleSort('openDate', strat._id)">
                <div class="sortable">
                  Date Open <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
                </div>
              </td>
              <td>Sell Price</td>
              <td>Price</td>
              <td>Profit / Loss</td>
              <td>PROCEEDS</td>
              <td>Initial Stop</td>
              <td>Final Stop</td>
              <td>Win / Loss R</td>
              <td>Hold</td>
            </tr>
          </thead>
          <tbody>
            <closed-trade-row
              v-for="(trade, index) in store.getFlatTradesByStrategy(
                strat._id,
                data,
                getPagination(strat._id)
              )"
              :key="trade._id + index"
              :trade="trade"
              :dateRange="data"
            />
          </tbody>
          <template v-slot:footer>
            <div class="t-footer">
              <v-btn v-on:click="showAllToggle(strat._id)">Show All</v-btn>
            </div>
          </template>
        </table-container>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import ConfirmationPopUp from "/src/components/ui/pop-overs/ConfirmationPopUp.vue";
import Modal from "/src/components/ui/modals/Modal.vue";
import { ref, reactive, onMounted, watch, computed } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import {
  formatMoney,
  formatDate,
  formatFloat,
  millToDays,
  formatPercentage,
} from "../../utils/number-format";
import { tradesDb, strategyDb, orderDb, portfolioDb } from "../../databases";

import EditValue from "/src/components/ui/forms/EditValue.vue";
import ClosedTradeModal from "./ClosedTradeModal.vue";
import { useClosedTrades } from "../../stores/closed-trades";
import CalendarIcon from "/src/components/ui/icons/CalendarIcon.vue";
import {
  getProfits,
  getSummary,
  averageWinR,
  averageLossR,
  averageProfit,
  averageLoss,
  averageHoldLoss,
  averageHoldWin,
  battingAverage,
  averageStop,
} from "../../utils/finance-formulas";
import ClosedTradeRow from "./ClosedTradeRow.vue";
import TableContainer from "/src/components/ui/tables/TableContainer.vue";

export default {
  components: {
    TableContainer,
    ClosedTradeRow,
    ConfirmationPopUp,
    Modal,
    VueDatePicker,
    EditValue,
    ClosedTradeModal,
    CalendarIcon,
  },
  setup() {
    const store = useClosedTrades();

    const stratFilter = ref([]);
    const pagination = ref([]);

    function getPagination(stratId) {
      const strat = pagination.value.find(({ _id }) => _id === stratId);
      if (!strat) return 8;
      else return strat.limit;
    }

    function showAllToggle(stratId) {
      const strat = pagination.value.find(({ _id }) => _id === stratId);
      if (strat.limit) strat.limit = false;
      else strat.limit = 8;
    }

    function getFirstDayOfMonth(date = Date.now()) {
      // Create a new Date object with the given date
      const firstDayOfMonth = new Date(date);

      // Set the day of the month to 1
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      return firstDayOfMonth.getTime();
    }
    function getLastMonth() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const start = new Date(currentYear, currentMonth - 1, 1);
      const end = new Date(currentYear, currentMonth, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(11, 59, 59, 59);
      // Calculate the first day of the last 6 months
      return {
        startDate: start.getTime(),
        endDate: end.getTime(),
      };
    }
    function getFirstDayOfYear() {
      const currentYear = new Date().getFullYear();
      const firstDayOfYear = new Date(currentYear, 0, 1);
      firstDayOfYear.setHours(0, 0, 0, 0);
      return firstDayOfYear.getTime();
    }
    function getLastSixMonths() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Calculate the first day of the last 6 months
      const firstDayOfLastSixMonths = new Date(
        currentYear,
        currentMonth - 5,
        1
      );

      firstDayOfLastSixMonths.setHours(0, 0, 0, 0);

      return firstDayOfLastSixMonths.getTime();
    }
    function getLast12Months() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Calculate the first day of the last 6 months
      const firstDayOfLast12Months = new Date(
        currentYear,
        currentMonth - 11,
        1
      );

      firstDayOfLast12Months.setHours(0, 0, 0, 0);

      return firstDayOfLast12Months.getTime();
    }
    function getLastDayOfMonth(day = Date.now()) {
      const date = new Date(day);
      // Get the month and year of the input date
      const month = date.getMonth();
      const year = date.getFullYear();

      // Create a new Date object for the first day of the next month
      const firstDayOfNextMonth = new Date(year, month + 1, 1);

      // Subtract one day from the first day of the next month to get the last day of the current month
      const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);

      // Return the last day of the month
      return lastDayOfMonth.getTime();
    }

    const dateRangeMethods = {
      MTD: () => {
        const date = new Date();
        return {
          startDate: getFirstDayOfMonth(date),
          endDate: date.getTime(),
        };
      },
      YTD: () => {
        const date = new Date();
        console.log("YTD", getFirstDayOfYear(), date.getTime());

        return {
          startDate: getFirstDayOfYear(),
          endDate: date.getTime(),
        };
      },
      "Last 6 Months": () => {
        const date = new Date();
        return {
          startDate: getLastSixMonths(date),
          endDate: date.getTime(),
        };
      },
      "Last 12 Months": () => {
        const date = new Date();
        return {
          startDate: getLast12Months(date),
          endDate: date.getTime(),
        };
      },
      "Last Month": () => {
        return getLastMonth();
      },
    };

    const data = reactive({
      startDate: getFirstDayOfYear(),
      endDate: Date.now(),
    });

    const dateRange = reactive({
      value: "YTD",
    });

    function equalToDateMethod({ startDate, endDate }) {
      return Object.keys(dateRangeMethods).filter((key) => {
        const normalize = (date) => {
          const newDate = new Date(date);
          newDate.setHours(11, 59, 59, 59);

          return newDate.getTime();
        };
        const method = dateRangeMethods[key]();
        if (key === "MTD") {
          console.log(
            startDate,
            method.startDate,
            normalize(endDate),
            normalize(method.endDate),
            "testing!!!"
          );
        }

        if (
          startDate === method.startDate &&
          normalize(endDate) === normalize(method.endDate)
        ) {
          return true;
        } else {
          return false;
        }
      })[0];
    }

    watch(data, async (value) => {
      await getTrades();
    });

    async function getTrades() {
      try {
        const { trades } = await orderDb.get({
          trades: "true",
          type: "Sell",
          dates: `${data.startDate}-${data.endDate}`,
        });

        trades.forEach(async (item) => {
          const tempOrders = item.orders
            .filter((order) => {
              //remove off orders after end date
              return order.date <= data.endDate;
            })
            .reduceRight(
              (arr, order) => {
                //remove buy orders up until the first sell
                if (arr[1]) arr[0].push(order);
                if (order.type === "Sell" && !arr[1]) {
                  arr[1] = true;
                  arr[0].push(order);
                }
                return arr;
              },
              [[], false]
            )[0]
            .reverse();

          try {
            const orders = tempOrders.filter((order) => {
              //remove off orders after end date
              return order.date <= data.endDate;
            });

            const summary = getSummary(orders).trades.map((filtered) => {
              filtered.orders.sort((a, b) => a.date - b.date);

              return {
                ...filtered,
                ...item,
                orders: filtered.orders,
              };
            });

            //order is find
            item.orders = tempOrders;
          } catch (err) {
            console.log(err, "hello");
            //something is wrong
            item.status = "error";
          }
        });

        trades.sort((a, b) => {
          if (a.status === "error" && b.status !== "error") {
            return -1;
          }
          if (a.status !== "error" && b.status === "error") {
            return 1;
          }
          return (
            b.orders[b.orders.length - 1].date -
            a.orders[a.orders.length - 1].date
          );
        });

        if (trades) store.setValue("trades", trades);
      } catch (err) {}
    }
    function handleSort(field, stratId) {
      store.sortTrades(stratId, field);
    }

    //formulas
    onMounted(async () => {
      try {
        const strategies = await strategyDb.get();
        const portfolios = await portfolioDb.get();

        stratFilter.value = strategies;

        if (portfolios) store.setValue("portfolios", portfolios);
        if (strategies) {
          store.setValue("strategies", strategies);
          strategies.map(({ _id }) => {
            pagination.value.push({
              _id,
              limit: 8,
            });
          });
        }

        await getTrades();
      } catch (err) {}
    });

    function handleDateUpdate(value, key) {
      if (key === "dateRange" && value) {
        dateRange.value = value;

        const { startDate, endDate } = dateRangeMethods[value]();

        data.startDate = startDate;
        data.endDate = endDate;
      } else {
        console.log(value, "date!");

        const tempData = {
          ...data,
        };

        tempData[key] = value;

        if (tempData.endDate < tempData.startDate) {
          tempData.endDate = getLastDayOfMonth(tempData.startDate);
        }

        Object.assign(data, tempData);

        if (equalToDateMethod(data)) {
          dateRange.value = equalToDateMethod(data);
        } else {
          if (dateRange.value !== "Custom") dateRange.value = "Custom";
        }
      }
    }

    return {
      handleSort,
      showAllToggle,
      getPagination,
      stratFilter,
      averageStop,
      formatPercentage,
      dateRange,
      dateRangeMethods,
      battingAverage,
      millToDays,
      averageProfit,
      averageWinR,
      averageLossR,
      averageLoss,
      handleDateUpdate,
      getSummary,
      getProfits,
      store,
      data,
      formatMoney,
      formatDate,
      formatFloat,
      averageHoldLoss,
      averageHoldWin,
    };
  },
};
</script>
<style>
.dp__theme_dark {
  --dp-background-color: var(--block-background-color);
  --dp-text-color: #fff;
  --dp-hover-color: var(--accent-two);
  --dp-hover-text-color: #fff;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: var(--accent-two);
  --dp-primary-disabled-color: #61a8ea;
  --dp-primary-text-color: #fff;
  --dp-secondary-color: #a9a9a9;
  --dp-border-color: none;
  --dp-menu-border-color: #2d2d2d;
  --dp-border-color-hover: #aaaeb7;
  --dp-disabled-color: #737373;
  --dp-disabled-color-text: #d0d0d0;
  --dp-scroll-bar-background: #212121;
  --dp-scroll-bar-color: #484848;
  --dp-success-color: #00701a;
  --dp-success-color-disabled: #428f59;
  --dp-icon-color: #959595;
  --dp-danger-color: #e53935;
  --dp-marker-color: #e53935;
  --dp-tooltip-color: #3e3e3e;
  --dp-highlight-color: rgb(0 92 178 / 20%);
}
</style>
<style scoped>
.strategy-head > * {
  text-align: left;
}

/*card stats*/
.v-card {
  background-color: var(--block-background-color);
}

.v-card h3 {
  color: #7884a6;
}

.lm-row.filter-row {
  text-align: left;
  border-bottom: solid;
  border-color: var(--block-background-color);
}

.lm-row.stats {
  padding: 50px 0px;
}

.lm-row.filter-row {
  text-align: left;
  border-bottom: solid;
  border-color: var(--block-background-color);
}

.lm-row .date svg {
  padding-left: 0px;
}

label {
  font-family: "Open Sans";
  font-size: 16px;
  color: #6d7b96;
}

.date {
  display: flex;
  align-items: center;
}

table {
  width: 100%;
  text-align: left;
  font-family: "Open Sans";
  min-width: max-content;
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

/* .pill.red {
    color: #ca1657;
}

.pill.green {
    color: #2ac174;
} */

.button-row {
  padding: 10px;
  display: flex;
}

span.ticker {
  margin-left: 15px;
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

td .date {
  display: flex;
  align-items: center;
}

.t-footer {
  padding: 20px 0px;
}

td .sortable i {
  margin-left: auto;
}

.sortable {
  cursor: pointer;
  display: flex;
}
</style>
