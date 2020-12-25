import State from './_State';

class Form {
  constructor() {
    this.nameInput = document.querySelector('.js-nameInput');
    this.dateInput = document.querySelector('.js-dateInput');
    this.priceInput = document.querySelector('.js-priceInput');
    this.submitBtn = document.querySelector('.js-submitBtn');

    this.submitBtn.addEventListener('click', this.submitHandler.bind(this));
  };

  clearInput() {
    this.nameInput.value = "";
    this.dateInput.value = "";
    this.priceInput.value = "";
  }

  submitHandler(event) {
    event.preventDefault();
    const newProduct = {
      name: this.nameInput.value,
      date: this.dateInput.value,
      price: this.priceInput.value
    };
    State.addProduct(newProduct);
    this.clearInput();
  };
}

export default Form;