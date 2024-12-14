<template>
  <div class="content" ref="notificationRef" :style="getStyles">
    <v-icon :icon="getIconFromStatus(item.status)" />
    <div class="message">{{ item.message }}</div>
  </div>
</template>

  <script>
import { ref, onMounted, nextTick, computed } from "vue";

export default {
  props: {
    item: Object,
  },
  setup({ item }) {
    const notificationRef = ref(null);
    const itemWidth = ref(0);

    onMounted(() => {
      if (notificationRef.value) {
        nextTick(() => {
          itemWidth.value = notificationRef.value.getBoundingClientRect().width;
        });
      }
    });

    const getStyles = computed(() => {
      if (itemWidth.value) {
        return {
          width: `${itemWidth.value}px`,
        };
      } else {
        return {
          width: "auto",
        };
      }
    });

    /**
     * Returns the corresponding icon name based on the status value.
     *
     * @param {string} value - The status value which can be either "success" or "error".
     * @returns {string} - The icon name corresponding to the status value.
     */
    function getIconFromStatus(value) {
      if (value === "success") return "mdi-check-circle-outline";
      if (value === "error") return "mdi-alpha-x-circle-outline";
    }

    return {
      notificationRef,
      itemWidth,
      getIconFromStatus,
      item,
      getStyles
    };
  },
};
</script>