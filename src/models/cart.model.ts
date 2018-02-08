export class Cart {
  public items;
  public totalQty;
  public totalPrice: number;

  constructor(oldCart: Cart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
  }

  public add(item, id) {
    let storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = {
        item: item,
        qty: 1,
        price: 0
      };
    }

    storedItem.price = <number>storedItem.item.amount * <number>storedItem.qty;
    this.totalQty = this.totalQty + storedItem.qty;
    this.totalPrice = this.totalPrice + storedItem.price;
  }

  public remove(item, id){
    let storedItem = this.items[id];

    this.totalQty = this.totalQty - storedItem.qty;
    this.totalPrice = this.totalPrice - storedItem.price;
    
    let newItems = {};
    for(let i in this.items){
      if(i != id){
        newItems[i] = this.items[i];
      }
    }
    this.items = newItems;
  }

  public generateArray() {
    const arr = [];
    for (const id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  }

}
