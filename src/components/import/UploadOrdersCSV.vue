<template>
  <v-container>
    <v-row>
      <v-col>
        <div
          class="drop-target"
          id="drop-area"
          v-on:dragover="handleDragOver"
          v-on:dragleave="handleDragLeave"
          v-on:drop="handleDrop"
        >
          <div id="editableDiv" contenteditable="true"></div>
          <input
            type="file"
            id="custom-upload"
            v-on:change="handleFileUpload"
          />
          <label for="custom-upload" id="custom-upload-label">
            <v-icon>mdi mdi-cloud-upload</v-icon>
            Upload file or drag and drop
          </label>
          <p id="file-name"></p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { onMounted } from "vue";

export default {
  setup(props, { emit }) {
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

          emit("pasted", pastedText);
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
        emit("files", files);
      }
    }
    function handleFileUpload(event) {
      emit("files", event.target.files);
    }
    return {
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleFileUpload,
    };
  },
};
</script>

<style scoped>
div#drop-area {
  height: 207px;
  border-style: dashed;
  margin: 20px 0px;
  color: var(--secondary-text-color);
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

#custom-upload {
  display: none;
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

