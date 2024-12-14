<template>
  <v-container>
    <v-row>
      <v-col>
        <table-container>
          <table>
            <tbody>
              <tr v-for="(row, index) in importStore.data.header" :key="index">
                <td>
                  {{ row }}
                </td>
                <td>
                  <v-select
                    clearable
                    label="field"
                    :model-value="importStore.data.map[importStore.data.header[index]]"
                    @update:model-value="(value) => importStore.updateMap(importStore.data.header[index], value)"
                    :items="importStore.data.mapOptions.to"
                  ></v-select>
                </td>
              </tr>
            </tbody>
          </table>
        </table-container>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="button-row">
        <slot></slot>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from "vue";
import { makeImportStore } from "/src/stores/import-store";

export default {
    props: ["csvStore"],
    setup(props) {
        const importStore = makeImportStore(props.csvStore)();

        return {
            importStore
        }
    }
}
</script>
