export class BoundedMap<K, V> extends Map<K, V> {
  private maxSize: number;

  constructor(maxSize: number = 500) {
    super();
    this.maxSize = maxSize;
  }

  override set(key: K, value: V): this {
    if (this.size >= this.maxSize && !this.has(key)) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }
    super.set(key, value);
    return this;
  }
}
