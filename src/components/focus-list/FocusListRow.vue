<template>
  <tr
    class="draggable"
    :key="element._id"
    :ref="
      (el) => {
        element.ref = el;
      }
    "
  >
    <td>
      <v-checkbox
        density="compact"
        :model-value="selectedStore.getSelected(element._id)"
        @update:model-value="
          selectedStore.handleSelectedUpdate($event, element)
        "
        color="var(--accent-two)"
      ></v-checkbox>
    </td>
    <td class="ticker" width="150">
      <list-menu
        :list="list"
        :lists="store.lists"
        :element="element"
        v-on:buy-sell-shares="handleBuySellShares(element)"
        v-on:remove-stock="handleRemove(element, list)"
      />
      <span class="ticker"
        ><a
          :href="'https://www.tradingview.com/chart/?symbol=' + element.s"
          target="_blank"
          >{{ element.s }}</a
        ></span
      >
    </td>
    <td>
      <edit-value
        :editValue="element.sector"
        type="text"
        :onBlur="true"
        v-on:value-update="
          handleValueUpdate($event, list._id, element, 'sector')
        "
        >{{ element.sector }}</edit-value
      >
    </td>
    <td>
      <edit-value
        :editValue="element.rs"
        type="number"
        :onBlur="true"
        v-on:value-update="handleValueUpdate($event, list._id, element, 'rs')"
        >{{ element.rs }}</edit-value
      >
    </td>
    <td>
      <v-rating
        hover
        :length="5"
        :size="32"
        :clearable="true"
        :model-value="element.rank"
        color="#2a3242"
        active-color="var(--accent-two)"
        v-on:update:modelValue="
          handleValueUpdate($event, list._id, element, 'rank')
        "
      />
    </td>
    <td :class="element.priceMovement">
      <stock-price
        :element="element"
        :activator="'price' + cleanText(element.s) + list._id"
        v-on:status-change="
          handleValueUpdate($event, list._id, element, 'status')
        "
        v-on:price-update="
          handleValueUpdate($event, list._id, element, 'price')
        "
      />
    </td>
    <td class="trigger">
      <edit-value
        :editValue="element.trigger"
        type="number"
        :onBlur="true"
        v-on:value-update="
          handleValueUpdate($event, list._id, element, 'trigger')
        "
        :class="getTriggerAlert(element, globalStore.getStockPrice(element.s))"
      >
        <v-icon>mdi-bell-ring</v-icon>
        <span> ${{ formatMoney(element.trigger) }}</span></edit-value
      >
    </td>
    <td>
      <edit-value
        :editValue="element.stop"
        type="number"
        :onBlur="true"
        v-on:value-update="handleValueUpdate($event, list._id, element, 'stop')"
        >${{ formatMoney(element.stop) }}</edit-value
      >
    </td>
    <td>
      {{ getStopPercent(element) }}%<v-tooltip
        activator="parent"
        color="#ff0000"
        location="top"
        >Formula</v-tooltip
      >
    </td>
    <td>
      ${{ formatMoney(getRiskAmount(element)) }}
      <v-tooltip activator="parent" color="#ff0000" location="top"
        >Formula</v-tooltip
      >
    </td>
    <td class="private">
      <span
        >${{ formatMoney(getRiskAmount(element) * getShares(element)) }}</span
      >
      <v-tooltip activator="parent" color="#ff0000" location="top"
        >Formula</v-tooltip
      >
    </td>
    <td class="private">
      <span>{{ getShares(element) }}</span
      ><v-tooltip activator="parent" color="#ff0000" location="top"
        >Formula</v-tooltip
      >
    </td>
    <td class="private">
      <span
        >${{
          formatMoney(
            getSize({
              ...element,
              shares: getShares(element),
            })
          )
        }}</span
      ><v-tooltip activator="parent" color="#ff0000" location="top"
        >Formula</v-tooltip
      >
    </td>
    <td>
      ${{ formatMoney(getR2(element))
      }}<v-tooltip activator="parent" color="#ff0000" location="top"
        >Formula</v-tooltip
      >
    </td>
  </tr>
</template>

<script>
//import { ref, reactive, onMounted, onUnmounted, onBeforeUnmount, watch, computed, nextTick } from "vue"
import StockPrice from "/src/components/ui/stocks/StockPrice.vue";
import { useGlobalStore } from "/src/stores/global-store";
import { useFocusStore } from "/src/stores/focus-store";
import { useNotifications } from "/src/stores/notifications.js";
import { makeSelectedStore } from "/src/stores/selected-store";
import { formatMoney } from "/src/utils/number-format.js";
import { stockDb } from "/src/databases";
import cleanText from "/src/utils/clean-text.js";
import ListMenu from "/src/components/focus-list/ListMenu.vue";
import EditValue from "/src/components/ui/forms/EditValue.vue";

export default {
  components: {
    StockPrice,
    ListMenu,
    EditValue,
  },
  props: ["element", "index", "list"],
  setup(props, { emit }) {
    const { element, index, list } = props;

    const store = useFocusStore();
    const globalStore = useGlobalStore();
    const notification = useNotifications();
    const selectedStore = makeSelectedStore(list._id)();

    async function handleValueUpdate(e, listId, stock, field) {
      try {
        store.updateListStock(e, listId, stock._id, field);

        const updates = {
          ...stock,
        };

        updates[field] = e;

        await stockDb.update(updates);

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

    function handleBuySellShares(element) {
      emit("buy-sell-shares", element);
    }

    function handleRemove(element, list) {
      emit("remove", [element, list]);
    }

    //------------------financial formulas----------------------//
    function getStopPercent(data) {
      if (data.stop === 0 || data.trigger === 0) return 0.0;
      const number = (data.trigger - data.stop) / data.trigger;
      return Number((number * 100).toFixed(2));
    }
    function getRiskAmount(data) {
      return data.trigger - data.stop;
    }

    function getMaxPositionSize(data) {
      if (
        !globalStore?.data?.maxPositionSize ||
        !globalStore?.data?.totalCapitol
      )
        return 0;
      return Math.round(
        (globalStore.getValue("maxPositionSize") *
          globalStore.getValue("totalCapitol")) /
          data.trigger
      );
    }
    function getShares(data) {
      if (data.stop === 0) return 0;
      if (getRiskPerTrade() === 0) return 0;
      return Math.min(
        Math.round(getRiskPerTrade() / getRiskAmount(data)),
        getMaxPositionSize(data)
      );
    }
    function getSize(data) {
      return data.shares * data.trigger;
    }

    function getR2(data) {
      return data.trigger * 1 + getRiskAmount(data) * globalStore.rFactor;
    }

    //helper function

    function getRiskPerTrade() {
      if (!globalStore?.data?.riskAllowance || !globalStore?.data?.totalCapitol)
        return 0;
      return (
        globalStore.getValue("riskAllowance") *
        globalStore.getValue("totalCapitol")
      );
    }

    function getTriggerAlert(el, price) {
      const threshold = globalStore.getValue("alertThreshold");

      if (el.status === "false") price = el.price;
      if (Math.abs(el.trigger - price) < threshold * el.trigger)
        return ["pill", "purple", "alert"];
      else return "";
    }

    return {
      selectedStore,
      handleBuySellShares,
      handleRemove,
      handleValueUpdate,
      store,
      globalStore,
      element,
      index,
      list,
      getStopPercent,
      getShares,
      getSize,
      getR2,
      getRiskAmount,
      formatMoney,
      cleanText,
      getTriggerAlert,
    };
  },
};
</script>

<style scoped>
tr.dragged {
  opacity: 0;
  z-index: 4;
  /* transform: scale(1.01); */
  box-shadow: 0px 0px 40px #2b303973;
}

td {
  padding: 10px;
  background-color: var(--block-background-color);
  transition: background 300ms ease;
}

td.red i {
  color: #ca1657;
}

td.green i {
  color: #2ac174;
}

td.trigger-alert {
  background-color: var(--accent-two);
}

td a {
  display: inline-block;
}
.trigger i {
  display: none;
}

.trigger .alert.pill i {
  display: inline-block;
}
</style>