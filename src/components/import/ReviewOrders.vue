<template>
  <v-container>
    <div class="text-h5 mb-4">Review Orders</div>


    <v-row>
      <v-col class="button-row">
        <v-btn
          size="large"
          @click="() => importStore.updateStep(importStore.step - 1)"
        >
          Back
        </v-btn>
        <v-btn size="large" @click="handleCompleteImport" :loading="loading"> Next </v-btn>
      </v-col>
    </v-row>
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

    <!-- Update table to use filtered orders -->
    <v-data-table
      :headers="headers"
      items-per-page="500"
      :items="filteredOrders"
    >
      <template v-slot:item.date="{ item }">
        {{ formatDateTime(item.date) }}
      </template>
      <template v-slot:item.orderId="{ item }">
        <router-link :to="`/orders/${item.orderId}`">{{
          item.orderId
        }}</router-link>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { ref, computed } from "vue";
import { makeImportStore } from "/src/stores/import-store";
import { formatDateTime } from "/src/utils/number-format";
import { useRoute } from "vue-router";
import { orderDb } from "/src/databases";
import { useNotifications } from "/src/stores/notifications";


export default {
  props: ["importStoreId"],
  setup(props) {
    const importStore = makeImportStore(props.importStoreId)();
    const route = useRoute();
    const notification = useNotifications();
    const loading = ref(false);
    // Add filter state
    const startDate = ref(route.query.startDate || "");
    const endDate = ref("");
    const selectedStatus = ref([]);
    const statusOptions = ["FILLED", "CANCELED", "REPLACED", "ERROR"];
    const symbolSearch = ref("");

    // Create computed filtered orders
    const filteredOrders = computed(() => {
      return importStore.data.mergedOrders.filter((order) => {
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
          selectedStatus.value.includes(order.status);
        console.log(order);
        const symbolCondition =
          !symbolSearch.value ||
          order.symbol.toLowerCase().includes(symbolSearch.value.toLowerCase());

        return dateCondition && statusCondition && symbolCondition;
      });
    });

    const toggleSelectAll = () => {
      if (selectedStatus.value.length === statusOptions.length) {
        selectedStatus.value = [];
      } else {
        selectedStatus.value = [...statusOptions];
      }
    };

    const exportToCsv = () => {
      const csvHeader = headers.map((header) => header.title).join(",");
      const csvRows = filteredOrders.value.map((order) => {
        return headers
          .map((header) => {
            const value = order[header.key];
            return header.key === "orderDate" ? formatDateTime(value) : value;
          })
          .join(",");
      });

      const csvContent = [csvHeader, ...csvRows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `review_orders_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    async function handleCompleteImport() {
      try {
        //post merged orders to orders db
        const orders = importStore.data.mergedOrders;

        const orderData = orders.map((order) => {
          if (order._id.length < 11) {
            //if order doesn't have an id, then it's a new order and we need to add it to the db
            return {
              ...order,
              _id: undefined,
            };
          } else {
            //if order has an id, then it's an existing order and we need update it
            return order;
          }
        });

        //loading
        loading.value = true;

        await orderDb.bulkInsert(orderData);

        //update import store
        importStore.updateStatus("COMPLETE");

        await importStore.save();

        //reset import store
        importStore.reset();

        loading.value = false;

        notification.create({
          status: "success",
          message: `${orders.length} Orders imported successfully`,
        });
      } catch (error) {
        console.error(error);
        notification.create({
          status: "error",
          message: "Error importing orders",
        });
      }
    }

    const headers = [
      { title: "ID", key: "_id" },
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

    return {
      loading,
      handleCompleteImport,
      importStore,
      headers,
      formatDateTime,
      filteredOrders,
      startDate,
      endDate,
      selectedStatus,
      statusOptions,
      symbolSearch,
      toggleSelectAll,
      exportToCsv,
    };
  },
};
</script>

<style>
</style>