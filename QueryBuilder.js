class QueryBuilder {
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
    },
    "multiplechoice": {
      "isoneof": "Is one of",
      "isall": "Is all",
    },
  };
  #inputTypes = {
    "singleinput": ["equal", "notequal", "includes", "notincludes", "startswith", "endswith", "greater", "smaller"],
    "doubleinput": ["between"],
    "select": ["isoneof", "isall"],
  };
  #choiceElements = [];

  query = [];

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
    criteria.forEach((criterium) => {
      const criteriumValue = criterium.querySelector(".criteria-select").value;
      const conditionValue = criterium.querySelector(".condition-select")?.value;
      let value = null;
      if (criterium.querySelector(".value-singleinput") !== null) {
        value = criterium.querySelector(".value-singleinput").value;
      } else if (criterium.querySelector(".value-doubleinput") !== null) {
        value = {
          first: criterium.querySelector(".doubleinput-firstvalue").value,
          second: criterium.querySelector(".doubleinput-secondvalue").value,
        };
      } else if (criterium.querySelector(".choices") !== null) {
        value = this.#choiceElements[criterium.id].getValue(true);
      }
      if (this.query.findIndex(item => item.id === criterium.id) < 0) {
        this.query.push({
          id: criterium.id,
          criterium: criteriumValue,
          condition: conditionValue,
          value,
        });
      } else {
        const itemid = this.query.findIndex(item => item.id === criterium.id);
        this.query[itemid] = {
          id: criterium.id,
          criterium: criteriumValue,
          condition: conditionValue,
          value,
        };
      }
    });
  }

  #setupQueryContainer() {
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
    console.log(criterium);
    let conditionSelect = selectElement.parentNode.querySelector(".condition-select");
    // Create the element if it does not exist, else clear all options
    if (conditionSelect === null) {
      conditionSelect = document.createElement("select");
      conditionSelect.classList.add("condition-select");
      selectElement.parentNode.insertBefore(conditionSelect, selectElement.nextSibling);
    } else {
      for (let option in conditionSelect.options) {
        conditionSelect.options.remove(0);
      }
    }
    const criteriumType = this.fields.find((field) => field.name === criterium).type;
    const conditionOptions = Object.assign(
      {},
      this.#conditions["general"],
      this.#conditions[criteriumType]
    );
    Object.entries(conditionOptions).forEach(([key, value]) => {
      conditionSelect.add(new Option(value, key));
    });
    conditionSelect.addEventListener("change", (e) => {
      this.#addValueInput(conditionSelect, criterium);
    });
    this.#addValueInput(conditionSelect, criterium);
  }

  #addValueInput(condition, criterium) {
    console.log(criterium);
    // Check if a single input field
    if (this.#inputTypes["singleinput"].includes(condition.value)) {
      // Check if the current element is already this type, otherwise add or replace
      if (condition.nextElementSibling !== null) {
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
      if (condition.nextElementSibling !== null) {
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
      if (condition.nextElementSibling !== null) {
        // We have a sibling, is it a singleInput?
        if (!condition.nextElementSibling.classList.contains("value-select")) {
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
      const criterium = condition.parentNode.querySelector(".criteria-select").value;
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
    const removeCriteriumButton = document.createElement("button");
    removeCriteriumButton.classList.add("remove-criterium-button");
    removeCriteriumButton.innerHTML = "✕";
    lastInput.parentNode.insertBefore(removeCriteriumButton, lastInput.nextElementSibling);
    removeCriteriumButton.addEventListener("click", (e) => {
      removeCriteriumButton.parentElement.remove();
      this.#buildQuery(this.queryContainer);
      this.element.innerText = JSON.stringify(this.query);
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