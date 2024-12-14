<template>
  <transition name="nested">
    <div
      class="modal large"
      v-if="props.open"
      v-on:mousedown="handleMouseDown"
      v-on:mouseup="handleMouseUp"
    >
      <div class="background-filter"></div>
      <div class="content-container">
        <slot> Content goes here </slot>
      </div>
    </div>
  </transition>
</template>

<script>
import { onMounted } from "vue";

export default {
  props: ["open"],
  setup(props, context) {
    let target = null;

    onMounted(() => {
      //remove scroll
    });

    function handleMouseDown(e) {
      e.stopPropagation();
      target = e.target;
      console.log(target);
    }

    function handleMouseUp(e) {
      e.stopPropagation();
      if (e.target === target) {
        context.emit("close");
      }
    }

    return {
      props,
      handleMouseUp,
      handleMouseDown,
    };
  },
};
</script>

<style scoped>
.modal {
  position: fixed;
  width: 100%;
  height: 100vh;
  top: 0px;
  left: 0px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.content-container {
  padding: 100px 0px;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 100px 20px 100px 85px;
}
.modal.large {
  align-items: flex-start;
  overflow-y: auto;
}
.modal.center {
  align-items: center;
  overflow: hidden;
}

.background-filter {
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.503);
  pointer-events: none;
}

.nested-enter-active,
.nested-leave-active {
  transition: all 0.3s ease-in-out;
}

/* delay leave of parent element */

.nested-enter-from,
.nested-leave-to {
  transform: translateY(30px);
  opacity: 0;
}

/* we can also transition nested elements using nested selectors */
.nested-enter-active .inner,
.nested-leave-active .inner {
  transition: all 0.3s ease-in-out;
}

/* delay enter of nested element */
.nested-enter-active .inner {
  transition-delay: 0.25s;
}

.nested-enter-from .inner,
.nested-leave-to .inner {
  transform: translateX(30px);
  /*
  	Hack around a Chrome 96 bug in handling nested opacity transitions.
    This is not needed in other browsers or Chrome 99+ where the bug
    has been fixed.
  */
  opacity: 0.001;
}
</style>