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
    "closed": {
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
    if (typeof element !== "string" && !(element instanceof HTMLElement)) {
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
    const internalQuery = [];

    // Process all criteria(OR) present
    criteria.forEach((criterium) => {
      const criteriumValue = criterium.querySelector(".criteria-select").value;
      // Push adds to the end of the array and returns the length; The new item has index length - 1;
      const itemIndex = internalQuery.push({
        criterium: criteriumValue,
        values: []
      }) - 1;

      const conditions = criterium.querySelectorAll(".condition-container");
      const conditionValues = [];

      // Process all conditions (AND) for this criterium
      conditions.forEach((condition) => {
        const conditionValue = condition.querySelector(".condition-select")?.value;
        let value = null;
        // Handle different input types
        if (condition.querySelector(".value-singleinput") !== null) {
          value = condition.querySelector(".value-singleinput").innerHTML;
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
      internalQuery[itemIndex].values = conditionValues;
    });

    this.query = internalQuery;
    this.element.innerText = JSON.stringify(this.query);
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
    if (this.element.innerText !== "" && this.element.innerText !== undefined) {
      this.#buildFromQuery(JSON.parse(this.element.innerText));
    }
    this.#buildQuery(this.queryContainer);
  }

  #addNewCriteriumButton(element) {
    const criteriumButton = document.createElement("button");
    criteriumButton.classList.add("criterium-button");
    criteriumButton.innerText = "+";
    criteriumButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.#addNewCriterium(e.target)
    });
    element.appendChild(criteriumButton);
  }

  #addNewCriterium(button, criterium = null) {
    const criteriumSelect = document.createElement("div");
    criteriumSelect.classList.add("criterium-select");
    criteriumSelect.id = `criterium-select-${this.#makeid(10)}`;
    const options = [];
    this.fields.forEach((field) => {
      options.push({ 
        label: this.#formatName(field.label === undefined || field.label === null ? field.value : field.label), 
        value: field.value
      });
    });
    const choiceContainer = document.createElement("div");
    choiceContainer.classList.add("criteria-choice-container");
    criteriumSelect.appendChild(choiceContainer);
    const choiceSelect = document.createElement("select");
    choiceSelect.classList.add("criteria-select");
    choiceContainer.appendChild(choiceSelect);
    choiceSelect.addEventListener("change", (e) => {
      this.#addConditions(e.target, choiceSelect.value);
    });
    const choice = new Choices(choiceSelect, {
      choices: options,
      allowHTML: true,
      itemSelectText: '',
    });
    button.parentNode.insertBefore(criteriumSelect, button);
    const linkElement = document.createElement("p");
    linkElement.classList.add("criteria-link");
    linkElement.innerText = "OR";
    button.parentNode.insertBefore(linkElement, button);
    if(criterium === null) {
      this.#addConditions(choiceSelect, choiceSelect.value);
    } else {
      choice.setChoiceByValue(criterium.criterium);
      criterium.values.forEach((value) => {
        this.#addConditions(choiceSelect, criterium.criterium, value);
      });
    }
    this.#buildQuery(this.queryContainer);
  }

  #addConditions(selectElement, criterium, selected=null) {
    let conditionsDiv = selectElement.closest(".criterium-select").querySelector(".conditions-container");
    // Refresh if a new criterium is selected
    if (this.#lastCriteria[selectElement.closest(".criterium-select").id] !== criterium && conditionsDiv) {
      conditionsDiv.querySelectorAll(".condition-container, .conditions-link").forEach((condition) => {
        condition.remove();
      });
    }
    this.#lastCriteria[selectElement.closest(".criterium-select").id] = criterium;
    let addConditionButton = selectElement.closest(".criterium-select").querySelector(".add-condition-text");
    // Create the element if it does not exist, else add a new element
    if (conditionsDiv === null) {
      conditionsDiv = document.createElement("div");
      conditionsDiv.classList.add("conditions-container");
      addConditionButton = document.createElement("p");
      addConditionButton.innerText = "+ Add condition";
      addConditionButton.classList.add("add-condition-text");
      addConditionButton.addEventListener("click", (e) => {
        e.preventDefault();
        const currentCriterium = conditionsDiv.parentNode.querySelector(".criteria-select").value;
        this.#addConditions(selectElement, currentCriterium);
      });
      const criteriumSelect = selectElement.closest(".criterium-select");
      criteriumSelect.appendChild(conditionsDiv);
      conditionsDiv.appendChild(addConditionButton);
    }
    const conditionContainer = document.createElement("div");
    conditionContainer.classList.add("condition-container");
    conditionContainer.id = `condition-container-${this.#makeid(10)}`;
    const conditionSelect = document.createElement("select");
    conditionSelect.classList.add("condition-select");
    conditionContainer.appendChild(conditionSelect);
    conditionsDiv.insertBefore(conditionContainer, addConditionButton);
    // There is something above this condition
    if (conditionContainer.previousElementSibling !== null) {
      const conditionsLink = document.createElement("p");
      conditionsLink.classList.add("conditions-link");
      conditionsLink.innerHTML = "AND";
      conditionContainer.parentElement.insertBefore(conditionsLink, conditionContainer);
    }

    let conditionSelects = conditionsDiv.querySelectorAll(".condition-select");
    conditionSelects.forEach((condition, i) => {
      const criteriumType = this.fields.find((field) => field.value === criterium).type;
      let conditionOptions = Object.assign(
        {},
        this.#conditions[criteriumType]
      );
      
      // Do not include the isEqual and isNotEqual options for closed questions
      if (criteriumType !== "closed") {
        conditionOptions = Object.assign(conditionOptions, this.#conditions["general"]);
      }
      Object.entries(conditionOptions).forEach(([key, value]) => {
        const newOption = new Option(value, key);
        if (!Array.from(condition.options).find((option) => option.value === key)) {
          condition.add(newOption);
        }
      });
    });
    if (selected) {
      this.#addValueInput(conditionSelect, selected.value);
      conditionSelect.value = selected.condition;
    } else {
      this.#addValueInput(conditionSelect);
    }
    conditionSelect.addEventListener("change", (e) => {
      this.#addValueInput(conditionSelect);
    });
  }

  #addValueInput(condition, value=null) {
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
      const singleValueInput = document.createElement("span");
      singleValueInput.role = "textbox";
      singleValueInput.contentEditable = true;
      singleValueInput.classList.add("value-singleinput");
      singleValueInput.classList.add("textarea");
      condition.parentNode.insertBefore(singleValueInput, condition.nextElementSibling);
      singleValueInput.focus();
      this.#addRemoveCriteriumButton(singleValueInput);
      if(value !== null) {
        singleValueInput.textContent = value;
      }
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
      if (value !== null) {
        firstInput.value = value.first;
      }
      const separator = document.createElement("p");
      separator.innerHTML = "and";
      doubleInputContainer.appendChild(separator);
      const secondInput = document.createElement("input");
      secondInput.type = "text";
      secondInput.classList.add("doubleinput-secondvalue");
      doubleInputContainer.appendChild(secondInput);
      if (value !== null) {
        secondInput.value = value.second;
      }
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
      const field = this.fields.find((singleField) => singleField.value === criterium);
      const options = field.values.map((singleField) => {
        if (typeof value === "string") {
          return {
            label: this.#capitalizeFirstLetter(singleField),
            value: singleField,
          };
        } else if (typeof value === "object") {
          return {
            label: singleField.label,
            value: singleField.value,
          };
        }
      });
      const choices = new Choices(conditionSelect, {
        choices: options,
        allowHTML: true,
        itemSelectText: '',
      });
      if (value !== null) {
        choices.items = value;
        choices.setChoiceByValue(value);
      }
      const parentId = condition.closest(".condition-container").id;
      this.#choiceElements[parentId] = choices;
      this.#addRemoveCriteriumButton(conditionSelect.parentNode.parentNode);
    }
  }

  #addRemoveCriteriumButton(lastInput) {
    if (lastInput.parentElement.querySelector(".remove-criterium-button") === null) {
      const removeCriteriumButton = document.createElement("button");
      removeCriteriumButton.classList.add("remove-criterium-button");
      removeCriteriumButton.innerHTML = "✕";
      lastInput.parentNode.insertBefore(removeCriteriumButton, lastInput.nextElementSibling);
      removeCriteriumButton.addEventListener("click", (e) => {
        e.preventDefault();
        const linkElement = lastInput.parentElement.previousElementSibling;
        if (linkElement) {
          linkElement.remove();
        }
        const siblings = removeCriteriumButton.parentElement.parentElement.children;
        // If this is the last element, remove the entire element, otherwise remove only this one
        if (siblings.length > 2) {
          removeCriteriumButton.parentElement.remove();
          if (siblings[0].classList.contains("conditions-link")) {
            siblings[0].remove();
          }
        } else {
          // remove the OR text that links the criterium boxes
          removeCriteriumButton.parentElement.parentElement.parentElement.nextElementSibling.remove();
          // remove criteria box
          removeCriteriumButton.parentElement.parentElement.parentElement.remove();
        }
        this.#buildQuery(this.queryContainer);
      });
    }
  }

  #buildFromQuery(query) {
    const initialButton = this.queryContainer.querySelector(".criterium-button");
    query.forEach((criterium) => {
      this.#addNewCriterium(initialButton, criterium);
    });
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
if (typeof module !== "undefined") {
  module.exports = QueryBuilder;
}