# Search-query-builder
This is a library for building search queries. It has a visual input and JSON output. All possible queries can be formed with a combination of AND and OR-statements.
## Installation
Add the QueryBuilder.js and QueryBuilder.css to your project directory, install or use a cdn for [choices.js](https://github.com/Choices-js/Choices) then include as follows:
```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
<link rel="stylesheet" lang="css" href="QueryBuilder.css" />
<script src="QueryBuilder.js"></script>
```
## Usage
QueryBuilder(element, fields)
```javascript
  const builder = new QueryBuilder(element, fields);
```
### element
Type: `HTMLElement` or `string` (where string is a valid id of an element). This should be a textarea or other input element, which can be in a form.

### fields
Type: `Object[]` the name of the fields and their types. For object syntax, see example below.

## Available condition types and their criteria
### General (all but multiple choice)
- Equal to (`equal`)
- Not equal to (`notequal`)

### Number
- Greater than (`greater`)
- Smaller than (`smaller`)
- Between (`between`)

There are no "Greater/smaller than or equal to", these can be made by adjusting the criteria

### Text
- Includes (`includes`)
- Does not include (`notincludes`)
- Starts with (`startswith`)
- Ends With (`endswith`)
- Regular expression (`regex`)

### Multiple choice
- Is one of (`isoneof`)
- Is all (`isall`)
- Not all (`notall`)
- Not one of (`notoneof`)

Single choice questions can be built by using `isall` and using only one item.
Besides `name` and `type`, multiple choice questions also need a `values` field, indicating all possible values.
## Sample field setup
```
[
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
  ]
```
Names have their first character capitalized, underscores are converted to spaces when displayed.