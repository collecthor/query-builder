document.addEventListener("DOMContentLoaded", () => {
  const fields = [
    {
      "name": "score",
      "type": "number",
    },
    {
      "name": "country",
      "type": "text",
    },
    {
      "name": "favorite_color",
      "type": "multiplechoice",
      "values": [
        "green",
        "red",
        "blue",
        "yellow",
        "pink",
        "black",
        "white",
      ],
    }
  ];
  const builder = new QueryBuilder("query-builder", fields);
});