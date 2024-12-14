<template>
  <div class="page-container">
    <v-container fluid>
      <v-row>
        <!-- {{ strat }}
        {{ tableData }}
        {{ store.strategies }} -->
        <v-col v-if="strat">
          <virtual-table
            v-on:open-modal="handleOpenModal" 
            :tableData="store.trades">
          </virtual-table>
        </v-col>
      </v-row>
    </v-container>
    <Modal
      :open="modals.closedTrade"
      v-on:close="handleModalClose('closedTrade')"
      class="center"
    >
      <simple-form>
        <closed-trade-modal
          v-if="modals.closedTrade"
          :trade="modals.closedTrade"
          v-on:close="handleModalClose('closedTrade')" />
      </simple-form>
    </Modal>
  </div>
</template>

<script>
import { onMounted, computed, ref, reactive } from "vue";
import VirtualTable from "./ClosedTradesTable.vue";
import { tradesDb, strategyDb, orderDb, portfolioDb } from "/src/databases";
import { useClosedTrades } from "/src/stores/closed-trades";
import {
    getFirstDayOfYear
} from "/src/utils/date-methods.js"
import {
  getProfits,
  getSummary,
  averageWinR,
  averageLossR,
  averageProfit,
  averageLoss,
  averageHoldLoss,
  averageHoldWin,
  battingAverage,
  averageStop,
} from "../../utils/finance-formulas";
import Modal from "/src/components/ui/modals/Modal.vue";
import SimpleForm from "/src/components/ui/forms/SimpleForm.vue";
import ClosedTradeModal from './ClosedTradeModal.vue';


export default {
  components: { 
    VirtualTable,
    Modal,
    SimpleForm,
    ClosedTradeModal 
  },
  setup() {
    const store = useClosedTrades();
    const strat = ref(false);

    const dateFilter = reactive({
      startDate: getFirstDayOfYear(),
      endDate: Date.now(),
    });

    const modals = reactive({
      closedTrade: false,
    });

    function handleModalClose(key) {
      modals[key] = false;
    }

    const dateRange = reactive({
      value: "YTD",
    });

    onMounted(async () => {
      try {
        const strategies = await strategyDb.get();
        const portfolios = await portfolioDb.get();

        console.log(orderDb, tradesDb, "databases!!");

        // dateFilter.startDate = new Date("2024-06-01").getTime();
        // dateFilter.endDate = new Date("2024-07-01").getTime();


        const trades = await orderDb.getClosedTrades({
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
        });

        console.log(trades, "trades!!");
        if (trades) store.setValue("trades", trades);
        if (portfolios) store.setValue("portfolios", portfolios);
        if (strategies) {
          store.setValue("strategies", strategies);
          strat.value = strategies[0]._id;
        }

        // await getTrades();
      } catch (err) {
        console.log(err);
      }
    });

    const handleOpenModal = (trade) => {
      modals.closedTrade = trade;
    };

    return {
      handleOpenModal,
      store,
      strat,
      modals,
      handleModalClose
    };
  },
};
</script>

<style scoped>
</style>