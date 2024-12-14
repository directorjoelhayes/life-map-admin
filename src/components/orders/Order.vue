<template>
  <div class="page-container">
    <v-container fluid>
      <v-row>
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
                    :model-value="
                      selectedStatus.length === statusOptions.length
                    "
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
        <v-col>
          <v-btn
            color="primary"
            @click="exportToCsv"
            :disabled="!filteredOrders.length"
          >
            Export to CSV
          </v-btn>
        </v-col>
      </v-row>

      <!-- Table of orders -->
      <v-data-table :headers="headers" :items="filteredOrders">
        <template v-slot:item.date="{ item }">
          {{ formatDateTime(item.date) }}
        </template>
        <template v-slot:item.orderId="{ item }">
          <router-link :to="`/orders/${item.orderId}`">{{
            item.orderId
          }}</router-link>
        </template>
      </v-data-table>

      <v-row class="mb-4"> </v-row>
    </v-container>
    <!-- Date range inputs -->
  </div>
</template>

<script>
import { onMounted, ref, computed } from "vue";
import { orderDb } from "/src/databases/index.js";
import { formatDateTime } from "/src/utils/number-format";
import { useRoute } from "vue-router";

export default {
  props: ["orderData"],
  setup(props) {
    const allOrders = ref([]);
    const filteredOrders = ref([]);
    const startDate = ref("");
    const endDate = ref("");
    const selectedStatus = ref([]);
    const statusOptions = ["FILLED", "CANCELED", "REPLACED", "ERROR"];
    const symbolSearch = ref("");

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
      }
      filterOrders(); // Initial filtering
    });

    return {
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
    };
  },
};
</script>

<style scoped>
</style>
