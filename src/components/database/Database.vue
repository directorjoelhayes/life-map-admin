<script>
import { ref, onMounted } from "vue";
import DataImport from "./DataImport.vue";
import VirtualTable from "./VirtualTable.vue";
import axios from "axios";

export default {
  name: "Database",
  components: {
    DataImport,
    VirtualTable,
  },
  setup() {
    const tables = ref([
      "Users",
      "Portfolios",
      "Trades",
      "Orders",
      "Balances",
      "GlobalValues",
    ]);
    const selectedTable = ref(null);
    const tableData = ref([]);
    const selectedVersion = ref(null);

    onMounted(() => {
      axios.get("http://localhost:3002/api").then((response) => {
        console.log(response.data);

        tables.value = response.data.endpoints;
      });
    });

    const updateTables = (newTables) => {
      tables.value = newTables;
    };

    const selectTable = (table) => {
      selectedTable.value = table;
      
      // Reset version when table changes
      selectedVersion.value = null;

      // Get available versions for this table
      if (table.versions) {
        // Default to latest version
        const latestVersion = String(Math.max(...Object.keys(table.versions).map(v => Number(v))));
        selectedVersion.value = latestVersion;
        loadTableData(table, latestVersion);
      }
    };

    // New function to handle version changes
    const onVersionChange = (version) => {
      selectedVersion.value = version;
      loadTableData(selectedTable.value, version);
    };

    // Separated data loading logic
    const loadTableData = (table, version) => {
      if (!table || !version) return;
      
      axios.get(`http://localhost:3002${table.versions[version].basePath}`)
        .then((response) => {
          tableData.value = response.data;
        });
    };

    const handleDeleteRows = async (rows) => {
      if (!selectedTable.value || !selectedVersion.value) return;


      
      try {
        console.log(`http://localhost:3002${selectedTable.value.versions[selectedVersion.value].basePath}/batch`);
        // Assuming your API supports batch deletion
        await axios.delete(
          `http://localhost:3002${selectedTable.value.versions[selectedVersion.value].basePath}/batch`,
          { data: { ids: rows.map(row => row._id) } }
        );
        console.log(rows.map(row => row._id))
        // Refresh the table data after deletion
        loadTableData(selectedTable.value, selectedVersion.value);
      } catch (error) {
        console.error('Error deleting rows:', error);
        // You might want to add error handling/notification here
      }
    };

    return {
      tables,
      selectedTable,
      tableData,
      updateTables,
      selectTable,
      selectedVersion,
      onVersionChange,
      handleDeleteRows,
    };
  },
};
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>Database Management</h1>
      <DataImport @update-tables="updateTables" />
    </div>

    <div class="database-content">
      <v-card class="tables-list">
        <v-card-title>Database Tables</v-card-title>
        <v-card-text>
          <div class="tables-grid">
            <v-list-item
              v-for="table in Object.keys(tables)"
              :key="table"
              :value="table"
              :class="['table-item', { selected: selectedTable === table }]"
              @click="selectTable(tables[table])"
            >
              <template v-slot:prepend>
                <v-icon>mdi-table</v-icon>
              </template>
              <v-list-item-title>{{ table }}</v-list-item-title>
            </v-list-item>
          </div>
        </v-card-text>
      </v-card>

      <v-card v-if="selectedTable" class="table-view">
        <v-card-title class="table-header">
          <div class="table-title-row">
            {{ selectedTable }}
            <span>{{ selectedTable.name }}</span>
            <v-select
              v-if="selectedTable.versions"
              v-model="selectedVersion"
              :items="Object.keys(selectedTable.versions)"
              label="Version"
              density="comfortable"
              class="version-select"
              @update:model-value="onVersionChange"
            />
          </div>
        </v-card-title>
        <v-card-text class="table-container">
          <VirtualTable 
            :data="tableData" 
            @delete-rows="handleDeleteRows"
          />
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.database-content {
  margin-top: 2rem;
  display: grid;
  gap: 2rem;
}

.tables-list {
  background-color: var(--block-background-color) !important;
  border: 1px solid var(--border-color);
}

.table-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-item:hover {
  background-color: var(--bg-light-color);
}

.table-item.selected {
  background-color: var(--primary-color);
  color: white;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.table-view {
  background-color: var(--block-background-color) !important;
  border: 1px solid var(--border-color);
}

.table-container {
  height: 500px;
  padding: 0;
}

.table-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.version-select {
  width: 150px;
}
</style> 