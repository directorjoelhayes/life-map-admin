<template>
    <div class="confirm-container" v-on:click.stop="" v-on:mousedown.stop="" v-on:mouseup.stop="">
        <slot>{{ getMessage() }}</slot>
        <div class="button-row">
            <slot name="menu">
                <v-btn v-on:click="handleReject()">
                    Cancel
                </v-btn>
                <v-btn v-on:click="handleConfirm()" :loading="loading" color="var(--accent-two)">
                    Confirm
                </v-btn>
            </slot>
        </div>
    </div>
</template>

<script>

import { ref } from "vue"

export default {
    props: ["action", "message"],
    setup(props, context) {

        const loading = ref(false)

        async function handleConfirm(
        ) {
            loading.value = true;
            if(typeof props.action.value === "function"){
                try {
                    await props.action.value();
                    loading.value = false
                    context.emit("confirm", {})
                } catch(err) {
                    loading.value = false
                }
            }
            context.emit("confirm", {})
        }

        function getMessage() {
            if(props?.action?.message) return props.action.message;
            else return "Would you like to Continue?"
        }

        async function handleReject() {
            console.log(props.action.cancelAction)
            if(typeof props?.action?.cancelAction === "function"){
                try {
                    loading.value = true;
                    await props.action.cancelAction();
                    loading.value = false
                    context.emit("reject", {})
                } catch(err) {
                    loading.value = false
                }
            } else {
                context.emit("reject", {})
            }
        }

        return {
            getMessage,
            loading,
            props,
            handleConfirm,
            handleReject
        }
    }
}
</script>

<style scoped>
.confirm-container {
    min-width: 600px;
    height: 300px;
    color: #ffffff;
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--block-background-color);
    backdrop-filter: blur(0px);
    font-family: 'Open Sans';
    font-size: 20px;
}

.button-row {
    padding: 20px;
    display: flex;
    gap: 20px;
}
</style>