<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

export default {
  name: 'VirtualTable',
  props: {
    data: {
      type: Array,
      required: true
    },
    rowHeight: {
      type: Number,
      default: 48
    }
  },
  emits: ['delete-rows'],
  setup(props, { emit }) {
    const containerRef = ref(null);
    const scrollTop = ref(0);
    const viewportHeight = ref(0);
    const selectedRows = ref(new Set());

    const columns = computed(() => {
      if (!props.data.length) return [];
      return Object.keys(props.data[0]);
    });

    const visibleRows = computed(() => {
      const start = Math.floor(scrollTop.value / props.rowHeight);
      const count = Math.ceil(viewportHeight.value / props.rowHeight) + 1;
      const end = Math.min(start + count, props.data.length);
      
      return props.data.slice(start, end).map((row, index) => ({
        index: start + index,
        data: row,
        selected: selectedRows.value.has(start + index)
      }));
    });

    const totalHeight = computed(() => props.data.length * props.rowHeight);

    const handleScroll = (event) => {
      scrollTop.value = event.target.scrollTop;
    };

    const toggleRowSelection = (index) => {
      if (selectedRows.value.has(index)) {
        selectedRows.value.delete(index);
      } else {
        selectedRows.value.add(index);
      }
    };

    const deleteSelected = () => {
      const rowsToDelete = Array.from(selectedRows.value).map(index => props.data[index]);
      console.log(rowsToDelete);
      emit('delete-rows', rowsToDelete);
      selectedRows.value.clear();
    };

    const updateViewportHeight = () => {
      if (containerRef.value) {
        viewportHeight.value = containerRef.value.clientHeight;
      }
    };

    onMounted(() => {
      updateViewportHeight();
      window.addEventListener('resize', updateViewportHeight);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateViewportHeight);
    });

    const selectAll = ref(false);

    const toggleSelectAll = () => {
      selectAll.value = !selectAll.value;
      selectedRows.value.clear();
      
      if (selectAll.value) {
        for (let i = 0; i < props.data.length; i++) {
          selectedRows.value.add(i);
        }
      }
    };

    watch(selectedRows, (newValue) => {
      selectAll.value = newValue.size === props.data.length && props.data.length > 0;
    });

    return {
      containerRef,
      columns,
      visibleRows,
      totalHeight,
      handleScroll,
      toggleRowSelection,
      deleteSelected,
      selectedRows,
      selectAll,
      toggleSelectAll
    };
  }
};
</script>

<template>
  
  <div class="virtual-table">
    <div class="table-toolbar" v-if="selectedRows.size > 0">
      <v-btn
        color="error"
        variant="tonal"
        size="small"
        prepend-icon="mdi-delete"
        @click="deleteSelected"
      >
        Delete Selected ({{ selectedRows.size }})
      </v-btn>
    </div>

    <div class="table-header">
      <div class="header-cell checkbox-cell">
        <v-checkbox
          value="selectAll"
          density="compact"
          hide-details
          @change="toggleSelectAll"
        />
      </div>
      <div
        v-for="column in columns"
        :key="column"
        class="header-cell"
      >
        {{ column }}
      </div>
    </div>
    
    <div
      ref="containerRef"
      class="table-body"
      @scroll="handleScroll"
    >
      <div
        class="table-content"
        :style="{ height: `${totalHeight}px` }"
      >
        <div
          v-for="row in visibleRows"
          :key="row.index"
          class="table-row"
          :class="{ 'selected': row.selected }"
          :style="{ transform: `translateY(${row.index * rowHeight}px)` }"
        >
          <div class="table-cell checkbox-cell">
            <v-checkbox
              v-model="row.selected"
              density="compact"
              hide-details
              @change="toggleRowSelection(row.index)"
            />
          </div>
          <div
            v-for="column in columns"
            :key="column"
            class="table-cell"
          >
            {{ row.data[column] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--block-background-color);
}

.table-toolbar {
  padding: 0.5rem 1rem;
  background-color: var(--bg-light-color);
  border-bottom: 1px solid var(--border-color);
}

.table-header {
  display: flex;
  padding: 0.75rem 1rem;
  background-color: var(--bg-light-color);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
}

.header-cell {
  flex: 1;
  min-width: 150px;
  padding: 0 0.5rem;
}

.checkbox-cell {
  flex: 0 0 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}

.table-content {
  position: relative;
}

.table-row {
  display: flex;
  position: absolute;
  left: 0;
  right: 0;
  padding: 0.75rem 1rem;
  background-color: var(--block-background-color);
}

.table-row:hover {
  background-color: var(--bg-light-color);
}

.table-row.selected {
  background-color: var(--primary-color-light);
}

.table-cell {
  flex: 1;
  min-width: 150px;
  padding: 0 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>