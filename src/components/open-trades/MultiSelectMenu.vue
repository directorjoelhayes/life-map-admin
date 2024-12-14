<template>
  <hover-pop-over>
    <template v-slot:default="{ props }">
      <v-btn
        color="transparent"
        icon="mdi-vector-combine"
        v-bind="props"
        :disabled="!canCombine(selectedTrades.list)"
        v-on:click="handleCombineTrades(strat._id)"
      />
    </template>
    <template #popover> Combine Selected </template>
  </hover-pop-over>
  <hover-pop-over>
    <template v-slot:default="{ props }">
      <v-btn
        color="transparent"
        icon="mdi-trash-can"
        v-bind="props"
        v-on:click="handleRemoveMulti(selectedTrades)"
      />
    </template>
    <template #popover> Delete Selected </template>
  </hover-pop-over>
</template>

<script>
import HoverPopOver from "/src/components/ui/pop-overs/HoverPopOver.vue";
import { makeSelectedStore } from "/src/stores/selected-store";
import { useNotifications } from "/src/stores/notifications"
import { tradesDb, orderDb } from "/src/databases"
import { useOpenTrades } from "/src/stores/open-trades"

export default {
  components: {
    HoverPopOver,
  },
  props: ["strat"],
  setup({ strat }, { emit }) {
    const store = useOpenTrades();
    const selectedTrades = makeSelectedStore(strat._id)();
    const notification = useNotifications()

    function handleRemoveMulti(selectedTrades) {
      emit("confirm-modal", {
        value: async () => {
          try {
            const promises = selectedTrades.list.map((data) => {
              return async () => {
                try {
                  await tradesDb.update({ _id: data._id, deleted: Date.now() });
                  store.removeTrade(data);
                  selectedTrades.unselectAll();

                  emit("close-confirm-modal")
                } catch (err) {
                  notification.create({
                    status: "error",
                    message: err,
                  });
                }
              };
            });

            const results = await Promise.all(promises.map((fn) => fn()));
            notification.create({
              status: "success",
              message: "Deleted trades",
            });
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }

          console.log(results);
        },
        message: `Would you like to delete ${selectedTrades.list.length} trades?`,
      })
    }
    function canCombine(selection) {
      if (selection.length >= 2) {
        //check if tickers are the same
        return !selection.some(({ s }) => {
          if (s !== selection[0].s) return true;
          else return false;
        });
      }
      return false;
    }
    function handleCombineTrades(stratId) {
      //pick a trade to keep, first index
      const trades = selectedTrades.list;
      const combineTrade = trades[0];
      //loop through rest remaining Trades
      const promises = trades
        .slice(1, trades.length)
        .map(({ orders }) => orders)
        .flat()
        .map((order) => {
          return async () => {
            try {
              const updates = {
                ...order,
                trade: combineTrade._id,
              };

              await orderDb.update(updates);

              store.deleteOrder(order);
              store.addOrder(updates);
            } catch (err) {
              throw err;
            }
          };
        });

        emit("confirm-modal", {
        value: async () => {
          try {
            //combine trades
            const combined = await Promise.all(promises.map((fn) => fn()));

            //delete empty trades
            const deletePromises = trades
              .slice(1, trades.length)
              .map((data) => {
                return async () => {
                  try {
                    await tradesDb.update({
                      _id: data._id,
                      deleted: Date.now(),
                    });
                    store.removeTrade(data);
                  } catch (err) {
                    notification.create({
                      status: "error",
                      message: err,
                    });
                  }
                };
              });

            const results = await Promise.all(deletePromises.map((fn) => fn()));

            //clear selection

            selectedTrades.unselectAll();
            emit("close-confirm-modal")

            notification.create({
              status: "success",
              message: "Combined Trades",
            });
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }

          console.log(results);
        },
        message: `Would you like to combine ${selectedTrades.list.length} trades?`,
      })
    }

    return {
      handleRemoveMulti,
      canCombine,
      handleCombineTrades,
      selectedTrades,
    };
  },
};
</script>