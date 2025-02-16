
const controllers = require("../../controllers/productController")
const productModel = require("../../models/productModel")

jest.mock('dotenv')
jest.mock('braintree')
jest.mock('mongoose')
// jest.mock('../../models/productModel', () => (function () {
//   this.findOne = jest.fn(() => this);
//   this.select = jest.fn(() => this);
//   this.populate = jest.fn(() => this);
// }))
jest.mock('../../models/productModel', () => {
  const t = {
    findOne: jest.fn(() => t),
    select: jest.fn(() => t),
    populate: jest.fn(() => t),
    then: jest.fn(),
  }
  return t;
})

describe('getSingleProductController', () => {
  it('retrieves a product successfully', async () => {
    const req = {
      params: {
        slug: 'slug'
      }
    }
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(() => res),
    }
    const product = { _id: 'id' };
    productModel.populate.mockResolvedValue(product);

    await controllers.getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product
    });

    expect(productModel.findOne).toHaveBeenCalledWith({slug: 'slug'})
    expect(productModel.select).toHaveBeenCalledWith('-photo')
    expect(productModel.populate).toHaveBeenCalledWith('category')
  })

})

describe.skip('productModel Mock', () => {
  it('can call methods of productModel', () => {
    productModel.findOne().select().populate()
  })
})

