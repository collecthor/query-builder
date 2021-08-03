class QueryBuilder {
  // Constants
  #conditions = {
    "general": {
      "equal": "Equal to",
      "notequal": "Not equal to",
    },
    "number": {
      "greater": "Greater than",
      "smaller": "Smaller than",
      "between": "Between",
    },
    "text": {
      "includes": "Includes",
      "notincludes": "Does not include",
      "startswith": "Starts with",
      "endswith": "Ends with",
      "regex": "Regular expression"
    },
    "multiplechoice": {
      "isoneof": "Is one of",
      "isall": "Is all",
      "notall": "Is not all",
      "notoneof": "Is not one of",
    },
  };
  #inputTypes = {
    "singleinput": ["equal", "notequal", "includes", "notincludes", "startswith", "endswith", "greater", "smaller", "regex"],
    "doubleinput": ["between"],
    "select": ["isoneof", "isall", "notall", "notoneof"],
  };
  #choiceElements = [];

  #lastCriteria = {};

  query = [];

  lastCondition = "";

  constructor(element, fields) {
    // Check parameters given and convert to element if needed
    this.element = element;
    this.fields = fields;
    if (typeof element !== "string" && !element instanceof HTMLElement) {
      throw TypeError("Element must be a string or element");
    }
    if (typeof element === "string") {
      this.element = document.getElementById(element);
      if (this.element === null) {
        throw Error(`Element with id ${element} could not be found`);
      }
    }
    if (typeof Choices === 'undefined') {
      throw Error("Choices.js is needed for this library to work properly");
    }
    // Start building the widget
    this.#setupQueryContainer();
  }

  #buildQuery(element) {
    const criteria = element.querySelectorAll(".criterium-select");
    // Process all criteria(AND) present
    criteria.forEach((criterium) => {
      const criteriumValue = criterium.querySelector(".criteria-select").value;
      let itemIndex = this.query.findIndex(item => item.id === criterium.id);
      if (itemIndex < 0) {
        // Push adds to the end of the array and returns the length; The new item has index length - 1;
        itemIndex = this.query.push({
          id: criterium.id,
          criterium: criteriumValue,
          values: []
        }) - 1;
      }
      const conditions = criterium.querySelectorAll(".condition-container");
      const conditionValues = [];

      // Process all conditions (OR) for this criterium
      conditions.forEach((condition) => {
        const conditionValue = condition.querySelector(".condition-select")?.value;
        let value = null;
        // Handle different input types
        if (condition.querySelector(".value-singleinput") !== null) {
          value = condition.querySelector(".value-singleinput").value;
        } else if (condition.querySelector(".value-doubleinput") !== null) {
          value = {
            first: condition.querySelector(".doubleinput-firstvalue").value,
            second: condition.querySelector(".doubleinput-secondvalue").value,
          };
        } else if (condition.querySelector(".choices") !== null) {
          value = this.#choiceElements[condition.id].getValue(true);
        }
        conditionValues.push({
          condition: conditionValue,
          value,
        });
      });
      this.query[itemIndex].values = conditionValues;
    });
  }

  #setupQueryContainer() {
    // Hide the element and replace it with a container for the querybuilder
    this.element.hidden = true;
    const queryContainer = document.createElement("div");
    queryContainer.classList.add("query-container");
    queryContainer.id = `query-container-${this.#makeid(10)}`;
    this.queryContainer = this.element.parentNode.insertBefore(queryContainer, this.element);
    this.#addNewCriteriumButton(this.queryContainer);
    this.queryContainer.addEventListener("focusout", () => {
      this.#buildQuery(this.queryContainer);
      this.element.innerText = JSON.stringify(this.query);
    });
  }

  #addNewCriteriumButton(element) {
    const criteriumButton = document.createElement("button");
    criteriumButton.classList.add("criterium-button");
    criteriumButton.innerText = "+";
    criteriumButton.addEventListener("click", (e) => this.#addNewCriterium(e.target));
    element.appendChild(criteriumButton);
  }

  #addNewCriterium(button) {
    const criteriumSelect = document.createElement("div");
    criteriumSelect.classList.add("criterium-select");
    criteriumSelect.id = `criterium-select-${this.#makeid(10)}`;
    const criteriaInput = document.createElement("select");
    criteriaInput.classList.add("criteria-select");
    this.fields.map(field => field.name).forEach((field) => {
      criteriaInput.add(new Option(this.#formatName(field), field));
    });
    criteriumSelect.appendChild(criteriaInput);
    criteriaInput.addEventListener("input", (e) => {
      this.#addConditions(e.target, criteriaInput.value);
    })
    button.parentNode.insertBefore(criteriumSelect, button);
    this.#addConditions(criteriaInput, criteriaInput.value);
  }

  #addConditions(selectElement, criterium) {
    let conditionsDiv = selectElement.parentNode.querySelector(".conditions-container");
    // Refresh if a new criterium is selected
    if (this.#lastCriteria[selectElement.parentElement.id] !== criterium && conditionsDiv) {
      conditionsDiv.querySelectorAll(".condition-container").forEach((condition) => {
        condition.remove();
      });
    }
    this.#lastCriteria[selectElement.parentElement.id] = criterium;
    let addConditionButton = selectElement.parentNode.querySelector(".add-condition-text");
    // Create the element if it does not exist, else add a new element
    if (conditionsDiv === null) {
      conditionsDiv = document.createElement("div");
      conditionsDiv.classList.add("conditions-container");
      addConditionButton = document.createElement("p");
      addConditionButton.innerText = "+ Add condition";
      addConditionButton.classList.add("add-condition-text");
      addConditionButton.addEventListener("click", (e) => {
        const currentCriterium = conditionsDiv.parentNode.querySelector(".criteria-select").value;
        this.#addConditions(selectElement, currentCriterium);
      });
      selectElement.parentNode.appendChild(conditionsDiv);
      conditionsDiv.appendChild(addConditionButton);
    }
    const conditionContainer = document.createElement("div");
    conditionContainer.classList.add("condition-container")
    const conditionSelect = document.createElement("select");
    conditionSelect.classList.add("condition-select");
    conditionContainer.appendChild(conditionSelect);
    conditionsDiv.insertBefore(conditionContainer, addConditionButton);

    let conditionSelects = conditionsDiv.querySelectorAll(".condition-select");
    conditionSelects.forEach((condition) => {
      const criteriumType = this.fields.find((field) => field.name === criterium).type;
      let conditionOptions = Object.assign(
        {},
        this.#conditions[criteriumType]
      );
      
      // Do not include the isEqual and isNotEqual options for multiplechoice
      if (criteriumType !== "multiplechoice") {
        conditionOptions = Object.assign(conditionOptions, this.#conditions["general"]);
      }
      Object.entries(conditionOptions).forEach(([key, value]) => {
        const newOption = new Option(value, key);
        if (!Array.from(condition.options).find((option) => option.value === key)) {
          condition.add(newOption);
        }
      });
      this.#addValueInput(condition);
      condition.addEventListener("change", (e) => {
        this.#addValueInput(condition);
      });
    })
  }

  #addValueInput(condition) {
    if (this.#inputTypes["singleinput"].includes(condition.value)) {
      // Check if the current element is already this type, otherwise add or replace
      if (condition.nextElementSibling !== null && condition.nextElementSibling.tagName.toLowerCase() !== "p") {
        // We have a sibling, is it a singleInput?
        if (!condition.nextElementSibling.classList.contains("value-singleinput")) {
          condition.nextElementSibling.remove();
        } else {
          // It is already the correct element, so return from the function
          return;
        }
      }
      // Everything is set up to create a new input element
      const singleValueInput = document.createElement("input");
      singleValueInput.type = "text";
      singleValueInput.classList.add("value-singleinput");
      condition.parentNode.insertBefore(singleValueInput, condition.nextElementSibling);
      singleValueInput.focus();
      this.#addRemoveCriteriumButton(singleValueInput);
    } else if (this.#inputTypes["doubleinput"].includes(condition.value)) {
      // Check if the current element is already this type, otherwise add or replace
      if (condition.nextElementSibling !== null && condition.nextElementSibling.tagName.toLowerCase() !== "p") {
        // We have a sibling, is it a singleInput?
        if (!condition.nextElementSibling.classList.contains("value-doubleinput")) {
          condition.nextElementSibling.remove();
        } else {
          // It is already the correct element, so return from the function
          return;
        }
      }
      // Everything is set up to create a new input element
      const doubleInputContainer = document.createElement("div");
      doubleInputContainer.classList.add("value-doubleinput");
      const firstInput = document.createElement("input");
      firstInput.type = "text";
      firstInput.classList.add("doubleinput-firstvalue");
      doubleInputContainer.appendChild(firstInput);
      const separator = document.createElement("p");
      separator.innerHTML = "and";
      doubleInputContainer.appendChild(separator);
      const secondinput = document.createElement("input");
      secondinput.type = "text";
      secondinput.classList.add("doubleinput-secondvalue");
      doubleInputContainer.appendChild(secondinput);
      condition.parentNode.insertBefore(doubleInputContainer, condition.nextElementSibling);
      firstInput.focus();
      this.#addRemoveCriteriumButton(doubleInputContainer);
    } else if (this.#inputTypes["select"].includes(condition.value)) {
      // Check if the current element is already this type, otherwise add or replace
      if (condition.nextElementSibling !== null && condition.nextElementSibling.tagName.toLowerCase() !== "p") {
        // We have a sibling, is it a select?
        if (!condition.nextElementSibling.classList.contains("choices")) {
          condition.nextElementSibling.remove();
        } else {
          // It is already the correct element, so return from the function
          return;
        }
      }

      const conditionSelect = document.createElement("select");
      conditionSelect.multiple = true;
      conditionSelect.classList.add("value-select");
      condition.parentNode.insertBefore(conditionSelect, condition.nextElementSibling);
      const criterium = condition.parentNode.parentNode.parentNode.querySelector(".criteria-select").value;
      const field = this.fields.find((field) => field.name === criterium);
      const options = field.values.map((value) => {
        return {
          label: this.#capitalizeFirstLetter(value),
          value,
        };
      });
      const choices = new Choices(conditionSelect, {
        choices: options,
      });
      const parentId = condition.parentNode.id;
      this.#choiceElements[parentId] = choices;
    }
  }

  #addRemoveCriteriumButton(lastInput) {
    if (lastInput.parentElement.querySelector(".remove-criterium-button") === null) {
      const removeCriteriumButton = document.createElement("button");
      removeCriteriumButton.classList.add("remove-criterium-button");
      removeCriteriumButton.innerHTML = "✕";
      lastInput.parentNode.insertBefore(removeCriteriumButton, lastInput.nextElementSibling);
      removeCriteriumButton.addEventListener("click", (e) => {
        const siblings = removeCriteriumButton.parentElement.parentElement.children;
        // If this is the last element, remove the entire element, otherwise remove only this one
        if (siblings.length > 2) {
          removeCriteriumButton.parentElement.remove();
        } else {
          removeCriteriumButton.parentElement.parentElement.parentElement.remove();
        }
        this.#buildQuery(this.queryContainer);
        this.element.innerText = JSON.stringify(this.query);
      });
    }
  }

  #capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  #formatName(name) {
    return this.#capitalizeFirstLetter(name).replace("_", " ");
  }

  #makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
  }
}