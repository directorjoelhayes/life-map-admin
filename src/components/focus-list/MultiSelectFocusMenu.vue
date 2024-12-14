<template>
  <div style="position: relative">
    <hover-pop-over>
      <template v-slot:default="{ props }">
        <v-btn
          color="transparent"
          icon="mdi-file-move"
          v-bind="props"
          :id="'multi-' + list._id + '-move'"
        />
        <v-menu
          :close-on-content-click="false"
          location="bottom"
          v-model="moveMenu"
          :activator="'#' + 'multi-' + list._id + '-move'"
        >
          <v-card min-width="300">
            <v-list>
              <v-list-item>
                <v-select
                  label="Select"
                  v-model="selectedList"
                  :items="lists"
                ></v-select>
              </v-list-item>
            </v-list>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="moveMenu = false"> Cancel </v-btn>
              <v-btn
                color="primary"
                variant="text"
                @click="handleMoveStocks(list, selectedStocks)"
              >
                MOVE
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </template>
      <template #popover> Move Selection </template>
    </hover-pop-over>
  </div>
  <hover-pop-over>
    <template v-slot:default="{ props }">
      <v-btn
        color="transparent"
        icon="mdi-trash-can"
        v-bind="props"
        v-on:click="handleRemoveMulti(selectedStocks)"
      />
    </template>
    <template #popover> Delete Selected </template>
  </hover-pop-over>
</template>

<script>
import HoverPopOver from "/src/components/ui/pop-overs/HoverPopOver.vue";
import { makeSelectedStore } from "/src/stores/selected-store";
import { useNotifications } from "/src/stores/notifications";
import { tradesDb, orderDb } from "/src/databases";
import { useFocusStore } from "../../stores/focus-store";
import { listDb } from "/src/databases";
import { ref, onMounted } from "vue";
import { makeList } from "/src/core/models";

export default {
  components: {
    HoverPopOver,
  },
  props: ["list"],
  setup({ list }, { emit }) {
    const store = useFocusStore();
    const selectedStocks = makeSelectedStore(list._id)();
    const notification = useNotifications();
    const moveMenu = ref(false);
    const lists = ref([]);
    const selectedList = ref(null);

    onMounted(() => {
      lists.value = store.lists
        .map((lst) => {
          return {
            title: lst.name,
            value: lst,
          };
        })
        .filter((lst) => lst.value._id !== list._id);
      selectedList.value = lists.value[0].value;
    });

    function handleRemoveMulti(selectedStocks) {
      emit("confirm-modal", {
        value: async () => {
          try {
            const promises = selectedStocks.list.map(async (data) => {
              try {
                store.removeFromListById(list._id, data._id);
              } catch (err) {
                notification.create({
                  status: "error",
                  message: err,
                });
              }
            });

            const results = await Promise.all(promises);

            console.log(makeList(list), "list");

            await listDb.update(
              makeList(list)
            );

            selectedStocks.unselectAll();

            emit("close-confirm-modal");

            notification.create({
              status: "success",
              message: "Deleted Stocks From List",
            });
          } catch (err) {
            notification.create({
              status: "error",
              message: err,
            });
          }

          console.log(results);
        },
        message: `Would you like to delete ${selectedStocks.list.length} stocks?`,
      });
    }
    async function saveList(id) {
      try {
        const list = store.lists.find((item) => item._id === id);
        if (!list) return;
        const update = makeList(list);

        await listDb.update(update);
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }
    async function handleMoveStocks(list, selectedStocks) {
      try {
        selectedStocks.list.forEach(async (stock) => {
          //remove from list
          store.removeFromListById(list._id, stock._id);
          //add to list
          store.addToList(selectedList.value._id, 0, stock);
        });

        //update lists
        await listDb.update(makeList(list));
        await saveList(selectedList.value._id);

        selectedStocks.unselectAll();

        notification.create({
          status: "success",
          message: "Successfully moved stocks",
        });
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
    }

    return {
      handleRemoveMulti,
      handleMoveStocks,
      selectedStocks,
      moveMenu,
      lists,
      selectedList,
    };
  },
};
</script>