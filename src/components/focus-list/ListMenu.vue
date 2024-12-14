<template>
  <div class="invisible-wrapper">
    <v-btn
      icon="mdi-dots-vertical"
      :id="cleanText(element.s) + list._id"
      size="small"
      flat
    ></v-btn>
    <v-menu :activator="'#' + cleanText(element.s) + list._id">
      <v-list>
        <v-list-item @click="handleBuySellShares(element)" :key="1" :value="1">
          <v-list-item-title
            ><span>Buy Shares</span
            ><v-icon>mdi mdi-cash-multiple</v-icon></v-list-item-title
          >
        </v-list-item>
        <v-list-item
          :id="cleanText(element.s) + list._id + '-move'"
          :key="3"
          :value="3"
        >
          <v-list-item-title
            ><span>Move To</span
            ><v-icon>mdi mdi-file-move</v-icon></v-list-item-title
          >
          <v-menu
            :close-on-content-click="false"
            location="end"
            v-model="moveMenu"
            :activator="'#' + cleanText(element.s) + list._id + '-move'"
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
                  @click="moveStock(list, element)"
                >
                  MOVE
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </v-list-item>
        <v-list-item @click="handleRemove(element, list)" :key="2" :value="2">
          <v-list-item-title
            ><span>Remove</span
            ><v-icon>mdi mdi-trash-can</v-icon></v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { ref, watch, onMounted } from "vue";
import { useFocusStore } from "/src/stores/focus-store";
import { listDb } from "/src/databases";
import { useNotifications } from "/src/stores/notifications";
import { makeList } from "/src/core/models";

export default {
  components: {},
  props: ["element", "list", "lists"],
  setup({ list, element }, ctx) {
    const store = useFocusStore();
    const notification = useNotifications();

    const selectedList = ref(null);
    const lists = ref([]);

    const moveMenu = ref(false);

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

    function cleanText(string) {
      return string
        .split('"')
        .filter((str) => str)
        .join("")
        .split("\\")
        .filter((str) => str)
        .join("")
        .split("/")
        .filter((str) => str)
        .join("")
        .split(".")
        .filter((str) => str)
        .join("")
        .split(",")
        .filter((str) => str)
        .join("");
    }

    async function moveStock(list, stock) {
      try {
        //remove from list
        store.removeFromListById(list._id, stock._id);
        await listDb.update(makeList(list));

        //add to list
        store.removeFromListById(list._id, stock._id);

        store.addToList(selectedList.value._id, 0, stock);

        await saveList(selectedList.value._id);

        notification.create({
          status: "success",
          message: "Successfully moved " + stock.s,
        });
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
      }
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

    function handleBuySellShares(element) {
      ctx.emit("buy-sell-shares", element);
    }

    function handleRemove(element, list) {
      ctx.emit("remove-stock", { element, list });
    }

    const menu = ref(false);

    return {
      moveStock,
      moveMenu,
      selectedList,
      handleBuySellShares,
      handleRemove,
      cleanText,
      list,
      lists,
      element,
      menu,
    };
  },
};
</script>

<style scoped>
.v-list-item-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.v-list-item-title i {
  font-size: 20px;
  margin-left: auto;
}
.invisible-wrapper {
  display: inline-block;
}

/* .invisible-wrapper > * {
  visibility: visible;
} */
</style>
