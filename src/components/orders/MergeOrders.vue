<template>
  <v-container fluid>
    <v-row v-show="false">
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="startDate"
          label="Start Date"
          type="date"
          @input="filterOrders"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="endDate"
          label="End Date"
          type="date"
          @input="filterOrders"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="Status"
          multiple
          chips
          @update:model-value="filterOrders"
        >
          <template v-slot:prepend-item>
            <v-list-item
              @click="toggleSelectAll"
              :title="
                selectedStatus.length === statusOptions.length
                  ? 'Deselect All'
                  : 'Select All'
              "
            >
              <template v-slot:prepend>
                <v-checkbox-btn
                  :model-value="selectedStatus.length === statusOptions.length"
                ></v-checkbox-btn>
              </template>
            </v-list-item>
            <v-divider class="mt-2"></v-divider>
          </template>
        </v-select>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="symbolSearch"
          label="Search Symbol"
          @input="filterOrders"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h2>
          <v-icon color="green">mdi-check</v-icon>
          {{ matchingOrders.length }} matching orders found
        </h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="button-row">
        <v-btn
          size="large"
          @click="() => importStore.updateStep(importStore.step - 1)"
        >
          Back
        </v-btn>
        <v-btn size="large" @click="handleCompleteMerge"> Next </v-btn>
      </v-col>
    </v-row>
    <v-row class="fill-height">
      <v-col>
        <v-virtual-scroll class="virtual-scroll" :items="matchingOrders">
          <template v-slot:default="{ item }">
            <v-row>
              <v-col cols="1">
                <v-checkbox
                  label="Merge Order"
                  v-model="selectedOrders"
                  :value="item"
                ></v-checkbox>
              </v-col>
              <v-col cols="11">
                <table>
                  <thead>
                    <tr>
                      <td v-for="header in orderHeaders" :key="header">
                        {{ header }}
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(order, index) in item" :key="index">
                      <td v-for="header in orderHeaders" :key="header">
                        <template v-if="header === 'date'">
                          {{ formatDateTime(order[header]) }}
                        </template>
                        <template v-else>
                          {{ order[header] }}
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </v-col>
            </v-row>
          </template>
        </v-virtual-scroll>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { onMounted, ref, computed } from "vue";
import { orderDb } from "/src/databases/index.js";
import { formatDateTime } from "/src/utils/number-format";
import { useRoute } from "vue-router";
import { makeImportStore } from "/src/stores/import-store";
import { makeOrder } from "/src/core/models";

export default {
  props: ["importStoreId"],
  setup(props) {
    const importStore = makeImportStore(props.importStoreId)();
    const allOrders = ref([]);
    const filteredOrders = ref([]);
    const startDate = ref("");
    const endDate = ref("");
    const selectedStatus = ref([]);
    const statusOptions = ["FILLED", "CANCELED", "REPLACED", "ERROR"];
    const symbolSearch = ref("");
    const selectedOrders = ref([]);

    const headers = [
      { title: "Symbol", key: "symbol" },
      { title: "Type", key: "type" },
      { title: "Shares", key: "shares" },
      { title: "Status", key: "status" },
      { title: "Date", key: "date" },
      { title: "Order ID", key: "orderId" },
      { title: "Stop", key: "stop" },
      { title: "Fee", key: "fee" },
      { title: "Price", key: "price" },
    ];

    const toggleSelectAll = () => {
      if (selectedStatus.value.length === statusOptions.length) {
        selectedStatus.value = [];
      } else {
        selectedStatus.value = [...statusOptions];
      }
      filterOrders();
    };

    const filterOrders = () => {
      filteredOrders.value = allOrders.value.filter((order) => {
        const orderDate = new Date(order.date);
        const start = startDate.value ? new Date(startDate.value) : null;
        const end = endDate.value ? new Date(endDate.value) : null;

        const dateCondition =
          start && end
            ? orderDate >= start && orderDate <= end
            : start
            ? orderDate >= start
            : end
            ? orderDate <= end
            : true;

        const statusCondition =
          selectedStatus.value.length === 0 ||
          selectedStatus.value.includes("Select All") ||
          selectedStatus.value.includes(order.status);

        const symbolCondition =
          !symbolSearch.value ||
          order.symbol.toLowerCase().includes(symbolSearch.value.toLowerCase());

        return dateCondition && statusCondition && symbolCondition;
      });
    };

    const exportToCsv = () => {
      // Convert data to CSV format
      const csvHeader = headers.map((header) => header.title).join(",");
      const csvRows = filteredOrders.value.map((order) => {
        return headers
          .map((header) => {
            const value = order[header.key];
            return header.key === "date" ? formatDateTime(value) : value;
          })
          .join(",");
      });

      const csvContent = [csvHeader, ...csvRows].join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const route = useRoute();

    const matchingOrders = ref([]);

    const orderHeaders = ref([]);

    onMounted(async () => {
      // Get startDate from URL if present
      if (route.query.startDate) {
        startDate.value = route.query.startDate;
      }
      if (props.orderData) {
        allOrders.value = props.orderData;
      } else {
        const request = await orderDb.getMyOrders();
        allOrders.value = request;

        importStore.updateKey("portfolioId", request[0].portfolioId);
        importStore.updateKey("userId", request[0].userId);
      }

      // Get mappedRows from importStore
      const mappedRows = importStore.data.mappedRows.map((row) => {
        return {
          ...row,
        };
      });

      console.log(Object.keys(mappedRows[3]), "mappedRows");

      orderHeaders.value = [
        ...Object.keys(mappedRows[3]),
        ...Object.keys(allOrders.value[0]),
      ].reduce((acc, header) => {
        if (!acc.includes(header)) {
          acc.push(header);
        }
        return acc;
      }, []);

      console.log(orderHeaders.value, "orderHeaders");

      //find matching orders from allOrders
      matchingOrders.value = allOrders.value
        .filter((order) => order.status === "FILLED")
        .map((order) => {
          console.log(order, mappedRows[0]);
          //symbol matches
          const symbolMatches = mappedRows.filter(
            (row) => row.symbol === order.symbol
          );
          //type has to match
          const typeMatch = symbolMatches.filter(
            (row) => row.type === order.type
          );
          //shares match
          const sharesMatch = typeMatch.filter(
            (row) => Math.abs(row.shares) === Math.abs(order.shares)
          );

          //return if no match
          if (
            sharesMatch.length === 0 ||
            typeMatch.length === 0 ||
            symbolMatches.length === 0
          ) {
            return null;
          }

          //date matches with threshold
          const dateMatches = sharesMatch.filter((row) => {
            const rowDate = new Date(row.date);
            const orderDate = new Date(order.date);
            return (
              rowDate.getFullYear() === orderDate.getFullYear() &&
              rowDate.getMonth() === orderDate.getMonth() &&
              rowDate.getDate() === orderDate.getDate()
            );
          });
          //price matches withing two decimal places
          const priceMatches = dateMatches.filter(
            (row) => Math.abs(row.price - order.price) <= 0.01
          );
          //return the first matching row
          const matchingRow = priceMatches[0];

          if (matchingRow === undefined) return null;
          return [order, matchingRow];
        })
        .filter((item) => item);

      selectedOrders.value = matchingOrders.value;

      filterOrders(); // Initial filtering
    });

    function handleCompleteMerge() {
      const mergedOrders = selectedOrders.value.map((match) => {
        const order = match[0];
        const row = match[1];

        return {
          ...order,
          ...row,
          date: order.date,
          fee: row.fee ? row.fee : order.fee,
          shares: order.shares,
          type: order.type,
          symbol: order.symbol,
          tempId: row._id,
          _id: order._id,
        };
      });

      //update rows in importStore
      importStore.updateKey(
        "mergedOrders",
        importStore.data.mappedRows
          .map((row) => {
            if (
              selectedOrders.value.find((order) => order[1]._id === row._id)
            ) {
              const mergedOrder = mergedOrders.find(
                (order) => order.tempId === row._id
              );
              if (mergedOrder) {
                delete mergedOrder.tempId;
                try {
                  return makeOrder(mergedOrder);
                } catch (e) {
                  console.log(e);
                  return null;
                }
              }
            }
            try {
              return makeOrder({
                ...row,
                importType: "MANUAL",
                portfolioId: importStore.data.portfolioId,
                userId: importStore.data.userId,
              });
            } catch (e) {
              console.log(e);
              return null;
            }
          })
          .filter((row) => row)
      );

      importStore.updateStep(4);
    }

    return {
      importStore,
      handleCompleteMerge,
      orderHeaders,
      matchingOrders,
      filteredOrders,
      headers,
      formatDateTime,
      startDate,
      endDate,
      filterOrders,
      selectedStatus,
      statusOptions,
      toggleSelectAll,
      exportToCsv,
      symbolSearch,
      selectedOrders,
    };
  },
};
</script>

<style scoped>
.fill-height {
  flex: 1;
  min-height: 0; /* Important for proper flex behavior */
}
.virtual-scroll {
  /* height: 100% !important; */
}
</style>
