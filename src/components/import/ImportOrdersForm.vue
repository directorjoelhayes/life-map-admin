<template>
  <h2>Import CSV</h2>
  <v-stepper :model-value="step" flat>
    <v-stepper-header>
      <v-stepper-item
        title="Upload File"
        value="1"
        complete="false"
      ></v-stepper-item>

      <v-divider></v-divider>
      <!-- // :rules="[() => true]" -->
      <!-- subtitle  -->
      <v-stepper-item subtitle="" title="Map Fields" value="2"></v-stepper-item>

      <v-divider></v-divider>

      <v-stepper-item title="Review And Import" value="3"></v-stepper-item>
    </v-stepper-header>
  </v-stepper>
  <template v-if="step === '1'">
    <!-- FEATURE turn into component -->
    <div
      class="drop-target"
      id="drop-area"
      v-on:dragover="handleDragOver"
      v-on:dragleave="handleDragLeave"
      v-on:drop="handleDrop"
    >
      <div id="editableDiv" contenteditable="true"></div>
      <input type="file" id="custom-upload" v-on:change="handleFileUpload" />
      <label for="custom-upload" id="custom-upload-label">
        <v-icon>mdi mdi-cloud-upload</v-icon>
        Upload file or drag and drop
      </label>
      <p id="file-name"></p>
    </div>

    <div class="lm-col button-row">
      <v-btn @click="handleCancel"> Cancel </v-btn>
    </div>
  </template>

  <template v-else-if="step === '2'">
    <div class="lm-container">
      <div class="lm-row">
        <div class="lm-col">
          <table-container>
            <table>
              <tbody>
                <tr v-for="(row, index) in csvData.header" :key="index">
                  <td>
                    {{ row }}
                  </td>
                  <td>
                    <v-select
                      clearable
                      label="field"
                      v-model="csvData.map[index]"
                      :items="csvData.mapOptions.to"
                    ></v-select>
                  </td>
                </tr>
              </tbody>
            </table>
          </table-container>
        </div>
      </div>
      <div class="lm-col button-row">
        <v-btn @click="handleCancel"> Cancel </v-btn>
        <v-btn @click="handleCompleteMap" color="var(--accent-two)">
          Next
        </v-btn>
      </div>
    </div>
  </template>

  <template v-else-if="step === '3'">
    <div class="lm-container">
      <div class="lm-row">
        <div class="lm-col">
          <table-container>
            <table>
              <thead>
                <tr>
                  <td v-for="(col, index) in csvData.mappedHeader" :key="index">
                    {{ col[1] }}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in csvData.mappedRows" :key="index">
                  <td v-for="(key, index) in csvData.mappedHeader" :key="index">
                    <template v-if="key[3]">{{ key[3](row[key[0]]) }}</template>
                    <template v-else>{{ row[key[0]] }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </table-container>
        </div>
      </div>
    </div>
    <div class="lm-row">
      <div class="lm-col button-row">
        <v-btn @click="handlePrevious"> Previous </v-btn>
        <v-btn
          @click="handleImport"
          :loading="submitting"
          :disabled="submitting || !csvData.rows.length"
          color="var(--accent-two)"
        >
          Import
        </v-btn>
      </div>
    </div>
  </template>
  <template v-else-if="set === '4'">
    <!-- //summary -->
    <!-- TODO slot to pass in summary page -->
  </template>
</template>

<script>
import { reactive, ref, onMounted } from "vue";
import TableContainer from "/src/components/ui/tables/TableContainer.vue";
import { useFocusStore } from "../../stores/focus-store";
import { useNotifications } from "../../stores/notifications";
import { useGlobalStore } from "../../stores/global-store";
import { tradesDb, orderDb } from "../../databases";
import { formatDate } from "../../utils/number-format";

export default {
  components: {
    TableContainer,
  },
  props: ["open"],
  setup(props, ctx) {
    const { map, onImport, portfolio } = props.open;

    const store = useFocusStore();
    const globalStore = useGlobalStore();

    const submitting = ref(false);
    const notification = useNotifications();
    const csvData = reactive({
      rows: [],
      header: [],
      map: [],
      mapOptions: undefined,
      replaceList: false,
      mappedRows: [],
      portfolio,
      //TODO map prop
      mappedHeader: map
        ? map
        : [
            ["s", "Symbol", (val) => String(val).toUpperCase()],
            ["shares", "Quantity", Number],
            ["date", "Date", stringToDate, formatDate],
            ["price", "Price", Number],
            ["amount", "Amount", Number],
          ],
    });
    function cleanText(string) {
      if (!string) return "";
      try {
        const value = string
          .split('"')
          .filter((str) => str)[0]
          .split("\\")
          .filter((str) => str)[0]
          .split(",")
          .filter((str) => str)[0];
        return value;
      } catch (err) {
        return "";
      }
    }

    function parseText(text) {
      let rows = text.split("\n");

      //for Windows look for \r
      if (
        rows.find((row) => {
          return row.includes("\r");
        })
      ) {
        rows = rows.join().split("\r");
      }

      return rows
        .map((string) => {
          if (!string) return undefined;
          return string.split("\t").map((col) => cleanText(col));
        })
        .filter((a) => a.length);
    }

    function handlePrevious() {
      step.value = "2";
    }

    //handle import should be an emitted event
    async function handleImport() {
      submitting.value = true;

      if (typeof onImport === "function") {
        try {
          await onImport(csvData);

          submitting.value = false;
          ctx.emit("close-modal");
        } catch (err) {
          submitting.value = false;
          console.log(err);
        }
      } else {
        submitting.value = false;
        console.log(onImport);
      }
    }

    onMounted(() => {
      //TODO turn this into a ref

      //TODO csv import code basics
      document
        .getElementById("editableDiv")
        .addEventListener("paste", async function (event) {
          // Prevent the default paste behavior
          event.preventDefault();

          // Get the pasted text
          var pastedText = (
            event.clipboardData || window.clipboardData
          ).getData("text");

          // Process the pasted text (For demonstration, let's just console log it)
          const parsedData = parseText(pastedText);
          const rawHeader = parsedData[0];
          const rawRows = parsedData.slice(1);

          const rows = toJson(rawHeader, rawRows);

          csvData.rows = rows;
          csvData.header = rawHeader.map((string) => {
            if (!string) return "";
            return cleanText(string);
          });

          csvData.mapOptions = createMapOptions();

          autoSelectMatches();

          //parsed succesfully
          step.value = "2";

          // You can do further processing here as needed
        });
    });

    function handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      document.getElementById("drop-area").classList.add("highlight");
    }
    function handleDragLeave(event) {
      event.preventDefault();
      document.getElementById("drop-area").classList.remove("highlight");
    }
    function handleDrop(event) {
      event.preventDefault();
      document.getElementById("drop-area").classList.remove("highlight");

      const files = event.dataTransfer.files;

      if (files.length > 0) {
        handleFiles(files);
      }
    }
    function toJson(header, data) {
      return data
        .filter((item) => {
          //apply prefilter if it is provided
          if (typeof props?.open?.preFilter === "function") {
            
            return props.open.preFilter(item);
          } else return true;
        })
        .map((row) => {
          console.log(row);
          return header.reduce((obj, legend, index) => {
            if (!row[index]) return obj;

            const rowMatches = cleanText(row[index]);
            const legendMatches = cleanText(legend);

            obj[legendMatches] = rowMatches;
            return obj;
          }, {});
        });       
    }

    function createMapOptions() {
      return {
        to: csvData.mappedHeader.map((item) => {

          return {
            value: item[0],
            title: item[1],
          };
        }),
      };
    }
    function isMissingYear() {
      // #TODO I assume the year is this year if it is null
      // this could be bad if it's data from a prior year

      string = string.trim();

      let divider = "-";
      if (string.includes("/")) {
        divider = "/";
      }

      string = string.split(divider);

      if (string.length < 3) {
        return true;
      }

      return false;
    }
    function autoSelectMatches() {
      csvData.header.map((str, index) => {
        const find = csvData.mappedHeader.findIndex((item) => {
          return item[1].trim().toLowerCase() === str.trim().toLowerCase();
        });

        if (find != -1) {
          csvData.map[index] = csvData.mappedHeader[find][0];
        }
      });
    }
    function handleCompleteMap() {
      // #TODO make map align with data types for trade buy order and sell order
      // #TODO create function for converting strings into dates

      function convertType(key, value) {
        const row = csvData.mappedHeader.find((arr) => arr[0] === key);
        if (!row) return false;
        return row[2](value);
      }
      // figure out how to map
      csvData.mappedRows = csvData.rows
        .map((row) => {
          return csvData.map.reduce((obj, key, index) => {
            const value = row[csvData.header[index]];

            if (!value) return obj;
            //apply the type
            const typedValue = convertType(key, value);
            if (typedValue === false) return obj;

            obj[key] = typedValue;
            return obj;
          }, {});
        })
        .filter((obj) => {
          return Object.keys(obj).length;
        });

      step.value = "3";
    }

    function handleFiles(files) {
      try {
        for (const file of files) {
          console.log("File name:", file.name);
          console.log("File type:", file.type);
          console.log("File size:", file.size, "bytes");
          if (file.type === "text/csv") {
            const reader = new FileReader();
            reader.onload = function (e) {
              const csvContent = e.target.result;
              console.log("CSV content:", csvContent);

              // Now you can use the CSV content as needed
              // For example, you might want to parse the CSV data
              const { header, rows } = parseCSV(csvContent);
              csvData.rows = rows;
              csvData.header = header;

              csvData.mapOptions = createMapOptions();
              //parsed succesfully

              autoSelectMatches();

              step.value = "2";
            };
            reader.readAsText(file);
          } else {
            throw "Unsupported file type. Please drop a CSV file.";
          }
        }
      } catch (err) {
        alert(err);
      }
    }
    function handleFileUpload() {
      const fileInput = document.getElementById("custom-upload");
      handleFiles(fileInput.files);
    }

    function parseCSV(csvContent) {
      try {
        let rows = csvContent.split("\n");

        //for Windows look for \r
        if (
          rows.find((row) => {
            return row.includes("\r");
          })
        ) {
          rows = rows.join().split("\r");
        }

        let header = rows[0].split(",");
        let data = rows.slice(1).map((row) => row.split(","));

        console.log(header);
        console.log(data);

        //trim function
        if (header.length != data[0].length) {
          if (!data.some((row) => row[0] != "")) {
            data = data.map((row) => {
              return row.slice(1, row.length);
            });
          }
        }

        header = header.map((item) => {
          // return item;
          return cleanText(item);
        });

        return {
          header,
          rows: toJson(header, data),
        };
      } catch (err) {
        notification.create({
          message: "Error importing CSV",
          status: "error",
        });
      }
    }

    function handleCancel() {
      ctx.emit("close-modal");
    }

    async function addTrade(tradeData, buyOrder, sellOrder) {
      try {
        //create the trade

        const response = {};

        const payload = {
          ...tradeData,
          status: "open",
        };

        const trade = await tradesDb.post(payload);

        if (!trade) throw "something went wrong";

        //buy order
        response.buyOrder = await orderDb.post({
          ...buyOrder,
          trade: trade._id,
        });

        console.log(response.buyOrder, "order!!");

        if (!response.buyOrder?._id) throw "Something went wrong!";

        //check for sell order information
        if (sellOrder) {
          response.sellOrder = await orderDb.post({
            ...sellOrder,
            trade: trade._id,
          });
        }

        return response;
      } catch (err) {
        notification.create({
          status: "error",
          message: err,
        });
        console.error(err);
      }
    }

    const step = ref("1");

    return {
      step,
      submitting,
      handleFileUpload,
      handleDrop,
      handleDragLeave,
      handleDragOver,
      csvData,
      handleImport,
      handleCancel,
      handleFileUpload,
      handleCompleteMap,
      handlePrevious,
    };
  },
};
</script>

<style scoped>
div#drop-area {
  height: 207px;
  border-style: dashed;
  margin: 20px 0px;
}

div#drop-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

#custom-upload-label {
  display: flex;
  flex-flow: column;
  align-items: center;
  color: #fff;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 5px;
  font-family: "Open Sans";
}

#custom-upload-label i {
  font-size: 80px;
  opacity: 0.2;
}

#drop-area.highlight {
  border-color: #2185d0;
}

.lm-col.button-row {
  display: flex;
  align-items: center;
}

#custom-upload {
  display: none;
}

:deep(.v-input__details) {
  visibility: hidden;
  position: absolute;
  pointer-events: none;
}

.table-container {
  max-height: 600px;
  overflow: auto;
}

#editableDiv {
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 100px;
}

div#drop-area:focus-within {
  position: relative;
  border-color: #b49fe8;
}

div#editableDiv {
  width: 100%;
  height: 100%;
  position: absolute;
  opacity: 0;
}
</style>
