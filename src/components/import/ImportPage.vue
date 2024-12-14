<template>
  <div class="page-container window-height">
    <h2>Import CSV</h2>
    <v-container>
      <v-stepper :model-value="step" flat>
        <v-stepper-header>
          <v-stepper-item title="Upload File" :value="1" :complete="false" />

          <v-divider></v-divider>

          <v-stepper-item subtitle="" title="Map Fields" :value="2" />

          <v-divider></v-divider>

          <v-stepper-item subtitle="" title="Merge Orders" :value="3" />

          <v-divider></v-divider>

          <v-stepper-item title="Review And Import" :value="4" />
        </v-stepper-header>
      </v-stepper>
    </v-container>
    <div class="page-content">
      <UploadOrdersCSV
        v-if="step === 1"
        v-on:pasted="handlePasted"
        v-on:files="handleFiles"
      />
      <MapFields v-if="step === 2" :csvStore="uniqueName">
        <v-btn size="large" @click="handleCancel"> Back </v-btn>
        <v-btn size="large" @click="handleCompleteMap"> Next </v-btn>
      </MapFields>
      <MergeOrders v-if="step === 3" :importStoreId="uniqueName" />
      <ReviewOrders v-if="step === 4" :importStoreId="uniqueName">
        <v-btn size="large" @click="handleCancel"> Back </v-btn>
        <v-btn size="large" @click="handleNext"> Next </v-btn>
      </ReviewOrders>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, onMounted, toRef } from "vue";
import UploadOrdersCSV from "./UploadOrdersCSV.vue";
import { parseText, toJson, cleanText, parseCSV } from "./csvUtils";
import { formatDate } from "/src/utils/number-format";
import MapFields from "./MapFields.vue";
import { makeImportStore } from "/src/stores/import-store";
import makeId from "/src/utils/make-id";
import { importDb } from "/src/databases";
import MergeOrders from "/src/components/orders/MergeOrders.vue";
import ReviewOrders from "./ReviewOrders.vue";

const uniqueName = makeId(10);
const importStore = makeImportStore(uniqueName)();
const step = toRef(importStore, "step");
const isLoading = ref(false);

const handlePasted = (pastedText) => {
  // Process the pasted text (For demonstration, let's just console log it)
  const parsedData = parseText(pastedText);
  const rawHeader = parsedData[0];
  const rawRows = parsedData.slice(1);
  
  const rows = toJson(rawHeader, rawRows);

  console.log(toJson(rawHeader, rawRows), "rows");

  importStore.updateKey("rows", rows);
  importStore.updateKey(
    "header",
    rawHeader.map((string) => {
      if (!string) return "";
      return cleanText(string);
    })
  );



  importStore.updateKey("mapOptions", createMapOptions());

  autoSelectMatches();
  //parsed succesfully
  importStore.updateStep(2);

  importStore.updateStatus("PARTIAL");

  importStore.save();
};

function createMapOptions() {
  return {
    to: importStore.data.mappedHeader.map((item) => {
      return {
        value: item[0],
        title: item[1],
      };
    }),
  };
}
function autoSelectMatches() {

  importStore.data.header.map((str) => {
    const find = importStore.data.mappedHeader.findIndex((item) => {
      return item[1].trim().toLowerCase() === str.trim().toLowerCase();
    });

    if (find != -1) {
      importStore.updateMapItem(str, importStore.data.mappedHeader[find][0]);
    }
  });
}

const handleFiles = (files) => {
  try {
    for (const file of files) {
      console.log("File name:", file.name);
      console.log("File type:", file.type);
      console.log("File size:", file.size, "bytes");
      if (file.type === "text/csv") {
        const reader = new FileReader();
        reader.onload = function (e) {
          const csvContent = e.target.result;
          console.log("CSV content:", csvContent);

          // Now you can use the CSV content as needed
          // For example, you might want to parse the CSV data
          const { header, rows } = parseCSV(csvContent);
          importStore.updateKey("rows", rows);
          importStore.updateKey("header", header);
          importStore.updateKey("mapOptions", createMapOptions());
          //parsed succesfully

          autoSelectMatches();

          importStore.updateStep(2);
          importStore.updateStatus("PARTIAL");

          importStore.save();
        };

        reader.readAsText(file);
      } else {
        throw "Unsupported file type. Please drop a CSV file.";
      }
    }
  } catch (err) {
    alert(err);
  }
};

function handleCompleteMap() {
  function convertType(key, value) {
    const methods = {
      stringToNumber(val) {
        // First remove the $ symbol, then remove commas, then convert to number
        return Number(val.replace(/\$/g, '').replace(/,/g, ''));
      },
      stringToDate(val) {
        return new Date(val).getTime();
      },
      toUpperCase(val) {
        return String(val).toUpperCase();
      },
      Number(val) {
        return Number(val);
      },
      String(val) {
        return String(val);
      },
    };
    
    const row = importStore.data.mappedHeader.find((arr) => arr[0] === key);
    if (!row) return false;
    return methods[row[2]](value);
  }
  try {
    // First map the rows normally
    const mappedRows = importStore.data.rows
      .map((row) => {
        return Object.keys(importStore.data.map).reduce((obj, key) => {
          if(!obj._id) obj._id = makeId(10);
          const value = row[key];
          if (!value) return obj;
          const typedValue = convertType(importStore.data.map[key], value);
          if (typedValue === false) return obj;
          obj[importStore.data.map[key]] = typedValue;
          return obj;
        }, {});
      })
      .filter((obj) => Object.keys(obj).length);

    // Group orders by date and symbol
    const groupedOrders = mappedRows.reduce((groups, order, index) => {
      const key = `${order.date}_${order.symbol}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...order, originalIndex: index });
      return groups;
    }, {});

    // Add time increments for duplicate date/symbol combinations
    const adjustedRows = mappedRows.map((order, index) => {
      const key = `${order.date}_${order.symbol}`;
      const group = groupedOrders[key];
      
      if (group.length > 1) {
        // Find position in group based on original index
        const position = group.findIndex(item => item.originalIndex === index);
        // Add incremental milliseconds based on position
        const adjustedDate = order.date + (position * 100);
        return { ...order, date: adjustedDate };
      }
      
      return order;
    });

    importStore.updateKey("mappedRows", adjustedRows);
    importStore.updateStep(3);
  } catch (err) {
    console.log(err);
  }
}

function handleCompleteMerge() {


  importStore.updateStep(4);
}

onMounted(async () => {
  try {
    isLoading.value = true;
    const latestPending = await importDb.getLatestPartial();
    console.log(latestPending);
    if (!latestPending) {
      isLoading.value = false;
      return;
    }
    // Update store with latest pending import
    importStore.updateFromPending(latestPending);

    isLoading.value = false;
  } catch (err) {
    console.log(err);
  } finally {
    isLoading.value = false;
  }
});

// Add cleanup when component is unmounted
onUnmounted(() => {
  // Assuming you have a method to dispose of the store
  importStore.dispose(); // You'll need to implement this in your store
});

function convertType(type, value) {
  if (!value) return false;
  switch (type) {
    case "date":
      return new Date(value).getTime();
    case "number":
      return Number(value);
    case "string":
      return String(value);
    default:
      return value;
  }
}
</script>

<style scoped>
.page-content {
    flex: 1;
    display: flex;
    flex-flow: column;
    position: relative;
    min-height: 0;
}
.page-content > * {
    flex: 1;
    min-height: 0;
}
:deep(.v-col.button-row) {
  display: flex;
  justify-content: space-between;
}
</style>