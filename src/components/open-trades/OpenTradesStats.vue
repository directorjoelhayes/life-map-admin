<template>
  <v-row class="stats">
    <v-col xl="3" lg="6" md="6" sm="12">
      <v-card variant="outlined">
        <div class="stat-card">
          <div class="heading">
            <div class="left"><h3>Heat</h3></div>
            <div class="right">
              <div class="icon orange">
                <v-icon>mdi mdi-fire</v-icon>
              </div>
              <h2>
                {{
                  formatPercentage(
                    getHeat(
                      store.getTradesByStrategy(strat._id),
                      globalStore.stocks
                    ) / globalStore.getValue(strat.portfolios[0] + "Value")
                  )
                }}%
              </h2>
            </div>
          </div>
          <div class="body">
            <div class="icon large orange">
              <v-icon>mdi mdi-fire</v-icon>
            </div>
            <div class="value">
              <h2 class="private">
                <span
                  >${{
                    formatMoney(
                      getHeat(
                        store.getTradesByStrategy(strat._id),
                        globalStore.stocks
                      )
                    )
                  }}</span
                >
              </h2>
            </div>
          </div>
        </div>
      </v-card>
    </v-col>
    <v-col xl="3" lg="6" md="6">
      <v-card variant="outlined">
        <div class="stat-card">
          <div class="heading">
            <div class="left"><h3>Exposure</h3></div>
            <div class="right">
              <div class="icon purple">
                <v-icon>mdi mdi-chart-timeline-variant</v-icon>
              </div>
              <h2>
                {{
                  formatPercentage(
                    getExposure(
                      store.getTradesByStrategy(strat._id),
                      globalStore.stocks
                    ) / globalStore.getValue(strat.portfolios[0] + "Value")
                  )
                }}%
              </h2>
            </div>
          </div>
          <div class="body">
            <div class="icon large purple">
              <v-icon>mdi mdi-chart-timeline-variant</v-icon>
            </div>
            <div class="value">
              <h2 class="private">
                <span
                  >${{
                    formatMoney(
                      getExposure(
                        store.getTradesByStrategy(strat._id),
                        globalStore.stocks
                      )
                    )
                  }}</span
                >
              </h2>
            </div>
          </div>
        </div>
      </v-card>
    </v-col>
    <v-col>
      <v-card variant="outlined">
        <div class="stat-card">
          <div class="heading">
            <div class="left"><h3>Account Balance</h3></div>
            <div class="right">
              <div class="icon purple">
                <v-icon>mdi mdi-chart-timeline-variant</v-icon>
              </div>
              <h2>
                {{
                  formatPercentage(
                    getExposure(
                      store.getTradesByStrategy(strat._id),
                      globalStore.stocks
                    ) / globalStore.getValue(strat.portfolios[0] + "Value")
                  )
                }}%
              </h2>
            </div>
          </div>
          <div class="body variant">
            <div class="value">
              <div class="sub-text">Current Balance</div>
              <edit-value
                type="number"
                :editValue="globalStore.getValue(strat.portfolios[0] + 'Value')"
                :onBlur="true"
                v-on:value-update="
                  handleGlobalUpdate(strat.portfolios[0] + 'Value', $event)
                "
                class="heading disable-private"
              >
                <h2 class="private">
                  <span
                    >${{
                      formatMoney(
                        globalStore.getValue(strat.portfolios[0] + "Value")
                      )
                    }}</span
                  >
                </h2>
                <v-icon class="hide-private">mdi mdi-pencil</v-icon>
              </edit-value>
            </div>
            <div class="value">
              <div class="sub-text">MTD Starting Balace</div>

              <span
                ><edit-value
                  type="number"
                  :editValue="
                    globalStore.getValue(strat.portfolios[0] + 'ValueMTD')
                  "
                  :onBlur="true"
                  v-on:value-update="
                    handleGlobalUpdate(strat.portfolios[0] + 'ValueMTD', $event)
                  "
                  class="heading disable-private"
                >
                  <h2 class="private">
                    <span
                      >${{
                        formatMoney(
                          globalStore.getValue(strat.portfolios[0] + "ValueMTD")
                        )
                      }}</span
                    >
                  </h2>
                  <v-icon class="hide-private">mdi mdi-pencil</v-icon>
                </edit-value></span
              >

              <div class="change-row">
                <div class="private">
                  <span class="medium"
                    >${{
                      getChange(
                        strat.portfolios[0] + "Value",
                        strat.portfolios[0] + "ValueMTD"
                      )
                    }}</span
                  >
                </div>
                <div>
                  <span
                    class="pill"
                    :class="
                      getChangeClass(
                        strat.portfolios[0] + 'Value',
                        strat.portfolios[0] + 'ValueMTD'
                      )
                    "
                    >{{
                      getPercentChange(
                        strat.portfolios[0] + "Value",
                        strat.portfolios[0] + "ValueMTD"
                      )
                    }}%
                  </span>
                </div>
              </div>
            </div>
            <div class="value">
              <div class="sub-text">YTD Starting Balance</div>
              <edit-value
                type="number"
                :editValue="
                  globalStore.getValue(strat.portfolios[0] + 'ValueYTD')
                "
                :onBlur="true"
                v-on:value-update="
                  handleGlobalUpdate(strat.portfolios[0] + 'ValueYTD', $event)
                "
                class="heading disable-private"
              >
                <h2 class="private">
                  <span
                    >${{
                      formatMoney(
                        globalStore.getValue(strat.portfolios[0] + "ValueYTD")
                      )
                    }}</span
                  >
                </h2>
                <v-icon class="hide-private">mdi mdi-pencil</v-icon>
              </edit-value>
              <div class="change-row">
                <div class="private">
                  <span class="medium"
                    >${{
                      getChange(
                        strat.portfolios[0] + "Value",
                        strat.portfolios[0] + "ValueYTD"
                      )
                    }}</span
                  >
                </div>
                <span
                  class="pill"
                  :class="
                    getChangeClass(
                      strat.portfolios[0] + 'Value',
                      strat.portfolios[0] + 'ValueYTD'
                    )
                  "
                >
                  {{
                    getPercentChange(
                      strat.portfolios[0] + "Value",
                      strat.portfolios[0] + "ValueYTD"
                    )
                  }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { useOpenTrades } from "/src/stores/open-trades";
import { useGlobalStore } from "/src/stores/global-store";
import { getHeat, getExposure } from "/src/core/financial-formulas";
import { formatMoney, formatPercentage } from "/src/utils/number-format";
import EditValue from '/src/components/ui/forms/EditValue.vue';

export default {
  props: ["strat"],
  components: {
    EditValue
  },
  setup({ strat }) {
    const store = useOpenTrades();
    const globalStore = useGlobalStore();

    function getChangeClass(a, b) {
      if (globalStore.getValue(a) - globalStore.getValue(b) < 0) return "red";
      else return "green";
    }
    function getPercentChange(a, b) {
      const percentage =
        ((globalStore.getValue(a) - globalStore.getValue(b)) /
          globalStore.getValue(b)) *
        100;
      return formatMoney(percentage);
    }
    function getChange(a, b) {
      return formatMoney(globalStore.getValue(a) - globalStore.getValue(b));
    }

    return {
      getChangeClass,
      getPercentChange,
      getHeat,
      getChange,
      formatMoney,
      formatPercentage,
      getExposure,
      strat,
      store,
      globalStore,
    };
  },
};
</script>

<style scoped>
.editable.heading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.editable.heading i {
  color: var(--accent-two);
}
.v-row.stats .v-card {
  height: 100%;
}

.stat-card {
  padding: 20px;
}
.stat-card {
  height: 100%;
  justify-content: space-between;
}
.chart-variant .left {
  display: flex;
  text-align: left;
}
.stat-card .body.variant {
  display: flex;
  width: 100%;
  align-items: unset;
}
.body.variant .sub-text {
  color: var(--secondary-text-color);
  font-family: "Open Sans";
  font-weight: 500;
  font-size: 17px;
}
.body.variant .value {
  flex: 1;
  border-right-style: solid;
  border-color: var(--border-color);
}
.body.variant .value:last-child {
  border-right: none;
}
.change-row {
  margin: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.change-row .medium {
  font-size: 22px;
  font-family: "Open Sans";
  font-weight: 500;
  color: #e9e9e9 !important;
}
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.heading h3 {
  font-size: 25px;
  font-family: "Open Sans";
  font-weight: 500;
  color: #e9e9e9 !important;
}
.heading h2 {
  font-size: 25px;
}
.stat-card .right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon.large {
  width: 50px;
  height: 50px;
  font-size: 25px;
}
.icon {
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
}
.icon.orange {
  background-color: #e76a37;
}
.icon.purple {
  background-color: var(--accent-two);
}
.stat-card .body {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.stat-card .body h2,
h2.large {
  font-size: 34px;
  font-weight: 500;
}
.stat-card {
  display: flex;
  flex-flow: column;
  gap: 35px;
}
/* reduced padding */
.pill {
  padding: 2px 10px;
}

.v-col.strategy-head {
  text-align: left;
}
</style>