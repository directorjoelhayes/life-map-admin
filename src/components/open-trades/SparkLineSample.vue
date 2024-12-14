<template>
  <div class="chart">
    <v-sparkline
      :auto-line-width="2"
      :fill="false"
      :gradient="['#00c6ff', '#F0F', '#FF0']"
      :gradient-direction="'top'"
      :line-width="2"
      :model-value="[0, 2, 5, 9, 5, 10, 3, 5, 0, 0, 1, 8, 2, 9, 0]"
      :padding="8"
      :smooth="10"
      :height="100"
      :stroke-linecap="'round'"
      :type="'trend'"
      auto-draw
    ></v-sparkline>
  </div>
</template>

<script>
export default {
  setup() {
    //sparkline
    const gradients = [
      ["#222"],
      ["#42b3f4"],
      ["red", "orange", "yellow"],
      ["purple", "violet"],
      ["#00c6ff", "#F0F", "#FF0"],
      ["#f72047", "#ffd200", "#1feaea"],
    ];

    // width: 2,
    // radius: 10,
    // padding: 8,
    // lineCap: 'round',
    // gradient: gradients[5],
    // value: [0, 2, 5, 9, 5, 10, 3, 5, 0, 0, 1, 8, 2, 9, 0],
    // gradientDirection: 'top',
    // gradients,
    // fill: false,
    // type: 'trend',
    // autoLineWidth: false,
  },
};
</script>