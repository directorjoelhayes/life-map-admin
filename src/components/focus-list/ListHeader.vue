<template>
  <v-col class="list-header">
    <edit-value
      class="heading"
      :editValue="list.name"
      type="string"
      :onBlur="true"
      v-on:value-update="handleListUpdate('name', $event, list)"
    >
      <h2>{{ list.name }}</h2>
    </edit-value>
    <div class="button-row">
      <v-btn variant="outlined" size="large" :id="'menu-activator-' + list._id">
        Add Stock
      </v-btn>
      <v-menu :activator="'#menu-activator-' + list._id">
        <v-list>
          <v-list-item @click="handleAddStock(list)" :key="1" :value="1">
            <v-list-item-title>Add Stock</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleImportList(list)" :key="2" :value="2">
            <v-list-item-title>Import List</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleExportList(list)" :key="2" :value="2">
            <v-list-item-title>Export List</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-col>
</template>


<script>
import EditValue from "../ui/forms/EditValue.vue";
import { saveAs } from 'file-saver';

export default {
  components: {
    EditValue,
  },
  props: ["list"],
  setup(props, { emit }) {
    const { list } = props;

    function handleListUpdate(value, $event, list) {
      emit("list-update", [value, $event, list]);
    }

    function handleAddStock(list) {
      emit("add-stock", list);
    }

    function handleImportList(list) {
      emit("import-list", list);
    }

    function handleExportList(list) {
      const headers = ['Symbol', 'Name', 'Sector', 'RS', 'Rank'];
      const stocksData = list.stocks.map(stock => [
        stock.s,
        stock.c,
        stock.sector,
        stock.rs || 'N/A',
        stock.rank || 'N/A'
      ]);
      const csvContent = [
        headers.join(','),
        ...stocksData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${list.name}_stocks.csv`);
    }

    return {
      list,
      handleAddStock,
      handleImportList,
      handleListUpdate,
      handleExportList,
    };
  },
};
</script>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
