<template>
  <div>
    <v-data-table :headers="headers" :items="trade.orders" class="elevation-1">
      <template v-slot:item.date="{ item }">
        {{ new Date(item.date).toLocaleString() }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  props: ["trade"],
  setup({ trade }) {
    const headers = [
    { title: "Symbol", key: "symbol" },
    { title: "Type", key: "type" },
    { title: "Shares", key: "shares" },
    { title: "Status", key: "status" },
    { title: "Date", key: "date" },
    { title: "Order ID", key: "orderId" },
    { title: "Stop", key: "stop" },
    { title: "Price", key: "price" }
    ];

    return {
      trade,
      headers,
    };
  },
};
</script>

<style scoped>
</style>