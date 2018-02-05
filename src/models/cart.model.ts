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
        qty: 0,
        price: 0
      };
    }
    console.log('storedItem', storedItem);
    console.log('item', item);

    storedItem.qty++;
    storedItem.price = <number>storedItem.item.amount * <number>storedItem.qty;
    this.totalQty++;
    this.totalPrice = <number>(this.totalPrice * 1) + <number>(storedItem.item.amount * 1);
  }

  public generateArray() {
    const arr = [];
    for (const id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  }

}
