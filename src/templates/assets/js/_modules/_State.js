
class State {
  constructor() {
    this.listners = [];
    this.products = [
      {
        name: "Default product 1",
        date: "2020-12-1",
        price: "10000"
      },
      {
        name: "Default product 2",
        date: "220-12-3",
        price: "20000"
      },
      {
        name: "Default product 3",
        date: "2020-12-3",
        price: "30000"
      }
      
    ]

  };

  addProduct(newProduct) {
    this.products = [newProduct, ...this.products];
    for(const listnerFn of this.listners) {
      listnerFn(this.products.slice());
    }
  };

  addListner(listnerFn) {
    this.listners.push(listnerFn);
  }
}
export default new State();