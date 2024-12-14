<template>
  <div class="page-container">
    <h1>Order Details</h1>
    <div class="order-details">
      <pre v-if="order" class="language-json"><code>{{ formattedOrder }}</code></pre>
      <p v-else>Loading...</p>
    </div>
  </div>
</template>

<script>
import { orderDb } from "/src/databases";
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // Choose your preferred theme
import 'prismjs/components/prism-json'; // Add JSON language support

export default {
  data() {
    return {
      order: null
    }
  },
  
  computed: {
    formattedOrder() {
      return JSON.stringify(this.order, null, 2);
    }
  },
  
  async created() {
    try {
      this.order = await orderDb.getRawOrder(this.$route.params.id);
      // Need to wait for next tick to ensure DOM is updated
      this.$nextTick(() => {
        Prism.highlightAll();
      });
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }
}
</script>

<style>
.order-details pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
