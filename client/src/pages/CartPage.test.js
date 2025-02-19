import React from 'react';
import { render, fireEvent, waitFor, screen, getDefaultNormalizer } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import CartPage from './CartPage';
import cart from '../context/cart';

const AUTH = {
  token: "token", 
  user: {
    name: "User Name",
    address: "User Address",
  }
}
// mock modules
jest.mock('axios');

// mocks for contexts/hooks in Header
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [AUTH, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
    
jest.mock('../hooks/useCategory', () => jest.fn(() => []));


const PRODUCT = {
  _id: 'productid',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'product name',
  description: 'product desc',
  price: 1.00,
};

const RELATED_PRODUCT_1 = {
  _id: 'relatedproductid',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'related product name',
  description: 'product desc',
  price: 2.00,
};

const RELATED_PRODUCT_2 = {
  _id: 'relatedproductid2',
  category: {
    _id: 'catid',
    name: 'category name'
  },
  name: 'related product name 2',
  description: 'product desc 2',
  price: 3.00,
};

describe('Cart Page', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockResolvedValueOnce({
      data: {
        clientToken: 'client token'
      }
    });

  });

  it('renders correctly with no products', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </MemoryRouter>
    );

    // detect page has loaded when this api call resolves
    waitFor(async () => expect(await axios.get.mock.results[0].value).toBe({
      data: {
        clientToken: 'client token'
      }
    }));

    expect(getByText('Hello User Name')).toBeInTheDocument()
    expect(getByText('User Address')).toBeInTheDocument()
    expect(getByText(/Your Cart Is Empty/)).toBeInTheDocument()
    expect(getByText('Total : $0.00')).toBeInTheDocument()
    expect(getByText('User Address')).toBeInTheDocument()
    
  });

  it('renders correctly with products', async () => {

    cart.useCart.mockReturnValueOnce([[PRODUCT], jest.fn()])

    const { getByText, getByPlaceholderText } = render(
      // <CartProvider>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      // </CartProvider>
    );

    // detect page has loaded when this api call resolves
    waitFor(async () => expect(await axios.get.mock.results[0].value).toBe({
      data: {
        clientToken: 'client token'
      }
    }));

    // getbytext trims by default
    expect(getByText('You Have 1 items in your cart ', {normalizer: getDefaultNormalizer({trim: false})})).toBeInTheDocument()
    expect(getByText('Total : $1.00')).toBeInTheDocument()
    
  });
})