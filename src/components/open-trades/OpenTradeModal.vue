<template>
  <div class="simple-form" v-on:mousedown.stop="" v-on:mouseup.stop="">
    <v-container>
      <v-row>
        <v-col class="modal-header">
          <h2>{{ trade.s }}</h2>
          <div class="status">
            {{ status }}
          </div>
        </v-col>
      </v-row>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <td>Order Date</td>
              <td>Order Type</td>
              <td>Shares</td>
              <td>Price</td>
              <td>Stop</td>
              <td>Portfolio</td>
              <td>Fees</td>
              <td>Total</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr
              class="order-row"
              v-for="order of trade.orders"
              :key="order._id"
            >
              <td class="date">
                <edit-value
                  :editValue="order.date"
                  :rules="buildTradeDateRules(trade, order)"
                  ref=""
                  type="datetime-local"
                  :onBlur="true"
                  v-on:value-update="
                    handleOrderValueUpdate($event, order, 'date')
                  "
                >
                  <calendar-icon />{{ formatDate(order.date) }}
                </edit-value>
              </td>
              <td>
                <v-icon :class="order.type.toLowerCase()">mdi mdi-circle</v-icon
                >{{ order.type }}
              </td>
              <td>
                <edit-value
                  :editValue="order.shares"
                  type="number"
                  :onBlur="true"
                  v-on:value-update="
                    handleOrderValueUpdate($event, order, 'shares')
                  "
                >
                  {{ order.shares }}
                </edit-value>
              </td>
              <td>
                <edit-value
                  :editValue="order.price"
                  type="number"
                  :onBlur="true"
                  v-on:value-update="
                    handleOrderValueUpdate($event, order, 'price')
                  "
                >
                  ${{ formatMoney(order.price) }}
                </edit-value>
              </td>
              <td>
                <edit-value
                  :editValue="order.stop"
                  type="number"
                  :onBlur="true"
                  v-on:value-update="
                    handleOrderValueUpdate($event, order, 'stop')
                  "
                >
                  ${{ formatMoney(order.stop) }}
                </edit-value>
              </td>
              <td>
                <!-- TODO switch to store -->
                <!-- {{ getPortfolioInfo(order.portfolio)?.name }} -->
              </td>
              <td>
                <edit-value
                  :editValue="order.fee"
                  type="number"
                  :onBlur="true"
                  v-on:value-update="
                    handleOrderValueUpdate($event, order, 'fee')
                  "
                >
                  ${{ formatMoney(order.fee) }}
                </edit-value>
              </td>
              <td>${{ formatMoney(order.shares * order.price) }}</td>
              <td>
                <v-btn
                  v-on:click="handleTrashClick(order)"
                  flat
                  color="transparent"
                  icon="mdi-trash-can"
                />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div></div>
              </td>
              <td>
                <div></div>
              </td>
              <td>
                {{ trade.orders.reduce((a, o) => (a += o.shares), 0) }}
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                ${{
                  formatMoney(
                    trade.orders.reduce((a, o) => (a += o.shares * o.price), 0)
                  )
                }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <v-row>
        <v-col class="buttons">
          <v-btn v-on:click="handleBuySellClick" color="var(--accent-two)"
            >Buy / Sell</v-btn
          >
        </v-col>
      </v-row>
      <v-row>
        <expandable>
          <div v-show="buyForm">
            <!-- FEATURE add a max shares button to sell all -->
            <BuySellStockForm
              v-on:order-added="handleOrderAdded"
              :open="buyForm"
              v-on:close-modal="buyForm = false"
            />
          </div>
        </expandable>
      </v-row>
    </v-container>
  </div>
  <Modal
    :open="confirmModal"
    v-on:close="confirmModal = !confirmModal"
    class="center"
  >
    <confirmation-pop-up
      :action="confirmAction"
      v-on:reject="confirmModal = !confirmModal"
    >
      Are you sure you'd like to DELETE this order?
    </confirmation-pop-up>
  </Modal>
</template>
  
<script>
import { ref, reactive, onMounted, nextTick, computed } from "vue";
import { formatMoney, formatDate } from "/src/utils/number-format";
import EditValue from "/src/components/ui/forms/EditValue.vue";
import { orderDb } from "/src/databases";
import BuySellStockForm from "/src/components/ui/forms/BuySellStockForm.vue";
import Expandable from "/src/components/ui/expandables/Expandable.vue";
import ConfirmationPopUp from "/src/components/ui/pop-overs/ConfirmationPopUp.vue";
import Modal from "/src/components/ui/modals/Modal.vue";
import CalendarIcon from "/src/components/ui/icons/CalendarIcon.vue";
import { useOpenTrades } from "/src/stores/open-trades";
import { useGlobalStore } from "/src/stores/global-store";
import { useNotifications } from "/src/stores/notifications";
import {
  averageBuyPrice,
  buildTradeDateRules,
} from "../../utils/finance-formulas.js";
import { useRoute } from "vue-router";

export default {
  props: ["open"],
  components: {
    Modal,
    EditValue,
    BuySellStockForm,
    Expandable,
    ConfirmationPopUp,
    CalendarIcon,
  },
  setup(props, ctx) {
    const store = useOpenTrades();
    const notification = useNotifications();
    const trade = props.open;
    const buyForm = ref(false);
    const confirmModal = ref(false);
    const confirmAction = reactive({
      value: false,
    });
    const route = useRoute();

    onMounted(() => {
      if (route.query.buySell) {
        //open buy form
        buyForm.value = trade;
      }
    });

    function handleTrashClick(order) {
      confirmAction.value = async () => {
        try {
          await orderDb.update({
            _id: order._id,
            deleted: Date.now(),
          });
          store.deleteOrder(order);
          confirmModal.value = !confirmModal;
          confirmAction.value = false;

          notification.create({
            status: "success",
            message: "Successfully deleted order",
          });
        } catch (err) {
          notification.create({
            status: "error",
            message: err,
          });
        }
      };
      confirmModal.value = true;
    }

    const portfolio = reactive({
      name: "",
      balance: 0,
      cashBalance: 0,
    });

    function handleBuySellClick() {
      if (buyForm.value) buyForm.value = false;
      else buyForm.value = trade;
    }

    async function handleOrderValueUpdate(value, order, field) {
      try {
        //value hasn't changed, don't update
        if (order[field] === value) {
          return;
        }

        const updates = {
          ...order,
        };

        updates[field] = value;

        store.setOrderValue(value, updates, field);

        await orderDb.update(updates);

        notification.create({
          status: "success",
          message: "Order saved",
        });
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    function handleCancel() {
      ctx.emit("close-modal");
    }

    function handleOrderAdded(order) {
      store.addOrder(order);
    }

    const status = computed(() => {
      if (trade.orders.reduce((s, order) => (s += order.shares), 0) === 0) {
        return "closed";
      } else if (trade.orders.filter((order) => order.type === "Sell").length) {
        return "partial";
      } else {
        return "active";
      }
    });

    return {
      buildTradeDateRules,
      status,
      trade,
      confirmModal,
      confirmAction,
      handleTrashClick,
      handleCancel,
      portfolio,
      formatMoney,
      formatDate,
      handleOrderValueUpdate,
      buyForm,
      handleBuySellClick,
      averageBuyPrice,
      handleOrderAdded,
    };
  },
};
</script>
  
  <style scoped>
.v-col.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status {
  font-family: "Open Sans";
  font-weight: 500;
  text-transform: uppercase;
}
td.date div {
  display: flex;
  align-items: center;
}
.simple-form {
  /* max-width: 1200px; */
  position: relative;
  background-color: var(--block-background-color);
  border-radius: 10px;
  padding: 20px;
  width: 100%;
}

td.date div svg {
  padding-left: 0px;
}

table {
  table-layout: auto;
  /* table-layout: fixed; */
  margin: 20px 0px;
}

i.mdi.mdi-circle {
  font-size: 10px;
  margin-right: 5px;
}

i.mdi.buy {
  color: var(--success);
}

i.mdi.sell {
  color: var(--warning);
}

td {
  padding: 10px;
  white-space: nowrap;
}

.total.cell {
  display: flex;
  flex-flow: column;
  align-items: flex-start;
}

.cell label,
.sub-text {
  font-size: 12px;
  color: rgb(182 179 179);
}

.v-col.total.cell {
  padding-top: 19px;
}

.order-header {
  text-align: left;
}

.v-col.buttons {
  display: flex;
  gap: 20px;
}

.orders {
  display: flex;
  flex-flow: column;
  gap: 10px;
  /* min-width: 600px; */
  max-width: 90%;
  text-align: left;
}

.order-row.v-row {
  font-family: "Open Sans";
  border-radius: 10px;
  background-color: var(--bg-light-color);
}
</style>
  