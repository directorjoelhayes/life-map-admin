<script>
import { ref } from 'vue';

export default {
  name: 'DataImport',
  emits: ['update-tables'],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const error = ref('');

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.type !== 'application/json') {
        error.value = 'Please upload a JSON file';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          const tables = Object.keys(content);
          emit('update-tables', tables);
          error.value = '';
        } catch (err) {
          error.value = 'Invalid JSON file';
        }
      };
      reader.readAsText(file);
    };

    return {
      fileInput,
      error,
      handleFileUpload
    };
  }
};
</script>

<template>
  <div class="data-import">
    <v-btn
      color="primary"
      prepend-icon="mdi-upload"
      @click="fileInput.click()"
    >
      Import JSON
    </v-btn>
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      class="hidden-input"
      @change="handleFileUpload"
    >
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.data-import {
  margin-bottom: 1rem;
}

.hidden-input {
  display: none;
}

.error-message {
  color: var(--error-color);
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
</style> 