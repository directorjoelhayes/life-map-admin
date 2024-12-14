<template>
  <v-container>
    <v-row>
      <v-col :cols="3">
        <v-text-field
          v-model="search"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table-virtual
          height="900"
          :search="search"
          :headers="headers"
          :items="props.tableData"
          item-value="name"
        >
          <template v-slot:item.symbol="{ item }">
              <span v-on:click="openModal(item)">{{ item.symbol }}</span>
          </template>
          <template v-slot:item.status="{ item }">
            <template v-if="item.status">
              <v-icon v-if="item.status.value === 'error'" color="red"
                >mdi-close</v-icon
              >
            </template>
          </template>
          <template v-slot:item.price="{ item }">
            <template v-if="item.orders">
              {{
                item.orders
                  .filter((order) => order.type === "BUY" && order.price)
                  .map(({ price }) => price)
                  .join(", ")
              }}
            </template>
          </template>
          <template v-slot:item.sellPrice="{ item }">
            <template v-if="item.orders">
              {{
                item.orders
                  .filter((order) => order.type === "SELL" && order.price)
                  .map(({ price }) => price)
                  .join(", ")
              }}
            </template>
          </template>

          <template v-slot:item.shares="{ item }">
            <template v-if="item.orders">
              {{
                item.orders
                  .filter(
                    (order) =>
                      order.type === "SELL" && order.status === "FILLED"
                  )
                  .map(({ shares }) => shares)
                  .join("")
              }}
            </template>
          </template>

          <template v-slot:item.entryDate="{ item }">
            <template v-if="item.entryDate">
              {{ formatDate(item.entryDate) }}
            </template>
          </template>
          <template v-slot:item.exitDate="{ item }">
            <template v-if="item.exitDate">
              {{ formatDate(item.exitDate) }}
            </template>
          </template>
        </v-data-table-virtual>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
import { reactive, ref } from "vue";
import { formatDate } from "/src/utils/number-format";

export default {
  props: ["tableData"],
  setup(props, { emit }) {
    const search = ref("");

    const headers = [
      { title: "", align: "start", key: "status" },
      { title: "Ticker", align: "start", key: "symbol" },
      { title: "Exit Date", align: "start", key: "exitDate" },
      { title: "Entry Date", align: "start", key: "entryDate" },
      { title: "Shares", align: "start", key: "shares" },
      { title: "Share Cost", align: "start", key: "price" },
      { title: "Sell Price", align: "start", key: "sellPrice" },
      { title: "Proceeds", align: "start", key: "proceeds" },
      { title: "Initial Stop", align: "start", key: "initialStop" },
      { title: "Final Stop", align: "start", key: "finalStop" },
      { title: "Win / Loss R", align: "start", key: "winLossR" },
      { title: "Hold", align: "start", key: "hold" },
    ];

    function openModal(trade) {
      emit("open-modal", trade)
    }

    return {
      props,
      headers,
      search,
      formatDate,
      openModal
    };
  },
};
</script>

<style scoped>
</style>