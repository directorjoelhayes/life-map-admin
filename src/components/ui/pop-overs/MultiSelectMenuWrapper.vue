<template>
  <div class="pop-up-menu" v-if="selectedTrades.list.length > 1">
    <div class="left-side">
      <span>{{ selectedTrades.list.length }}</span
      ><span> Items Selected</span>
    </div>
    <div class="right-side">
      <slot> </slot>
    </div>
  </div>
</template>
  
  <script>
import { makeSelectedStore } from "/src/stores/selected-store";

export default {
  props: ["storeId"],
  setup({ storeId }) {
    const selectedTrades = makeSelectedStore(storeId)();

    return {
      selectedTrades,
    };
  },
};
</script>

<style scoped>
.pop-up-menu {
  position: absolute;
  bottom: 0px;
}
.pop-up-menu {
  background-color: var(--bg-color);
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0px 10px 20px #00000045;
  border-style: solid;
  border-width: 1px;
  border-color: #596273;
  margin-left: 140px;
}
.pop-up-menu .left-side {
  background-color: var(--accent-two);
  display: flex;
  padding: 0px 10px;
  align-items: center;
  gap: 5px;
  font-family: "Open Sans";
  white-space: nowrap;
}
.pop-up-menu .right-side {
  display: flex;
  padding: 3px 10px;
  gap: 10px;
  align-items: center;
}
</style>
