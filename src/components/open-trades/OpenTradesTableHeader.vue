<template>
  <tr>
    <!-- #FEATURE add sorting -->
    <td>
      <v-checkbox
        density="compact"
        @change="handleSelectAll($event, strat._id)"
        :model-value="areAllSelected"
        color="var(--accent-two)"
      ></v-checkbox>
    </td>
    <td>Ticker</td>
    <td>Date Open</td>
    <td>Total Cost</td>
    <td>Price</td>
    <td>PROFIT / LOSS</td>
    <td>PROCEEDS</td>
    <td>Current Stop</td>
    <td>Stop</td>
    <td>% Stop</td>
    <td>DERISK</td>
    <td>R</td>
    <td>Notes</td>
  </tr>
</template>

<script>
import { computed } from "vue";
import { useOpenTrades } from "/src/stores/open-trades";
import { makeSelectedStore } from "/src/stores/selected-store";

export default {
  props: ["strat"],
  setup({ strat }) {
    const store = useOpenTrades();
    const selectedStore = makeSelectedStore(strat._id)();

    function handleSelectAll(event, stratId) {
      const trades = store.getTradesByStrategy(stratId);
      if (event.target.checked) selectedStore.selectAll(trades);
      else selectedStore.unselectAll();
    }

    const areAllSelected = computed(() => {
      return selectedStore.getAllSelected(store.getTradesByStrategy(strat._id));
    });

    const trades = store.getTradesByStrategy(strat._id);

    return {
      areAllSelected,
      trades,
      strat,
      selectedStore,
      store,
      handleSelectAll,
    };
  },
};
</script>


<style scoped>
</style>