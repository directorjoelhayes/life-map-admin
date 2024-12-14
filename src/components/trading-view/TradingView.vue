<template>
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container" ref="tradingview">
      <div class="tradingview-widget-container__widget"></div>
      <div class="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
          ><span class="blue-text">Track all markets on TradingView</span></a
        >
      </div>
      <div></div>
    </div>
    
    <!-- TradingView Widget END -->
    <!-- <div ref="tradingview"></div> -->
  </template>
  
  <script>
  import { ref, watch, onMounted } from "vue";
  
  export default {
    props: ["options", "activator"],
    setup(props, ctx) {
      const tradingview = ref(null);
  
      onMounted(() => {
        const widgetPlaceholder = tradingview.value;
        widgetPlaceholder.replaceChildren(); // empty placeholder
        const script = document.createElement("script");
        script.async = true;
        script.type = "text/javascript";
        script.innerHTML = props.options;
        script.src =
          "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        widgetPlaceholder.appendChild(script);
      });
  
      //TODO on exit update status
      // watch(menu, (value) => {
      //   if (value === false) {
      //     live.value = status.value;
      //   }
      // });
  
      return {
        tradingview,
      };
    },
  };
  </script>

<style scoped>

div {
  color-scheme: normal!important;
}

</style>