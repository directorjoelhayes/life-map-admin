<template>
    <div v-on:click="editMode = !editMode" v-if="!editMode" class="editable" ref="slotField">
        <slot></slot>
    </div>
    <v-form class="edit-field" :class="type" v-model="valid" v-else>
        <v-select v-if="type === 'select'" :style="fieldStyles" ref="textField" :items="items" variant="underlined"
            v-on:blur="handleOnBlur" v-model="value" :menu="true" :rules="getRules()" v-on:update:modelValue="handleUpdate($event)"></v-select>
        <!-- FEATURE date picker will be cut off if parent element has scroll auto on -->
        <!-- <VueDatePicker v-else-if="type === 'date'" :style="fieldStyles" ref="textField"  :is-24="false"  v-on:blur="handleOnBlur" v-model="value"
            model-type="timestamp" :auto-apply="true" :enable-time-picker="true" :dark="true">
        </VueDatePicker> -->
        <v-text-field v-else-if="type === 'date' || type === 'datetime-local'" ref="textField" :type="type" v-model="value"
            v-on:update:modelValue="handleUpdate($event)" v-on:blur="handleOnBlur" variant="underlined"
            v-on:keypress="handleKeyPress" :rules="getRules()" />
        <v-text-field v-else ref="textField" :type="type" v-model="value" :style="fieldStyles"
            v-on:update:modelValue="handleUpdate($event)" v-on:blur="handleOnBlur" variant="underlined"
            v-on:keypress="handleKeyPress" :rules="getRules()" />
    </v-form>
</template>

<script>

import { ref, onMounted, watch, nextTick, reactive } from "vue"
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

export default {
    props: ["editValue", "type", "onBlur", "items", "rules"],
    components: { VueDatePicker },
    setup(props, ctx) {



        //TODO dragging edit field progagates out
        

        const textField = ref(null);
        const slotField = ref(null);
        const editMode = ref(false);
        const fieldStyles = reactive({});
        const type = props.type ? props.type : "text";
        const items = props.items ? props.items : ["No Items"];
        const updateOnBlur = props.onBlur ? props.onBlur : false;
        let lastValue = props.editValue;

        const valid = ref(true);

        const value = ref(props.editValue);
        const meta = {}

        function getRules() {
            if(props.rules) return props.rules;
            else return []
        }

        onMounted(() => {
            mountValue()
        })

        watch(props, (val) => {
            lastValue = val.editValue;
            value.value = val.editValue;
            mountValue()
        })

        const getTimezoneOffset = (timestamp) => {
            const date = new Date(timestamp);
            const offset = date.getTimezoneOffset();
            //convert into miliseconds
            return offset * 60 * 1000;
        };

        function convertToEST(timestamp) {
            const offset = timestamp - getTimezoneOffset(timestamp);
            // Create a new date object
            const date = new Date(offset);
            // Print the date object
            return date.getTime();
        }
        
        function mountValue() {
            if (props.type === "date" || props.type === "datetime-local") {
                const date = new Date(
                    convertToEST(props.editValue)
                );

                value.value = date.toISOString()
                    .split("Z")[0]
                    .split(":")
                    .slice(0, 2)
                    .join(":")

                // value.value = date.toISOString()
                //to local
                const local = new Date(value.value)
                // console.log(props.editValue, local.getTime(), "test!!!")
            }
        }

        function handleUpdate(value) {
            
            if (updateOnBlur) return;
            let val = value;
            if (val === lastValue) return;
            if (props.type === "number") val = parseFloat(val);

            if(!valid.value) return
            ctx.emit("value-update", val);
            lastValue = val;
        }

        function handleOnBlur() {
            if(!valid.value) return;
            editMode.value = false;
            let val = value.value;
            if (!updateOnBlur) return;
            if (props.type === 'date' || props.type === 'datetime-local') {
                if(!val) { 
                    //date is invalid
                    value.value = props.editValue;
                    return;
                }
                const date = new Date(val);
                val = date.getTime();
            }
            if (props.type === "number") val = parseFloat(val);
            if (val === lastValue) return;
            ctx.emit("value-update", val);
            lastValue = val;
        }

        watch(editMode, (value) => {

            let getBox;
            if (slotField.value) {
                getBox = slotField.value.getBoundingClientRect()
            }

            nextTick(() => {
                if (value) {
                    fieldStyles.width = getBox.width + "px";
                    if (textField.value.openMenu) textField.value.openMenu();
                    else if (textField.value.focus) {
                        textField.value.focus();
                    }

                    fieldStyles.width = `${getBox.width}px`;
                }

            })
        })

        function handleKeyPress(e) {
            if (e.key === "Enter") {
                textField.value.blur();
            }
        }

        return {
            valid,
            getRules,
            items,
            handleKeyPress,
            handleOnBlur,
            handleUpdate,
            textField,
            slotField,
            type,
            editMode,
            value,
            fieldStyles
        }
    },
}
</script>

<style scoped>
.editable {
    cursor: text;
    min-height: 18px;
}

.edit-field {
    position: relative;
    z-index: 1;
}

.date-field {
    max-width: 100px;
}

.datetime-local :deep(.v-input) {
    width: fit-content;
}

:deep(.v-input__details) {
    display: none;
}

:deep(.v-input--error .v-input__details) {
    display: initial;
}

:deep(.v-field__input) {
    padding-top: 0px;
    min-height: 0px;

}

:deep(.v-field__append-inner.v-field__append-inner) {
    padding-top: 0px !important;
}
</style>