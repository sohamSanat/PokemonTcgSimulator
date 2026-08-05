import { describe, it, expect } from 'vitest';
import { getItemSync, setItemSync, setItem, getItem } from './storageDb';

describe('storageDb Engine Unit Tests', () => {
  it('should store and retrieve key value synchronously via memory cache', () => {
    setItemSync('test_key_sync', 'hello_world');
    const value = getItemSync('test_key_sync');
    expect(value).toBe('hello_world');
  });

  it('should store and retrieve key value asynchronously via IndexedDB / memory cache', async () => {
    await setItem('test_key_async', 'async_data_value');
    const value = await getItem('test_key_async');
    expect(value).toBe('async_data_value');
  });

  it('should return null for non-existent key', () => {
    const value = getItemSync('non_existent_key_xyz');
    expect(value).toBeNull();
  });
});
