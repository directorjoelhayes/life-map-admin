<template>
  <div class="stick" ref="sticky">
    <slot></slot>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from "vue";

export default {
  props: ["parent"],
  setup(props) {
    const sticky = ref(null);

    function updatePosition(e) {

      const fixedDiv = sticky.value;
      if (!fixedDiv) return;

      const container = props.parent;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      //think I should get it from event
      const scrollY = window.scrollY || window.pageYOffset;

      const refTop = rect.top + scrollY;
      const refBottom = rect.bottom + scrollY;

      const fixedDivHeight = fixedDiv.offsetHeight;
      const viewportHeight = window.innerHeight;

      let fixedDivTop = window.scrollY + 100; // Adjust the offset as needed

      // Ensure fixedDivTop is within the reference element bounds
      if (fixedDivTop < refTop) {
        fixedDivTop = refTop;
      } else if (fixedDivTop + fixedDivHeight > refBottom) {
        fixedDivTop = refBottom - fixedDivHeight;
      }

      fixedDiv.style.top = `${fixedDivTop}px`;
    }

    onMounted(() => {
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      console.log(props.parent, "parent");
      updatePosition();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    });

    return {
      sticky,
    };
  },
};
</script>

<style scoped>
.stick {
  position: absolute;
}
</style>