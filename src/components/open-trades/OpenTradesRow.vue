<template>
  <tr>
    <!-- v-on:update:modelValue="handleSelect(trade, strat._id)" -->
    <td :ref="(el) => (trade.ref = el)">
      <v-checkbox
        density="compact"
        :model-value="selectedStore.getSelected(trade._id)"
        @update:model-value="handleSelectedUpdate($event, trade)"
        color="var(--accent-two)"
      ></v-checkbox>
    </td>
    <td class="ticker" width="150">
      <v-btn
        flat
        color="transparent"
        icon="mdi-dots-vertical"
        :id="'menu-activator-' + trade._id"
        size="small"
      ></v-btn>
      <v-menu :activator="'#menu-activator-' + trade._id">
        <v-list>
          <v-list-item @click="handleEdit($event, trade)" :key="1" :value="1">
            <v-list-item-title>Edit</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleRemove(trade)" :key="3" :value="3">
            <v-list-item-title>Remove</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <span class="ticker">
        <a
          :href="'https://www.tradingview.com/chart/?symbol=' + trade.symbol"
          target="_blank"
          >{{ trade.symbol }}</a
        >
      </span>
    </td>
    <td>
      <div class="date">
        <EditValue
          type="datetime-local"
          :editValue="trade.orders[0].date"
          :onBlur="true"
          v-on:value-update="handleOpenDateUpdate($event, trade)"
        >
          <calendar-icon />{{ formatDate(trade.orders[0].date) }}
        </EditValue>
      </div>
    </td>
    <td class="cost">
      <div class="content">
        <div class="price">
          <div class="label">Price Range</div>
          <div class="number">
            {{
              formatPriceRange(
                trade.orders
                  .filter(({ type }) => type === "BUY")
                  .map((s) => s.price)
              )
            }}
          </div>
        </div>
        <span class="operator">X</span>
        <div class="shares">
          <div class="label">Shares</div>
          <div class="number private">
            <span>{{ total(trade.orders.map((a) => a.shares)) }}</span>
          </div>
        </div>
        <span class="operator">=</span>
        <div class="cost">
          <div class="label">Total</div>
          <div class="number private">
            <span
              >${{
                formatMoney(total(trade.orders.map((a) => a.shares * a.price)))
              }}</span
            >
          </div>
        </div>
      </div>
    </td>
    <td :class="globalStore.getPriceMovement(trade.symbol)">
      <stock-price
        :element="getStock(trade.symbol)"
        :activator="'price' + trade._id"
        v-on:status-change="
          handleValueUpdate($event, getStock(trade.symbol), 'status')
        "
        v-on:price-update="
          handleValueUpdate($event, getStock(trade.symbol), 'price')
        "
      />
    </td>
    <td>
      <div
        class="pill"
        :class="
          getColorClass(
            profitLoss(trade.orders, globalStore.getStockPrice(trade.symbol))
          )
        "
      >
        <v-icon
          v-if="
            getColorClass(
              profitLoss(trade.orders, globalStore.getStockPrice(trade.symbol))
            ) === 'red'
          "
          >mdi mdi-arrow-down</v-icon
        >
        <v-icon v-else>mdi mdi-arrow-up</v-icon>
        <span class="hide-private"
          >${{
            formatMoney(
              profitLoss(trade.orders, globalStore.getStockPrice(trade.symbol))
            )
          }}
          |</span
        >
        {{
          formatPercentage(
            profitLoss(trade.orders, globalStore.getStockPrice(trade.symbol)) /
              total(trade.orders.map((a) => a.shares * a.price))
          )
        }}%
      </div>
    </td>
    <td class="private">
      <span
        >${{
          formatMoney(
          totalProceeds(trade.orders, globalStore.getStockPrice(trade.symbol))
          )
        }}</span
      >
    </td>
    <td>
      <EditValue
        type="number"
        :editValue="trade.currentStop"
        :onBlur="true"
        v-on:value-update="handleTradeUpdate($event, trade, 'currentStop')"
        >${{ formatMoney(trade.currentStop ? trade.currentStop : 0.0) }}
      </EditValue>
    </td>
    <td>
      <EditValue
        type="number"
        :editValue="trade.orders[0].stop"
        :onBlur="true"
        v-on:value-update="
          handleOrderFieldUpdate($event, trade.orders[0], 'stop')
        "
        >${{ formatMoney(trade.orders[0].stop ? trade.orders[0].stop : 0.0) }}
      </EditValue>
    </td>
    <td>
      {{
        formatMoney(
          getStopPercent({
            trigger: trade.orders[0].price,
            stop: trade.orders[0].stop,
          })
        )
      }}%
    </td>
    <td class="private">
      <span>{{
        formatMoney(
          (trade.currentStop - globalStore.getStockPrice(trade.symbol)) *
            total(trade.orders.map((a) => a.shares))
        )
      }}</span>
    </td>
    <td>
      {{ formatMoney(calc2R(trade.orders, trade.orders[0].stop)) }}
    </td>
    <td></td>
  </tr>
</template>

<script>
import { ref } from "vue";

import StockPrice from "/src/components/ui/stocks/StockPrice.vue";
import EditValue from '/src/components/ui/forms/EditValue.vue';
import {
  formatMoney,
  formatPercentage,
  formatDate,
  formatPriceRange,
} from "/src/utils/number-format";
import { useOpenTrades } from "/src/stores/open-trades";
import { useGlobalStore } from "/src/stores/global-store";
import { useNotifications } from "/src/stores/notifications";
import { makeSelectedStore } from "/src/stores/selected-store";



export default {
  props: ["trade", "strat"],
  components: {
    StockPrice,
    EditValue
  },
  setup({ strat }, { emit }) {
    const store = useOpenTrades();
    const globalStore = useGlobalStore();
    const notification = useNotifications();
    const selectedStore = makeSelectedStore(strat._id)();
    const selectedTrade = ref(false);

    function total(arr) {
      return arr.reduce((acc, item) => {
        acc += item;
        return acc;
      }, 0);
    }
    function totalProceeds(orders, currentPrice) {
      return orders.reduce((acc, order) => {
        acc += order.shares * currentPrice;
        return acc;
      }, 0);
    }
    function getStopPercent(data) {
      if (data.stop === 0 || data.trigger === 0) return 0.0;
      const number = (data.trigger - data.stop) / data.trigger;
      return Number((number * 100).toFixed(2));
    }
    function calc2R(orders, stop) {
      const currentPrice = globalStore.getStockPrice(orders[0].s);
      const r = orders[0].price - stop + orders[0].price;
      return currentPrice / r;
    }

    function handleEdit(e, trade) {
      emit("handleEdit", [e, trade]);
    }
    function handleRemove(trade) {
      emit("handleRemove", trade);
    }

    async function handleValueUpdate(e, stock, field) {
      try {
        const updates = {
          ...stock,
        };

        console.log(updates, "updates!!");

        updates[field] = e;

        globalStore.updateStock(stock.s, updates);

        await stockDb.update(updates);

        //find locally

        const foundStock = stocks.value.find((stk) => stock.s === stk.s);
        if (foundStock) {
          Object.assign(foundStock, updates);
        }

        notification.create({
          status: "success",
          message: "Value successfully updated",
        });
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    function getStock(ticker) {
      const stk = globalStore.getStock(ticker);
      return { ...stk };
    }

    function profitLoss(orders, currentPrice) {
      return orders.reduce((acc, order) => {
        acc += order.shares * currentPrice - order.shares * order.price;
        return acc;
      }, 0);
    }
    function getColorClass(number) {
      if (number < 0) {
        return "red";
      } else if (number > 0) {
        return "green";
      }
    }

    function handleSelectedUpdate(e, trade) {
      if (e) selectedStore.addSelected(trade);
      else selectedStore.removeSelected(trade._id);
    }

    function handleTradeUpdate(value, trade, field) {
      emit("trade-update", [value, trade, field])
    }

    function handleOpenDateUpdate(value, trade) {
      emit("open-date-update", [value, trade])
    }

    return {
      handleTradeUpdate,
      handleOpenDateUpdate,
      handleSelectedUpdate,
      selectedStore,
      getColorClass,
      handleValueUpdate,
      store,
      globalStore,
      handleEdit,
      handleRemove,
      total,
      totalProceeds,
      getStopPercent,
      formatMoney,
      formatPercentage,
      formatPriceRange,
      strat,
      selectedTrade,
      formatDate,
      getStock,
      profitLoss,
      calc2R,
    };
  },
};
</script>

<style scoped>
.ticker a {
  display: inline-block;
}
</style>