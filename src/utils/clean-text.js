export default function cleanText(string) {
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