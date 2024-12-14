<template>
  <div>
    <div
      class="pill"
      :class="[
        globalStore.getPriceMovement(props.element.s),
        { manual: !live },
      ]"
      :id="props.activator"
    >
      <template v-if="live">
        <v-icon v-if="globalStore.getPriceMovement(props.element.s) === 'red'"
          >mdi mdi-arrow-down</v-icon
        >
        <v-icon v-else>mdi mdi-arrow-up</v-icon>
        ${{ formatMoney(globalStore.getStockPrice(props.element.s)) }}
      </template>
      <template v-else>
        <!-- <div :id="props.activator"> -->
        <edit-value
          :editValue="props.element.price ? props.element.price : 0"
          type="number"
          :onBlur="true"
          v-on:value-update="handleValueUpdate"
        >
          <v-icon>mdi mdi-record</v-icon> ${{
            formatMoney(props.element.price ? props.element.price : 0)
          }}
        </edit-value>
        <!-- </div> -->
      </template>
    </div>

    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="end"
      :activator="'#' + props.activator"
    >
      <v-card min-width="300">
        <trading-view :options="options" />

        <v-list>
          <v-list-item>
            <v-switch
              v-model="status"
              v-on:update:modelValue="handleStatusChange"
              color="green"
              :label="getLabel()"
              hide-details
            ></v-switch>
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn variant="text" @click="menu = false"> Cancel </v-btn>
          <v-btn color="primary" variant="text" @click="handleSave">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { ref, watch, onMounted } from "vue";
import { useGlobalStore } from "/src/stores/global-store";
import { formatMoney, formatDate } from "/src/utils/number-format";
import EditValue from "/src/components/ui/forms/EditValue.vue";
import TradingView from "/src/components/trading-view/TradingView.vue";
import VueTradingView from "vue-trading-view";

export default {
  components: { EditValue, TradingView },
  props: ["element", "activator"],
  setup(props, ctx) {

    const menu = ref(false);
    const status = ref(true);

    if (props.element.status === "false") status.value = false;

    const live = ref(status.value);

    const globalStore = useGlobalStore();

    function getLabel() {
      if (status.value === true) return "Live Price Enabled";
      else return "Live Price Disabled";
    }

    function handleSave() {
      let stat = "false";
      if (status.value === true) stat = "true";
      ctx.emit("status-change", stat);
    }

    function handleStatusChange(e) {
      let stat = "false";
      if (e === true) stat = "true";
      ctx.emit("status-change", stat);
    }

    function handleValueUpdate(value) {
      ctx.emit("price-update", value);
    }

    //TODO on exit update status
    watch(menu, (value) => {
      if (value === false) {
        live.value = status.value;
      }
    });

    const options = JSON.stringify({
      symbol: `${props.element.market}:${props.element.s}`,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "3M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });

    return {
      options,
      handleValueUpdate,
      handleStatusChange,
      live,
      getLabel,
      status,
      menu,
      globalStore,
      formatMoney,
      props,
      handleSave,
    };
  },
};
</script>

<style scoped>
.pill.manual {
  background-color: #2a3242;
  color: #ffffff;
  min-width: 80px;
  border-style: none;
  background: none;
}
</style>