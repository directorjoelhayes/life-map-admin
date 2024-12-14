<script>
import { ref, onMounted, reactive } from "vue";
import axios from "axios";

export default {
  name: "Routes",
  setup() {
    const routes = reactive({});
    const selectedRoute = ref(null);
    const routeDetails = ref(null);

    alert("mounted");

    onMounted(() => {
    alert("mounted");
      axios.get("http://localhost:3002/api").then((response) => {
        console.log(response.data, "data");
        
        Object.assign(routes, response.data.endpoints);
      });
    });

    const selectRoute = (route) => {
      selectedRoute.value = route;
      if (route.versions) {
        routeDetails.value = Object.entries(route.versions).map(([version, details]) => ({
          version,
          path: details.basePath,
          methods: details.methods || [],
        }));
      }
    };

    return {
      routes,
      selectedRoute,
      routeDetails,
      selectRoute,
    };
  },
};
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>API</h1>
    </div>
    {{ routes }}
    <div class="routes-content">
      <v-card class="routes-list">
        <v-card-title>Available Routes</v-card-title>
        <v-card-text>
            {{ routes }}
          <div class="routes-grid" v-if="routes">
            <v-list-item
              v-for="route in Object.keys(routes)"
              :key="route"
              :value="route"
              :class="['route-item', { selected: selectedRoute === routes[route] }]"
              @click="selectRoute(routes[route])"
            >
              <template v-slot:prepend>
                <v-icon>mdi-api</v-icon>
              </template>
              <v-list-item-title>{{ route }}</v-list-item-title>
            </v-list-item>
          </div>
        </v-card-text>
      </v-card>

      <v-card v-if="selectedRoute" class="route-details">
        <v-card-title>
          {{ selectedRoute.name }}
        </v-card-title>
        <v-card-text>
          <div v-if="routeDetails" class="version-details">
            <div v-for="detail in routeDetails" :key="detail.version" class="version-item">
              <h3>Version {{ detail.version }}</h3>
              <div class="path">Base Path: {{ detail.path }}</div>
              <div class="methods">
                Available Methods:
                <v-chip
                  v-for="method in detail.methods"
                  :key="method"
                  :color="getMethodColor(method)"
                  class="ma-1"
                >
                  {{ method }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.routes-content {
  margin-top: 2rem;
  display: grid;
  gap: 2rem;
}

.routes-list {
  background-color: var(--block-background-color) !important;
  border: 1px solid var(--border-color);
}

.route-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.route-item:hover {
  background-color: var(--bg-light-color);
}

.route-item.selected {
  background-color: var(--primary-color);
  color: white;
}

.routes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.route-details {
  background-color: var(--block-background-color) !important;
  border: 1px solid var(--border-color);
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.version-item {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.path {
  margin: 0.5rem 0;
  font-family: monospace;
}

.methods {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
<!-- 
<script setup>
const getMethodColor = (method) => {
  const colors = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'info'
  };
  return colors[method] || 'grey';
};
</script> -->