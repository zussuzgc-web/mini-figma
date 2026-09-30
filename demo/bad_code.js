const API_BASE_URL = 'https://api.demo-shop.example/v1'

const VAT_RATE = 0.21
const DISCOUNT_RATE = 0.1
const DISCOUNT_THRESHOLD = 1000
const MONEY_SCALE = 100

function getApiToken() {
  const token = process.env.DEMO_SHOP_API_TOKEN
  if (!token) {
    throw new Error('DEMO_SHOP_API_TOKEN is not set')
  }
  return token
}

function roundMoney(value) {
  return Math.round(value * MONEY_SCALE) / MONEY_SCALE
}

export function calcTotal(price, qty, discountRate = 0) {
  const subtotal = price * qty
  const discount = subtotal > DISCOUNT_THRESHOLD ? subtotal * discountRate : 0
  const taxable = subtotal - discount
  const vat = taxable * VAT_RATE
  return roundMoney(taxable + vat)
}

export async function fetchProduct(id) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    headers: { Authorization: `Bearer ${getApiToken()}` },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export async function checkout(productId, qty, useDiscount) {
  const product = await fetchProduct(productId)
  const total = calcTotal(product.price, qty, useDiscount ? DISCOUNT_RATE : 0)
  return { productId, qty, total }
}
