export class Cart {
  public items;
  public totalQty;
  public totalPrice;

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
        qty: 0,
        price: 0
      };
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.amount * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.amount;
  }

  public generateArray() {
    const arr = [];
    for (const id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  }

}
