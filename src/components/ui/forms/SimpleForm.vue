<template>
    <div class="simple-form" v-on:mousedown.stop="" v-on:mouseup.stop="">
        <slot></slot>
    </div>
</template>

<script>

export default {
    setup() {

    },
}
</script>

<style scoped>
.simple-form {
    max-width: 1200px;
    position: relative;
    background-color: rgb(var(--v-theme-surface));
    border-radius: 10px;
    padding: 20px;
    border-style: solid;
    border-width: 1px;
    border-color: var(--border-color);
    
}


@media only screen and (min-width: 1200px) {
    .simple-form {
        min-width: 900px;
    }
}
</style>
