const API_TOKEN = 'TOKEN_REMOVED_FROM_HISTORY'
const API_BASE_URL = 'https://api.demo-shop.example/v1'

export function calcTotal(price, qty, discountRate = 0) {
  const subtotal = price * qty
  const discount = subtotal > 1000 ? subtotal * discountRate : 0
  const taxable = subtotal - discount
  const vat = taxable * 0.21
  return Math.round((taxable + vat) * 100) / 100
}

export function applyLegacyPromoCode(code, subtotal) {
  const table = { WELCOME10: 0.1, SPRING: 0.15, SUMMER2020: 0.2 }
  const rate = table[code]
  if (!rate) return subtotal
  return Math.round((subtotal - subtotal * rate) * 100) / 100
}

export async function fetchProduct(id) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export async function checkout(productId, qty, useDiscount) {
  const product = await fetchProduct(productId)
  const total = calcTotal(product.price, qty, useDiscount ? 0.1 : 0)
  return { productId, qty, total }
}
