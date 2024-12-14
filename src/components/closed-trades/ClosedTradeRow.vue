<template>
    <!-- FEATURE error handling if dates get messed up, let's experiment with this with the trades importing -->
    <!-- :set="summary = getSummary(props.trade.orders, props.dateRange)" -->
    <!-- turn into a getter -->
    <!-- TODO need to be able to update stops -->
    <tr v-if="props.trade.status === 'error'" class="error">
        <td><v-btn icon="mdi-dots-vertical" :id="'menu-activator-' + props.trade._id + random" size="small"></v-btn>
            <v-menu :activator="'#menu-activator-' + props.trade._id + random">
                <v-list>
                    <v-list-item @click="handleEdit($event, props.trade)" :key="1" :value="1">
                        <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleRemove(props.trade)" :key="3" :value="3">
                        <v-list-item-title>Remove</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu><span class="ticker">{{ props.trade.s }}</span>
            <span class="pill red">Error</span>
        </td>
        <td>
            <div class="date"><calendar-icon />{{ formatDate(props.trade.orders[
        props.trade.orders.length - 1
    ].date) }}</div>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
        <td>
        </td>
    </tr>
    <tr v-else :random="random = uuid()">
        <td><v-btn icon="mdi-dots-vertical" :id="'menu-activator-' + props.trade._id + random" size="small"></v-btn>
            <v-menu :activator="'#menu-activator-' + props.trade._id + random">
                <v-list>
                    <v-list-item @click="handleEdit($event, props.trade)" :key="1" :value="1">
                        <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleRemove(props.trade)" :key="3" :value="3">
                        <v-list-item-title>Remove</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu><span class="ticker">{{ props.trade.s }}</span>
        </td>
        <td>
            <edit-value type="datetime-local" :editValue="props.trade.orders[
        props.trade.orders.length - 1
    ].date" :onBlur="true" v-on:value-update="handleDateUpdate($event, 'close')" :rules="closeDateRules(props.trade)">
                <div class="date"><calendar-icon />{{ formatDate(props.trade.orders[
        props.trade.orders.length - 1
    ].date) }}</div>
            </edit-value>
        </td>
        <td>
            <edit-value type="datetime-local" :editValue="props.trade.orders[0].date" :onBlur="true"
                v-on:value-update="handleDateUpdate($event, 'open')" :rules="openDateRules(props.trade)">
                <div class="date"><calendar-icon />{{ formatDate(props.trade.orders[0].date) }}</div>
            </edit-value>
        </td>
        <td>
            {{ getSellPrice(props.trade.orders) }}
        </td>
        <td class="cost">
            <div class="content">
                {{ formatPriceRange(summary.buyPriceRange) }}
            </div>
        </td>
        <td>
            <div class="pill" :class="{ green: summary.profit > 0, red: summary.profit < 0 }">
                <v-icon v-if="summary.profit < 0">mdi mdi-arrow-down</v-icon>
                <v-icon v-else>mdi mdi-arrow-up</v-icon>
                <span class="hide-private">${{ formatMoney(props.trade.profit) }} |</span> {{ ((props.trade.profit / props.trade.cost) * 100).toFixed(2)
                }}%
            </div>
        </td>
        <td class="private">
            <span>${{ formatMoney(summary.proceeds) }}</span>
        </td>
        <td>
            <div class="cell-wrapper">
                <EditValue type="number" :editValue="props.trade.stop" :onBlur="true"
                    v-on:value-update="handleTradeUpdate($event, props.trade, 'stop')">${{
        formatMoney(props.trade.orders[0].stop ?
            props.trade.orders[0].stop : 0.00) }}
                </EditValue> | {{ formatMoney(getStopPercent({
        trigger: props.trade.orders[0].price,
        stop: props.trade.orders[0].stop
    }))
                }}%
            </div>
        </td>
        <td>
            <EditValue type="number" :editValue="props.trade.currentStop" :onBlur="true"
                v-on:value-update="handleTradeUpdate($event, props.trade, 'currentStop')">${{
        formatMoney(props.trade.currentStop ?
            props.trade.currentStop : 0.00) }}
            </EditValue>
        </td>
        <td :set="winLossR = getWinLossR(summary)">
            <template v-if="winLossR">
                <span v-for="(value, index) in winLossR" :key="index">
                    {{
        formatMoney(value)
    }}
                    <template v-if="index !== winLossR.length - 1">
                        ,
                    </template>
                </span>
            </template>
        </td>
        <td>
            {{ millToDays(getHoldTime(props.trade.orders)) }}
        </td>
    </tr>
    <Teleport to="body">
        <Modal :open="overlay" v-on:close="handleModalClose('overlay')">
            <closed-trade-modal :open="overlay" />
        </Modal>
        <Modal :open="confirmModal" v-on:close="confirmModal = !confirmModal" class="center">
            <confirmation-pop-up :action="confirmAction" v-on:reject="confirmModal = !confirmModal"
                message="Are you sure you'd like to delete?" />
        </Modal>
    </Teleport>
</template>

<script>
import { ref, reactive, computed } from "vue"
import { getProfits, getSummary, getWinLossR } from '../../utils/finance-formulas'
import CalendarIcon from '/src/components/ui/icons/CalendarIcon.vue'
import EditValue from '/src/components/ui/forms/EditValue.vue'
import { formatMoney, formatDate, millToDays } from "../../utils/number-format"
import ClosedTradeModal from './ClosedTradeModal.vue'
import Modal from "/src/components/ui/modals/Modal.vue"
import { v4 as uuid } from "uuid"
import ConfirmationPopUp from '/src/components/ui/pop-overs/ConfirmationPopUp.vue'
import { tradesDb, orderDb } from '/src/databases'
import { useNotifications } from '/src/stores/notifications'
import { useClosedTrades } from '/src/stores/closed-trades'
import { useGlobalStore } from '/src/stores/global-store'

export default {
    props: ["trade", "dateRange"],
    components: {
        EditValue,
        CalendarIcon,
        Modal,
        ClosedTradeModal,
        ConfirmationPopUp
    },
    setup(props) {

        const store = useClosedTrades();
        const globalStore = useGlobalStore();
        const overlay = ref(false);
        const confirmModal = ref(false);
        const confirmAction = reactive({
            value: {}
        })
        const notification = useNotifications()

        function getSellPrice(orders) {
            const sellOrders = orders.filter((order) => {
                return order.type === "Sell"
            }).map((sell) => {
                return sell.price
            })

            if (sellOrders.every(num => num === sellOrders[0])) {
                return "$" + formatMoney(sellOrders[0]);
            } else {
                return `$${formatMoney(Math.min(Infinity, ...sellOrders))} - $${formatMoney(Math.max(0, ...sellOrders))}`;
            }
        }
        function formatPriceRange(range) {
            if (range.every(num => num === range[0])) {
                return "$" + formatMoney(range[0]);
            } else {
                return `
                    $${formatMoney(Math.min(Infinity, ...range))} - $${formatMoney(Math.max(0, ...range))}
                `;
            }
        }
        function getStopPercent(data) {
            if (data.stop === 0 || data.trigger === 0) return 0.00;
            const number = (data.trigger - data.stop) / data.trigger;
            return Number((number * 100).toFixed(2));
        }
        function getHoldTime(orders) {

            const first = Math.min(...orders.map((a) => a.date));
            const last = Math.max(...orders.map((a) => a.date));

            return last - first
        }

        //event handlers

        function handleModalClose(name) {
            if (name === "overlay") overlay.value = false;
        }
        function handleEdit(e, trade) {
            overlay.value = trade;
        }

        function handleRemove(data) {

            confirmAction.value = async () => {
                try {
                    await tradesDb.update({ _id: data._id, deleted: Date.now() })
                    store.removeTrade(data)

                    notification.create({
                        status: "success",
                        message: "Deleted trade"
                    })

                    confirmModal.value = false;
                } catch (err) {
                    notification.create({
                        status: "error",
                        message: err
                    })
                }
            }
            confirmModal.value = true;
        }

        const summary = computed(() => {
            console.log(props.trade);
            return getSummary(props.trade.orders, props.dateRange)
        })

        async function handleDateUpdate(value, orderString) {
            //order db 
            let order;

            if (orderString === 'close') order = props.trade.orders[props.trade.orders.length - 1];
            else if (orderString === 'open') order = props.trade.orders[0];
            //async function handleOrderValueUpdate(value, order, field) {
            try {
                //value hasn't changed, don't update 

                const updates = {
                    ...order,
                    date: value
                }

                store.setOrderValue(value, updates, 'date');

                await orderDb.update(updates);

                notification.create({
                    status: "success",
                    message: "Order saved"
                })

            } catch (err) {
                notification.create({
                    status: "error",
                    message: err
                })
            }

        }

        const openDateRules = (trade) => {

            return [
                //no sells can be before first buy
                (val) => {

                    const date = new Date(val);
                    val = date.getTime();

                    const { date: lastDate } = trade.orders[trade.orders.length - 1]

                    //first trade
                    if (date > lastDate) return "Can't buy after you closed!"

                    return true;
                },
                //can't be in the future
                // (val) => {

                // }
            ]
        }

        const closeDateRules = (trade) => {
            return [
                //no sells can be before first buy
                (val) => {

                    const date = new Date(val);
                    val = date.getTime();

                    const { date: firstDate } = trade.orders[0]

                    //first trade
                    if (date < firstDate) return "Can't sell before you buy!"

                    return true;
                },
                //can't be in the future
                // (val) => {

                // }
            ]
        }

        return {
            openDateRules,
            closeDateRules,
            handleDateUpdate,
            summary,
            uuid,
            handleRemove,
            millToDays,
            getHoldTime,
            getWinLossR,
            handleModalClose,
            props,
            handleEdit,
            getSummary,
            getProfits,
            getSellPrice,
            formatPriceRange,
            formatMoney,
            formatDate,
            getStopPercent,
            overlay,
            confirmAction,
            confirmModal
        }
    },
}
</script>

<style scoped>
button {
    background-color: var(--bg-lighter-color);
}

td .date {
    display: flex;
    align-items: center;
}

span.ticker {
    margin-left: 15px;
}

tr.error td {
    background-color: #391424;
}
</style>
