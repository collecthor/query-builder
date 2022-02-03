document.addEventListener("DOMContentLoaded", () => {
  const fields = [
    {
      "value": "score",
      "label": "Score",
      "type": "number",
    },
    {
      "value": "country",
      "label": "Country",
      "type": "text",
    },
    {
      "value": "favorite_color",
      "label": "Favorite Color",
      "type": "closed",
      "values": [
        {"value": "green", "label": "Green"},
        {"value": "bottlegreen", "label": "Best green"},
        {"value": "red", "label": "Red"},
        {"value": "blue", "label": "Blue"},
        {"value": "yellow", "label": "Yellow"},
        {"value": "orange", "label": "Orange"},
        {"value": "pink", "label": "Pink"},
        {"value": "black", "label": "Black"},
        {"value": "white", "label": "White"},
      ],
    }
  ];
  const builder = new QueryBuilder("query-builder", fields);
});