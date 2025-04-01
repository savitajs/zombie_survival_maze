import { MathUtil } from '../Util/MathUtil.js'
import { Rect } from '../Util/Rect.js';

export class Partition {

  // Partition constructor
  constructor(x, y, w, h) {
    this.rect = new Rect(x, y, w, h);
    this.left = null;
    this.right = null;
  }

  // Partition is a leaf if if has no left and right
  isLeaf() {
    return this.left === null && this.right === null;
  }

  // Gets all leaf partitions from the current partition
  getLeaves() {
    if (this.isLeaf()) return [this];
    // The spread operator (...) takes an array (or object) and spreads
    // its contents into a new context (here, array we return)
    return [
      ...this.left.getLeaves(),
      ...this.right.getLeaves()
    ];
  }

  // Split method, take in a minSize of a partition
  split(minSize) {
 
    // Check to see if we can split horizontally
    let canSplitH = this.rect.h >= minSize * 2;

    // Check to see if we can split vertically
    let canSplitV = this.rect.w >= minSize * 2;

    // If we cannot do either, this is a leaf!
    if (!canSplitH && !canSplitV) return;

    // Otherwise, check if we are going to split horizontally
    // We split horizontally if can split horizontally
    // and can either not split vertically, or 50% of the time
    // If not, we split vertically
    let splitH = canSplitH && (!canSplitV || Math.random() < 0.5);

    // If we are splitting horizontally
    if (splitH) {

      // Get a random horizontal split (y axis)
      let split = MathUtil.getRandomInt(minSize, this.rect.h - minSize);

      this.left = new Partition(this.rect.x, this.rect.y, this.rect.w, split);
      this.right = new Partition(this.rect.x, this.rect.y + split, this.rect.w, this.rect.h - split);

    } else {

      // Get a random horizontal split (x axis)
      let split = MathUtil.getRandomInt(minSize, this.rect.w - minSize);

      this.left = new Partition(this.rect.x, this.rect.y, split, this.rect.h);
      this.right = new Partition(this.rect.x + split, this.rect.y, this.rect.w - split, this.rect.h);
    }
    
    // Recursive call to split children
    this.left.split(minSize);
    this.right.split(minSize);
  }



}
