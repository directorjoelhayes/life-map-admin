<template>
  <div class="page-container">
    <template v-if="!loading">
      <v-container>
        <v-row> 
          <v-col class="page-header">
            <h1>
              Portfolios
            </h1>
          </v-col>
        </v-row>
        <!-- <open-trades-stats :strat="strat" /> -->
        <div class="table-container">
          <table v-if="!loading">
            <thead>
              <tr>
                <td>Name</td>
                <td>Account #</td>
                <td>Type</td>
                <td>Balance</td>
                <td>Available Funds</td>
                <td>Day Trading</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="portfolio in portfolios" :key="portfolio._id">
                <td>{{ portfolio.name }}</td>
                <td>{{ portfolio.accountNumber }}</td>
                <td>{{ portfolio.type }}</td>
                <td>${{ formatMoney( portfolio.balance ) }}</td>
                <td>${{ formatMoney( portfolio.availableFunds ) }}</td>
                <td>{{ portfolio.isDayTrader }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-container>
    </template>
    <template v-else>
      <loading-page />
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { portfolioDb } from "/src/databases";
import { formatMoney } from "/src/utils/number-format";
import LoadingPage from '/src/components/ui/loading/LoadingPage.vue';

export default {
  components: {
    LoadingPage
  },
  setup() {
    const loading = ref(true);
    const portfolios = ref([]);

    onMounted(async () => {
      const portfolioData = await portfolioDb.get();

      console.log(portfolioData);

      portfolios.value = portfolioData;

      loading.value = false;
    });

    return {
      loading,
      portfolios,
      formatMoney
    };
  },
};
</script>

<style scoped>
</style>