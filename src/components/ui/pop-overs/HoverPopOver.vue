<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    open-on-hover
    location="top center"
  >
    <template v-slot:activator="{ props }">
      <slot :props="props">
        <v-btn color="indigo" v-bind="props"> Menu as Popover </v-btn>
      </slot>
    </template>
    <div class="pop-over">
      <slot name="popover"></slot>
    </div>
  </v-menu>
</template>

<script>
import { ref } from "vue";

export default {
  setup() {
    const menu = ref(false);
    return {
      menu,
    };
  },
};
</script>

<style scoped>
.pop-over {
  display: block;
  margin: 10px;
  background-color: var(--accent-two);
  box-shadow: 0px 5px 5px #00000036;
  padding: 10px;
  border-radius: 10px;
}
</style>