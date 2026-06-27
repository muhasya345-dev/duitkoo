// Tipe data frontend (selaras dengan respons API).

export interface Category {
  id: number
  name: string
  type: string | null
  color: string | null
  icon: string | null
  monthly_budget?: number
}

export interface CategoryBudgetStatus {
  category_id: number
  name: string
  color: string | null
  icon: string | null
  budget: number
  spent: number
}

export interface Expense {
  id: number
  date: string
  category_id: number | null
  category_name?: string | null
  category_color?: string | null
  category_icon?: string | null
  description: string | null
  amount: number
  payment_method: string | null
  is_wedding: number
  receipt_id: number | null
  receipt_key?: string | null
  note: string | null
  created_at?: string
}

export interface IncomeSource {
  id?: number
  name: string
  amount: number
  frequency: string
  month_pattern: string
}

export interface GoldEntry {
  id?: number
  month: string
  grams: number
  price_per_gram: number
}

export interface BudgetItem {
  id?: number
  item: string
  estimated: number
  actual: number
  priority: string | null
  note?: string | null
}

export interface ReceiptExtraction {
  merchant: string | null
  date: string | null
  total: number | null
  currency: string
  items: { name: string; qty: number; price: number }[]
  category_guess: string | null
}

export interface GoldPrice {
  spot_per_gram: number
  retail_per_gram: number
  premium_pct: number
  mahar_target_gram: number
  mahar_estimate: number
  updated_at: number
  source: string
}

export interface ProjectionMonth {
  month: string
  label: string
  income: number
  living_cost: number
  net: number
  cumulative: number
}

export interface SavingsEntry {
  id: number
  date: string
  amount: number
  note: string | null
}

// Titik grafik gabungan proyeksi + aktual.
export interface ChartPoint {
  label: string
  month: string
  proyeksi: number
  aktual: number | null
}
