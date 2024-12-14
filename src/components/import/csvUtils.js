function toJson(header, data, preFilter = undefined) {
    return data
        .filter((item) => {
            //apply prefilter if it is provided
            if (typeof preFilter === "function") {

                return preFilter(item);
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

export { toJson, cleanText, parseText, parseCSV };
