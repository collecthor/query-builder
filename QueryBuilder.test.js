/**
 * @jest-environment jsdom
 */

 document.body.innerHTML =
 '  <link rel="stylesheet" lang="css" href="QueryBuilder.css" />' +
 '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>' +
 '  <script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>' +
 '  <h1>Query builder demo</h1>' +
 '  <div class="query-builder-container">' +
 '    <textarea id="query-builder"></textarea>' +
 '  </div>';

require('./node_modules/choices.js/public/assets/scripts/choices.min.js');
const qb = require('./QueryBuilder');

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
const builder = new qb("query-builder", fields);




test('create empty criteria box', () => {
    expect(document.getElementsByClassName('criterium-button')[0]).toBeDefined();
    expect(document.getElementsByClassName('criterium-button')[0].innerText).toEqual('+');

    document.getElementsByClassName('criterium-button')[0].click();

    expect(JSON.parse(document.getElementById('query-builder').innerText).length).toEqual(1);
});

test('check if form values are set', () => {   
    expect(document.getElementsByClassName('criteria-select')[0].firstElementChild.value).toEqual('country');
    expect(document.getElementsByClassName('criteria-select')[0].firstElementChild.innerHTML).toEqual('Country');
});

test('output format is valid', () => {
    expect(document.getElementById('query-builder').innerText).toEqual('[{"criterium":"country","values":[{"condition":"includes","value":""}]}]');
});

test('remove criteria box', () => {
    document.getElementsByClassName('remove-criterium-button')[0].click();
    expect(JSON.parse(document.getElementById('query-builder').innerText).length).toEqual(0);
});
