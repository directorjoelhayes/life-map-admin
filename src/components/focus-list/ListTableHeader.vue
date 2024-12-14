<template>
  <thead v-on="dragOverDefaults">
    <tr>
      <td>
        <v-checkbox
          density="compact"
          @change="handleSelectAll($event, list._id)"
          :model-value="areAllSelected"
          color="var(--accent-two)"
        ></v-checkbox>
      </td>
      <td
        draggable="true"
        class="ripple"
        v-on:click="handleSort('ticker', list._id)"
      >
        <div class="sortable">
          Ticker <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td
        draggable="true"
        v-on:click="handleSort('sector', list._id)"
        class="ripple"
      >
        <div class="sortable">
          Sector<v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td
        draggable="true"
        class="ripple"
        v-on:click="handleSort('rs', list._id)"
      >
        <div class="sortable">
          RS <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td
        draggable="true"
        class="ripple"
        v-on:click="handleSort('rank', list._id)"
      >
        <div class="sortable">
          Rank <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td draggable="true">Price</td>
      <td
        draggable="true"
        class="ripple"
        v-on:click="handleSort('trigger', list._id)"
      >
        <div class="sortable">
          Trigger <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td draggable="true">Stop</td>
      <td
        draggable="true"
        class="ripple"
        v-on:click="handleSort('%stop', list._id)"
      >
        <div class="sortable">
          % Stop <v-icon>mdi mdi-unfold-more-horizontal</v-icon>
        </div>
      </td>
      <td draggable="true">$ Stop</td>
      <td draggable="true">Risk</td>
      <td draggable="true">Shares</td>
      <td draggable="true">Size</td>
      <td draggable="true" class="XR">
        <edit-value
          :editValue="globalStore.rFactor"
          type="number"
          :onBlur="true"
          v-on:value-update="updateRFactor"
          >{{ globalStore.rFactor }}R</edit-value
        >
      </td>
    </tr>
  </thead>
</template>

<script>
import { computed } from "vue";
import dragOverDefaults from "/src/utils/drag-over-defaults.js";
import { useFocusStore } from "/src/stores/focus-store";
import { useGlobalStore } from "/src/stores/global-store";
import { makeSelectedStore } from "../../stores/selected-store";
import EditValue from "../ui/forms/EditValue.vue";

export default {
  components: {
    EditValue,
  },
  props: ["list"],
  setup(props) {
    const store = useFocusStore();
    const globalStore = useGlobalStore();
    const selectedStore = makeSelectedStore(props.list._id)();

    function updateRFactor(value) {
      globalStore.setValue("rFactor", value);
    }

    function handleSort(field, listId) {
      store.sortList(listId, field);
    }

    function handleSelectAll(event, listId) {
      const list = store.getList(listId);
      if (event.target.checked)
        selectedStore.selectAll(
          list.stocks.map((a) => {
            return { ...a };
          })
        );
      else selectedStore.unselectAll();
    }

    const areAllSelected = computed(() => {
      const list = store.getList(props.list._id);
      return selectedStore.getAllSelected(list.stocks);
    });

    return {
      handleSelectAll,
      areAllSelected,
      globalStore,
      handleSort,
      dragOverDefaults,
      updateRFactor,
    };
  },
};
</script>

<style scoped>
thead td {
  background-color: #2a3242;
  padding: 10px;
  font-family: "Open Sans";
}
.sortable {
  display: flex;
  cursor: pointer;
}
td .sortable i {
  margin-left: auto;
}
</style>