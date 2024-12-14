<template>
    <v-form v-model="valid">
        <v-container>
            <v-row>
                <v-col>
                    <h2>Buy/Sell Shares</h2>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <v-text-field type="datetime-local" v-model="dateField" label="entry date"></v-text-field>
                </v-col>
                <v-col>
                    <v-select label="type" v-model="order.type" :items="['Buy', 'Sell']"></v-select>
                </v-col>
                <v-col>
                    <v-text-field v-model="order.ticker" label="ticker" :disabled="lockTicker"></v-text-field>
                </v-col>
                <v-col>
                    <v-select label="select" v-model="order.portfolio" :items="globalStore.getPortfolioList"
                        hint="Pick your portfolio" persistent-hint></v-select>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <v-text-field :disabled="priceLoading" :loading="priceLoading" :rules="rules.price"
                        v-model="order.price" type="number" label="price" prefix="$"></v-text-field>
                </v-col>
                <v-col>
                    <v-text-field v-model="order.stop" type="number" label="stop" prefix="$"></v-text-field>
                </v-col>
                <v-col>
                    <v-text-field :rules="rules.shares" v-model="order.shares" type="number"
                        label="shares"></v-text-field>
                </v-col>
                <v-col>
                    <v-text-field v-model="order.fee" type="number" label="fee" prefix="$"></v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <h3>Total: ${{ formatMoney(getTotal()) }}</h3>
                </v-col>
            </v-row>
            <v-row>
                <v-col class="buttons">
                    <v-btn v-on:click="handleCancel">Cancel</v-btn>
                    <v-btn v-on:click="handleSubmit" :disabled="!valid || submitting" color="var(--accent-two)"
                        :loading="submitting">Confirm</v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script>

import { ref, reactive, onMounted, watch } from "vue"
import { formatMoney } from '/src/utils/number-format'
import { useGlobalStore } from "/src/stores/global-store"
import { tradesDb, orderDb, stockDb } from "/src/databases"
import { useNotifications } from '/src/stores/notifications'

export default {
    props: ["open"],
    components: {

    },
    setup(props, ctx) {

        const globalStore = useGlobalStore();
        const submitting = ref(false);
        const valid = ref(false);
        const notification = useNotifications();

        const priceLoading = ref(false);

        const order = reactive({
            type: "Buy",
            date: Date.now(),
            ticker: null,
            shares: 0,
            price: 0,
            fee: 0,
            stop: 0,
            trade: undefined,
            portfolio: undefined
        })

        //
        const dateField = ref(timestampToString(
            convertToEST(order.date)
        ))

        watch(dateField, (value) => {
            order.date = stringToTimestamp(value)
        })

        function convertToEST(timestamp) {
            const getTimezoneOffset = (timestamp) => {
                const date = new Date(timestamp);
                const offset = date.getTimezoneOffset();
                //convert into miliseconds
                return offset * 60 * 1000;
            };
            const offset = timestamp - getTimezoneOffset(timestamp);
            // Create a new date object
            const date = new Date(offset);
            // Print the date object
            return date.getTime();
        }

        function timestampToString(value) {

            const date = new Date(value);

            return date.toISOString()
                .split("Z")[0]
                .split(":")
                .slice(0, 2)
                .join(":")
        }

        function stringToTimestamp(val) {
            //code to return timestamp
            const date = new Date(val);
            return date.getTime();
        }




        const rules = {
            shares: [
                (value) => {
                    if (parseInt(value)) return true;

                    return "Must have shares"
                },
                (value) => {

                    if (!props.open.orders) return true;
                    const shares = props.open.orders.reduce((a, o) => a += o.shares, 0)

                    if (order.type === "Sell" && parseInt(shares) - parseInt(value) < 0) {
                        return "You can't sell more shares than you own!"
                    }

                    return true;
                }
            ],
            price: [
                (value) => {
                    if (parseInt(value)) return true;

                    return "Must have price."
                },
            ]
        }

        const lockTicker = ref(false)

        async function getStockPrice(ticker) {
            try {
                priceLoading.value = true;
                const priceData = await stockDb.getStockPrice(ticker);
                if (priceData?.price) order.price = parseFloat(priceData.price).toFixed(2);
                priceLoading.value = false;
            } catch (err) {
                priceLoading.value = false;
                console.error(err);
            }
        }

        const portfolioList = ref([]);
        async function portfoliosToList() {

            const portfolioData = await globalStore.fetchPortfolios();

            console.log(portfolioData, "test");
            console.log(portfolioData.map((item, index) => {

                return {
                    title: item.name,
                    value: item._id
                }
            }))
            return portfolioData.map((item, index) => {

                return {
                    title: item.name,
                    value: item._id
                }
            });
        }

        async function onReady(data) {
            if (data?.s) {
                order.ticker = data.s;
                lockTicker.value = true;
                getStockPrice(data.s)
            }
            if (!data.stock && data?._id) {
                order.trade = data._id;
            }

            if (data.stop) {
                order.stop = data.stop;
            }

            order.portfolio = props.open.portfolio ? props.open.portfolio : globalStore?.portfolios?.[0]?._id;

            // portfolioSelected.value = {
            //     title: port.name,
            //     value: port._id
            // }
            portfolioList.value = await portfoliosToList()

        }

        watch(props, async (value) => {
            await onReady(value.open)
        })

        onMounted(async () => {
            try {
                await onReady(props.open)

            } catch (err) {
                console.log(err);
            }
        })

        async function handleSubmit() {
            try {
                submitting.value = true;
                if (!order.trade) {
                    const payload = {
                        date: order.date,
                        s: order.ticker,
                        portfolios: [order.portfolio],
                        stop: parseFloat(order.stop),
                        currentStop: parseFloat(order.stop),
                        status: "open"
                    }

                    const trade = await tradesDb.post(payload);

                    if (!trade) return;

                    order.trade = trade._id;
                }

                const newOrder = {
                    ...order,
                    s: order.ticker,
                    stop: parseFloat(order.stop),
                    //substract sell shares / add buy shares
                    shares: order.type === "Buy" ? parseInt(order.shares) : parseInt(order.shares) * -1,
                    price: parseFloat(order.price),
                    fee: parseFloat(order.fee)
                }

                const postedOrder = await orderDb.post(newOrder);

                if (!postedOrder?._id) throw "Something went wrong!"

                // let parent handle updating store
                ctx.emit("order-added", postedOrder)

                submitting.value = false;

                notification.create({
                    status: "success",
                    message: "Order successfully submitted"
                })

                ctx.emit("close-modal")

            } catch (err) {
                notification.create({
                    status: "error",
                    message: err
                })
                console.error(err)
            }
        }

        function handleCancel() {
            ctx.emit("close-modal")
        }

        function getTotal() {

            let total = 0
            total += parseInt(order.shares) * parseFloat(order.price) + parseFloat(order.fee);

            return total ? total : 0;
        }

        return {
            dateField,
            globalStore,
            lockTicker,
            portfolioList,
            valid,
            getTotal,
            order,
            rules,
            formatMoney,
            handleSubmit,
            handleCancel,
            priceLoading,
            submitting
        }
    },
}
</script>

<style scoped>
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
    justify-content: center;
    gap: 20px;
}
</style>
