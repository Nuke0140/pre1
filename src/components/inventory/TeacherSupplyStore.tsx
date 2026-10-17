'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Package,
  Sparkles,
  Filter,
  CheckCircle2,
  Boxes,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react'
import { SupplyItemCatalogCard } from '@/lib/inventory/supply-cart-service'

export interface CartItem {
  itemId: string
  name: string
  sku: string
  category: string
  unit: string
  quantity: number
  availableStock: number
  iconEmoji: string
  notes?: string
}

interface TeacherSupplyStoreProps {
  items: SupplyItemCatalogCard[]
  categories: Array<{ id: string; name: string; code: string; count: number }>
  cart: CartItem[]
  onAddToCart: (item: SupplyItemCatalogCard, quantity: number) => void
  onUpdateCartQuantity: (itemId: string, newQty: number) => void
  onOpenCart: () => void
  loading?: boolean
  assignedClassroom?: { id: string; name: string; code: string } | null
  branchName?: string | null
}

export function TeacherSupplyStore({
  items,
  categories,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenCart,
  loading = false,
  assignedClassroom,
  branchName,
}: TeacherSupplyStoreProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Map cart items for fast O(1) lookup
  const cartItemMap = useMemo(() => {
    const map = new Map<string, CartItem>()
    for (const c of cart) {
      map.set(c.itemId, c)
    }
    return map
  }, [cart])

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, i) => acc + i.quantity, 0)
  }, [cart])

  // Filtered supplies
  const filteredSupplies = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.category.id === selectedCategory

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.name.toLowerCase().includes(q)

      return matchesCategory && matchesSearch
    })
  }, [items, selectedCategory, searchQuery])

  const getItemQuantity = (itemId: string) => {
    return quantities[itemId] ?? 1
  }

  const handleQuantityChange = (itemId: string, delta: number, maxAvailable: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] ?? 1
      const next = Math.max(1, Math.min(maxAvailable > 0 ? maxAvailable : 99, current + delta))
      return { ...prev, [itemId]: next }
    })
  }

  const handleDirectQuantityInput = (itemId: string, valStr: string, maxAvailable: number) => {
    const val = parseInt(valStr, 10)
    if (isNaN(val)) return
    const clamped = Math.max(1, Math.min(maxAvailable > 0 ? maxAvailable : 99, val))
    setQuantities((prev) => ({ ...prev, [itemId]: clamped }))
  }

  return (
    <div className="space-y-6">
      {/* ── TOP HERO BANNER & SEARCH ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Classroom Supplies Store</span>
            {branchName && <span className="opacity-80">• {branchName}</span>}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Order Classroom Materials & Supplies
          </h1>
          <p className="text-sm md:text-base text-emerald-50 max-w-xl">
            Browse verified school stock, add supplies to your classroom cart, and submit for principal approval with zero paperwork.
          </p>

          {assignedClassroom && (
            <div className="pt-1 flex items-center gap-2 text-xs font-medium text-emerald-100">
              <span className="px-2.5 py-1 rounded-md bg-white/15 border border-white/20">
                🏫 Requesting for: <strong>{assignedClassroom.name}</strong> ({assignedClassroom.code})
              </span>
            </div>
          )}
        </div>

        {/* Floating Cart Button for Mobile/Desktop */}
        <div className="mt-4 md:mt-0 md:absolute md:right-8 md:top-8 z-10">
          <button
            type="button"
            onClick={onOpenCart}
            className="group relative flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-xl transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95"
            aria-label={`View classroom cart with ${cart.length} items`}
          >
            <ShoppingCart className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
            <span>Classroom Cart</span>
            {cart.length > 0 && (
              <span className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white shadow-sm animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />
      </div>

      {/* ── CONTROLS & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crayons, chart paper, finger paint, wet wipes, markers..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Quick Summary Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {filteredSupplies.length} supply {filteredSupplies.length === 1 ? 'item' : 'items'} available
          </span>
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{cart.length} in Cart ({totalCartCount} units)</span>
          </button>
        </div>
      </div>

      {/* ── CATEGORY PILL FILTER CHIPS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          All Supplies ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── PRODUCT CARDS GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      ) : filteredSupplies.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-2xl">
            📦
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No classroom supplies match your search
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search terms or selecting another category from the filters above.
          </p>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Reset filters & show all supplies
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
          {filteredSupplies.map((product) => {
            const inCart = cartItemMap.get(product.id)
            const itemQty = getItemQuantity(product.id)
            const isOutOfStock = product.isOutOfStock
            const isLowStock = product.isLowStock

            return (
              <div
                key={product.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-white dark:bg-gray-800 p-4.5 transition-all duration-200 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 ${
                  inCart
                    ? 'border-emerald-400 bg-emerald-50/20 dark:border-emerald-600 dark:bg-emerald-950/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div>
                  {/* Top Bar: Category & Stock Status */}
                  <div className="flex items-center justify-between gap-1 text-[11px] mb-3">
                    <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                      {product.category?.name || 'Supply'}
                    </span>

                    {/* Stock status badge */}
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 px-2 py-0.5 font-bold text-red-700 dark:text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {product.availableStock} left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        {product.availableStock} in stock
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / Icon Circle */}
                  <div className="relative mb-3.5 flex h-28 items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/80 p-2 overflow-hidden group-hover:scale-[1.02] transition-transform">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-5xl filter drop-shadow-sm select-none">
                        {product.iconEmoji}
                      </span>
                    )}

                    {/* In Cart Indicator Ribbon */}
                    {inCart && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <Check className="h-3 w-3" />
                        <span>{inCart.quantity} in Cart</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1 mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono text-[11px]">{product.sku}</span>
                      <span>•</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        Unit: {product.unit?.symbol || product.unit?.name || 'Pack'}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 pt-0.5">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── CARD BOTTOM ACTIONS ── */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                  {/* Quantity Stepper & Add Action */}
                  <div className="flex items-center gap-2">
                    {/* Stepper control */}
                    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          inCart
                            ? onUpdateCartQuantity(product.id, Math.max(0, inCart.quantity - 1))
                            : handleQuantityChange(product.id, -1, product.availableStock)
                        }
                        disabled={isOutOfStock || (inCart ? inCart.quantity <= 0 : itemQty <= 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.availableStock > 0 ? product.availableStock : 99}
                        value={inCart ? inCart.quantity : itemQty}
                        onChange={(e) =>
                          inCart
                            ? onUpdateCartQuantity(
                                product.id,
                                Math.max(0, Math.min(product.availableStock, parseInt(e.target.value, 10) || 0))
                              )
                            : handleDirectQuantityInput(product.id, e.target.value, product.availableStock)
                        }
                        disabled={isOutOfStock}
                        className="w-10 text-center font-bold text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          inCart
                            ? onUpdateCartQuantity(
                                product.id,
                                Math.min(product.availableStock, inCart.quantity + 1)
                              )
                            : handleQuantityChange(product.id, 1, product.availableStock)
                        }
                        disabled={isOutOfStock || (inCart ? inCart.quantity >= product.availableStock : itemQty >= product.availableStock)}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart button */}
                    <button
                      type="button"
                      onClick={() => onAddToCart(product, itemQty)}
                      disabled={isOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : inCart
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-900 text-white hover:bg-emerald-600 dark:bg-gray-700 dark:hover:bg-emerald-600'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{inCart ? 'Add More' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
