<template>
    <v-form v-model="valid">
        <v-container v-if="list">
            <v-row>
                <v-col>
                    <h2>Add Stock to {{ list.name }}</h2>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <v-text-field :rules="tickerRules" label="Ticker" variant="underlined"
                        v-model="data.s"></v-text-field>
                </v-col>
                <v-col>
                    <v-text-field label="Name" variant="underlined" v-model="data.c"></v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col class="button-col">
                    <v-btn v-on:click="() => $emit('close-modal')" variant="outlined">
                        Cancel
                    </v-btn>
                </v-col>
                <v-col class="button-col">
                    <v-btn :loading="submitting" type="submit" :disabled="!valid || submitting"
                        v-on:click="handleAddStock" color="var(--accent-two)">
                        Add Stock
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script>

import { reactive, ref, nextTick, watch, computed } from "vue"
import axios from "axios"
import { stockDb, listDb } from '/src/databases'
import { useFocusStore } from '/src/stores/focus-store'
import { useGlobalStore } from '/src/stores/global-store'
import EditValue from '/src/components/ui/forms/EditValue.vue'
import { formatMoney } from '/src/utils/number-format'
import { useNotifications } from '/src/stores/notifications'
import { makeList } from '/src/core/models'

export default {
    props: ["open"],
    components: {
        EditValue
    },
    setup(props, context) {

        const notification = useNotifications();
        const valid = ref(false)
        const submitting = ref(false);
        const list = props.open?.list;
        const stock = props.open?.stock;
        const store = useFocusStore();
        const globalStore = useGlobalStore();

        async function handleAddStock() {
            try {
                submitting.value = true

                data.s = data.s.toUpperCase()
                    .split("/")
                    .join(".")

                const stockPost = {
                    ...data,
                    s: data.s,
                    status: "focus"
                }

                //add stock
                const postedStock = await stockDb.post(stockPost)

                //update list
                const updates = makeList({
                    ...list,
                    stocks: [
                        data.s,
                        ...list.stocks.map((item) => item.s)
                    ]
                })

                globalStore.addStock(data.s, {
                    s: data.s,
                    price: 0.00,
                    priceMovement: "",
                    priceUpdates: []
                })

                store.addToList(list._id, list.stocks.length, postedStock);
                await listDb.update(updates);

                submitting.value = false;

                notification.create({
                    "status": "success",
                    "message": "Successfully added stock"
                })

                context.emit("close-modal");

            } catch (err) {
                notification.create({
                    "status": "error",
                    "message": err
                })
            }
        }

        function handleValueUpdate(e, field) {
            data[field] = e;
        }

        let tempData = {
            c: "",
            s: null,
            price: 0.00,
            trigger: 0.00,
            stop: 0.00,
            risk: 0.00
        }

        const data = reactive({
            ...tempData
        })

        const loading = ref(false)
        const items = ref([])
        const select = ref(null)

        const nameRules = reactive([
            value => {
                if (value) return true

                return 'Name is required.'
            },

        ])

        const tickerRules = reactive([
            value => {
                if (value) return true

                return 'Ticker is requred.'
            },
            value => {
                if (!list.stocks.map(a => a.s).includes(value.toUpperCase())) {
                    return true
                }

                return 'Already added stock.'
            }

        ])



        return {
            formatMoney,
            stock,
            list,
            data,
            valid,
            nameRules,
            tickerRules,
            loading,
            items,
            select,
            handleValueUpdate,
            handleAddStock,
            submitting
        }
    }
}
</script>

<style scoped>

.form-container {
    position: relative;
    background-color: var(--block-background-color);
    display: flex;
    flex-flow: column;
    min-width: 800px;
    min-height: 800px;
    max-width: 1000px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0px 0px 80px rgb(0 0 0 / 64%);
}

.form {
    display: flex;
    flex-flow: row;
    flex-wrap: wrap;
    gap: 20px;
    padding: 40px;
}

.form .item {
    display: flex;
    flex-flow: column;
}

.form .item.full-width {
    width: 100%;
}

.form .item.half-width {
    width: calc(50% - 10px);
}

.item.third-width {
    width: calc(33% - 11px);
}

label {
    display: block;
    color: #ffffff;
    font-size: 17px;
    font-family: 'Open Sans';
    text-align: left;
    padding-bottom: 10px;
}

textarea {
    background: none;
    font-size: 17px;
    width: 100%;
    height: 150px;
    color: #ffffff;
    font-family: 'Open Sans';
    padding: 10px;
}

input {
    color: #ffffff;
    font-size: 60px;
    font-family: 'Open Sans';
    font-weight: 100;
    background: transparent;
    text-align: center;
    border-style: none;
    border-bottom: solid;
    padding: 10px 0px;
}

input:focus {
    outline: none;
}

.header {
    display: flex;
    align-items: center;
    justify-content: center;
}

.header>div {
    display: flex;
}

select {
    max-width: 450px
}

select {
    padding: 10px;
    font-size: 16px
}

section {
    width: 100%;
    background-color: rgb(123 123 140 / 22%);
    padding: 40px 20px;
}


.day-sequence .day {
    display: flex;
    width: 50px;
    height: 50px;
    align-items: center;
    justify-content: center;
    background-color: #202027;
    font-family: 'Open Sans';
    border-radius: 5px;
}

.day-sequence .day.selected {
    background-color: var(--accent-one);
}

.v-col.button-col {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.v-row .button-col:first-child {
    display: flex;
    justify-content: flex-end;
}

.v-row .button-col {
    margin: 10px 0px;
    display: flex;
    justify-content: flex-start;
}
</style>