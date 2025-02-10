import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ProductDetails from '../../../src/pages/ProductDetails';

// mock modules
jest.mock('axios');

// mocks for contexts/hooks in Header
jest.mock('../../../src/context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../../src/context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../../../src/context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
    
jest.mock('../../../src/hooks/useCategory', () => jest.fn(() => []));

describe('basic test', () => {
  it('runs', () => {
    expect(4).toBe(4);
  })
})

describe('ProductDetails', () => {
  it('renders', async () => {
    axios.get.mockResolvedValueOnce({ 
      data: {
        product: {
          _id: 'productid',
          category: {
            _id: 'catid',
            name: 'category name'
          },
          name: 'product name',
          description: 'product desc',
          price: 1.00,
        },
      }
    }).mockResolvedValueOnce({ 
      data: {
        products: []
      }
    })

    const {getByText} = render(
      <MemoryRouter initialEntries={['/product/slooge']}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2))
    expect(getByText('Product Details')).toBeInTheDocument()
    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/slooge');
    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/related-product/productid/catid');
    
  })
})

