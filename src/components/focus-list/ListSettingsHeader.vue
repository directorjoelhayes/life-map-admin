<template>
  <v-container fluid>
    <v-row>
      <v-col xl="6">
        <v-card variant="outlined">
          <div class="global-header">
            <div class="col">
              <h3>Risk Allowance</h3>
              <edit-value
                type="number"
                :editValue="globalStore.getValue('riskAllowance')"
                :onBlur="true"
                v-on:value-update="handleGlobalUpdate('riskAllowance', $event)"
                class="heading"
              >
                <h2>
                  {{
                    formatMoney(globalStore.getValue("riskAllowance") * 100)
                  }}%
                </h2>
                <v-icon>mdi mdi-pencil</v-icon>
              </edit-value>
            </div>
            <v-divider vertical />
            <div class="col">
              <h3>Total Capitol</h3>
              <edit-value
                type="number"
                :editValue="globalStore.getValue('totalCapitol')"
                :onBlur="true"
                v-on:value-update="handleGlobalUpdate('totalCapitol', $event)"
                class="heading disable-private"
              >
                <h2 class="private">
                  <span
                    >${{
                      formatMoney(globalStore.getValue("totalCapitol"))
                    }}</span
                  >
                </h2>
                <v-icon class="hide-private">mdi mdi-pencil</v-icon>
              </edit-value>
            </div>
            <v-divider vertical />
            <div class="col">
              <h3>Max Position Percent</h3>
              <edit-value
                type="number"
                :editValue="globalStore.getValue('maxPositionSize')"
                :onBlur="true"
                v-on:value-update="
                  handleGlobalUpdate('maxPositionSize', $event)
                "
                class="heading"
              >
                <h2>
                  {{
                    formatMoney(globalStore.getValue("maxPositionSize") * 100)
                  }}%
                </h2>
                <v-icon>mdi mdi-pencil</v-icon>
              </edit-value>
            </div>
            <v-divider vertical />
            <div class="col">
              <h3>Alert Threshold</h3>
              <edit-value
                type="number"
                :editValue="globalStore.getValue('alertThreshold')"
                :onBlur="true"
                v-on:value-update="handleGlobalUpdate('alertThreshold', $event)"
                class="heading"
              >
                <h2>
                  {{
                    formatMoney(globalStore.getValue("alertThreshold") * 100)
                  }}%
                </h2>
                <v-icon>mdi mdi-pencil</v-icon>
              </edit-value>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
//import { ref, reactive, onMounted, onUnmounted, onBeforeUnmount, watch, computed, nextTick } from "vue"
import { formatMoney } from "/src/utils/number-format";
import { useGlobalStore } from "/src/stores/global-store.js";
import { globalValueDb } from "/src/databases";
import EditValue from "../ui/forms/EditValue.vue";

export default {
  components: {
    EditValue,
  },
  setup(props, ctx) {
    const globalStore = useGlobalStore();

    function handleGlobalUpdate(field, value) {
      //FEATURE ensure value is returned back into string, you might json parse here as well,
      //probabably should be handled elsewhere, not sure
      const previousValue = globalStore.getValue(field);

      globalStore.updateValue(field, String(value));
      
      const modal = {
        value: async () => {
          try {
            globalValueDb.update(globalStore.data[field]);
            notification.create({
              status: "success",
              message: `${field.toUpperCase()} has been updated.`,
            });
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }
        },
        cancelAction: () => {
          globalStore.updateValue(field, String(previousValue));
        },
        message: `Are you sure you want to update ${field}?`,
      };

      ctx.emit("confirm-modal", modal);
      
    }

    return {
      globalStore,
      formatMoney,
      handleGlobalUpdate,
    };
  },
};
</script>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: space-between;
  padding: 20px;
}
.global-header .col {
  padding: 30px;
  border-color: #2d333f;
}
.global-header .col:last-child {
  border-right: none;
}
.editable.heading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.editable.heading i {
  color: var(--accent-two);
}
</style>