<template>
    <div class="table-container">
        <table>
            <slot name="default"></slot>
        </table>
        <slot name="footer"></slot>
    </div>
</template>

<script>


export default {
    setup() {

    },
}
</script>

<style scoped>
table {
    width: 100%;
    text-align: left;
    font-family: 'Open Sans';
    min-width: max-content;
}

:deep(.cell-wrapper) {
    display: flex;
    gap: 5px;
}
</style>

