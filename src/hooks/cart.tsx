import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const productsData = await AsyncStorage.getItem(
          '@GoMarketplace:products',
        );

        if (productsData) {
          setProducts(JSON.parse(productsData));
        }
      } catch (err) {}
    }

    loadProducts();
  }, []);

  const persistProducts = useCallback(async (newProducts: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(newProducts),
    );
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
        }
        return product;
      });
      setProducts(newProducts);
      await persistProducts(newProducts);
    },
    [persistProducts, products],
  );

  const decrement = useCallback(
    async id => {
      let deleteIndex = '';
      const newProducts = products
        .map(product => {
          if (product.id === id) {
            if (product.quantity <= 1) {
              deleteIndex = id;
            } else {
              product.quantity -= 1;
            }
          }
          return product;
        })
        .filter(product => product.id !== deleteIndex);

      setProducts(newProducts);
      await persistProducts(newProducts);
    },
    [persistProducts, products],
  );

  const addToCart = useCallback(
    async product => {
      if (products.some(prod => prod.id === product.id)) {
        await increment(product.id);
        return;
      }
      const newProduct = product as Product;
      newProduct.quantity = 1;
      const newProducts = [...products, product];
      setProducts(newProducts);
      await persistProducts(newProducts);
    },
    [increment, persistProducts, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
