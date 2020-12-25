import State from './_State'

class Table {
  constructor() {
    this.products = [
      {
        name: "Default product 1",
        date: "2020/12/1",
        price: "10000"
      },
      {
        name: "Default product 2",
        date: "220/12/3",
        price: "20000"
      },
      {
        name: "Default product 3",
        date: "2020/12/3",
        price: "30000"
      }
      
    ]
    this.hostEl = document.querySelector('.js-tableBody');
    this.templateEl = document.getElementById('table-row');
    this.initInsertEl();
    this.renderContent();

    State.addListner((projects) => {
      this.renderContent();
    })
  };

  initInsertEl() {
    this.element = document.importNode(this.templateEl.content, true).firstElementChild;
  }

  renderContent() {
    this.hostEl.innerHTML = "";
    for(const product of State.products) {
      const a = document.createElement('a')
      this.element.querySelector('.c-table__name').textContent = product.name;
      this.element.querySelector('.c-table__date').textContent = product.date;
      this.element.querySelector('.c-table__price').textContent = product.price;
      this.hostEl.insertAdjacentElement('afterbegin', this.element);
      this.initInsertEl();
    }
  }

}

export default Table;