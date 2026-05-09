# Configurable Per-Item Price Discounts — Implementation Plan

> **Project:** Rayn Motoparts POS · **Date:** 2026-05-08

---

## 1. Codebase Analysis Findings

| Layer | File | Key Finding |
|---|---|---|
| Backend model | `pos/models.py` | `Discount` model (line 179) exists with `type`, `value`, `applies_to` — **disconnected from checkout** |
| Backend model | `pos/models.py` | `SalesTransactionItem` has no discount columns |
| Backend model | `pos/models.py` | `ReceiptItem.discount_amount` exists (line 331) but **never populated** |
| Backend service | `pos/services.py` | `create_and_complete_sale()` only accepts `variant_id` + `qty` per item |
| Backend serializer | `pos/serializers.py` | `PosCheckoutItemSerializer` only validates `variant_id` + `qty` |
| Receipt writer | `pos/receipt_dual_write.py` | `ReceiptItem` created without `discount_amount` (hardcoded missing, line 114-125) |
| Frontend state | `PosModulePage.tsx` | `CartLine = { product, qty }` — no discount field |
| Frontend calc | `PosModulePage.tsx` | `subtotal` = `price × qty` with no discount deduction |
| Frontend payload | `PosModulePage.tsx` | API items only send `variant_id` + `qty` (lines 301-304) |

---

## 2. Design Decision — Inline Ad-Hoc (Phase 1)

**Chosen: Inline ad-hoc discounts entered by the cashier per cart line.**

Rationale: Motor-parts shops negotiate prices at the counter. No pre-configured discount library needed. The `Discount` model (preset codes) can be wired in Phase 2 — the schema is forward-compatible.

---

## 3. Database Schema Changes

### 3.1 `SalesTransactionItem` — 3 new columns

```python
discount_type = models.CharField(
    max_length=20,
    choices=[('percentage', 'Percentage'), ('fixed_amount', 'Fixed Amount')],
    null=True, blank=True,
)
discount_value = models.DecimalField(
    max_digits=10, decimal_places=4,
    null=True, blank=True,
    validators=[MinValueValidator(0)],
)
discount_amount = models.DecimalField(
    max_digits=14, decimal_places=4, default=Decimal('0'),
)
```

### 3.2 `SalesTransaction` — 1 new column

```python
discount_amount = models.DecimalField(
    max_digits=14, decimal_places=4, default=Decimal('0'),
)
```

> Mirrors the already-existing `Receipt.discount_amount` field.

### 3.3 `ReceiptItem` — no change

`discount_amount` already exists — we just start populating it.

### 3.4 Migration

New file: `pos/migrations/0007_discount_columns.py`

Adds all 4 columns above. All existing rows default to `0 / NULL` — no data migration required. Historic totals unaffected.

---

## 4. Backend Changes

### 4.1 `pos/models.py` — Update `SalesTransactionItem.save()`

```python
def save(self, *args, **kwargs):
    gross = self.qty * self.unit_price

    if self.discount_type == 'percentage' and self.discount_value:
        self.discount_amount = (gross * self.discount_value / Decimal('100')).quantize(Decimal('0.0001'))
    elif self.discount_type == 'fixed_amount' and self.discount_value:
        self.discount_amount = min(self.discount_value, gross)   # can't exceed line value
    else:
        self.discount_amount = Decimal('0')

    self.line_subtotal = gross - self.discount_amount            # net after discount
    taxable = self.line_subtotal
    self.line_tax_amount = (taxable * (self.tax_rate / Decimal('100'))).quantize(Decimal('0.0001'))
    self.line_total = taxable + self.line_tax_amount
    super().save(*args, **kwargs)
```

> Tax-after-discount is intentional — aligns with Philippine BIR VAT treatment.

### 4.2 `pos/serializers.py` — Update `PosCheckoutItemSerializer`

```python
class PosCheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    qty = serializers.DecimalField(max_digits=12, decimal_places=4, min_value=Decimal('0.0001'))
    discount_type = serializers.ChoiceField(
        choices=['percentage', 'fixed_amount'],
        required=False, allow_null=True, default=None,
    )
    discount_value = serializers.DecimalField(
        max_digits=10, decimal_places=4, min_value=Decimal('0'),
        required=False, allow_null=True, default=None,
    )

    def validate(self, attrs):
        d_type = attrs.get('discount_type')
        d_value = attrs.get('discount_value')
        if (d_type is None) != (d_value is None):
            raise serializers.ValidationError(
                'discount_type and discount_value must both be provided or both omitted.'
            )
        return attrs
```

### 4.3 `pos/services.py` — Update `create_and_complete_sale()`

**Item creation loop:**
```python
line = SalesTransactionItem.objects.create(
    sales_transaction=transaction_obj,
    product_variant=variant,
    qty=item['qty'],
    unit_price=unit_price,
    unit_cost=unit_cost,
    tax_rate=item_tax_rate,
    discount_type=item.get('discount_type'),    # NEW
    discount_value=item.get('discount_value'),  # NEW
)
line_items.append(line)
subtotal += line.line_subtotal
discount_amount += line.discount_amount         # NEW aggregate
tax_amount += line.line_tax_amount
total_amount += line.line_total
```

**Transaction save — add `discount_amount`:**
```python
transaction_obj.subtotal = subtotal
transaction_obj.discount_amount = discount_amount   # NEW
transaction_obj.taxable_amount = subtotal
transaction_obj.tax_amount = tax_amount
transaction_obj.total_amount = total_amount
# ...
transaction_obj.save(update_fields=[
    'subtotal', 'discount_amount', 'taxable_amount',  # added
    'tax_amount', 'total_amount', 'amount_tendered',
    'change_given', 'status', 'updated_at',
])
```

**Response dict — add `discountAmount`:**
```python
'transaction': {
    # ...existing keys...
    'discountAmount': float(transaction_obj.discount_amount),  # NEW
}
```

### 4.4 `pos/receipt_dual_write.py` — Propagate discount

In `receipt_defaults`:
```python
'discount_amount': txn.discount_amount,   # was missing, always 0
```

In the `ReceiptItem` creation loop:
```python
ReceiptItem.objects.create(
    # ...existing fields...
    discount_amount=item.discount_amount,  # was missing
)
```

---

## 5. Frontend Changes

### 5.1 `CartLine` interface

```typescript
interface CartLine {
  product: Product;
  qty: number;
  discountType: 'percentage' | 'fixed_amount' | null;
  discountValue: number | null;
}
```

### 5.2 Computation helper

```typescript
function computeLineDiscount(
  unitPrice: number, qty: number,
  discountType: CartLine['discountType'],
  discountValue: number | null,
) {
  const gross = unitPrice * qty;
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue !== null)
    discountAmount = (gross * discountValue) / 100;
  else if (discountType === 'fixed_amount' && discountValue !== null)
    discountAmount = Math.min(discountValue, gross);
  return { discountAmount, lineTotal: gross - discountAmount };
}
```

### 5.3 Updated memos

```typescript
const totalDiscount = useMemo(() =>
  cartLines.reduce((sum, l) =>
    sum + computeLineDiscount(Number(l.product.price), l.qty, l.discountType, l.discountValue).discountAmount, 0),
  [cartLines],
);

const subtotal = useMemo(() =>
  cartLines.reduce((sum, l) =>
    sum + computeLineDiscount(Number(l.product.price), l.qty, l.discountType, l.discountValue).lineTotal, 0),
  [cartLines],
);
```

### 5.4 Cart state handler

```typescript
const setLineDiscount = (
  productId: number,
  discountType: CartLine['discountType'],
  discountValue: number | null,
) => {
  setCart((prev) => {
    const existing = prev[productId];
    if (!existing) return prev;
    return { ...prev, [productId]: { ...existing, discountType, discountValue } };
  });
};
```

### 5.5 `addToCart` — initialize discount to null

```typescript
[product.id]: {
  product,
  qty: existing ? existing.qty + 1 : 1,
  discountType: existing?.discountType ?? null,
  discountValue: existing?.discountValue ?? null,
},
```

### 5.6 `CartLineDiscountEditor` component (new, inline in same file)

Renders beneath the qty controls of each cart line. Shows:
- **No discount:** a subtle "Add discount" link with a tag icon.
- **Open editor:** two toggle buttons (`% Off` | `₱ Off`), a number input, Apply/Cancel.
- **Discount applied:** green badge showing the discount and an ✕ to clear.

```tsx
function CartLineDiscountEditor({ discountType, discountValue, unitPrice, qty, onChange }) {
  const [open, setOpen] = useState(false);
  const [localType, setLocalType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [localValue, setLocalValue] = useState('');
  const gross = unitPrice * qty;
  const { discountAmount } = computeLineDiscount(unitPrice, qty, discountType, discountValue);
  const hasDiscount = discountType !== null;

  const apply = () => {
    const val = parseFloat(localValue);
    if (!isNaN(val) && val >= 0) onChange(localType, val);
    setOpen(false);
  };

  return (
    <div className="mt-1.5">
      {hasDiscount ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
          <Tag className="size-3" />
          <span>
            {discountType === 'percentage' ? `${discountValue}%` : formatCurrency(discountValue ?? 0)} off
            {' '}(−{formatCurrency(discountAmount)})
          </span>
          <button onClick={() => onChange(null, null)} className="hover:text-destructive">
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <Tag className="size-3" /> Add discount
        </button>
      )}
      {open && (
        <div className="mt-2 space-y-2 rounded-md border bg-background p-2 shadow-sm">
          <div className="flex gap-1">
            {(['percentage', 'fixed_amount'] as const).map((t) => (
              <button key={t} onClick={() => setLocalType(t)}
                className={cn('flex-1 rounded border px-2 py-1 text-xs',
                  localType === t ? 'bg-primary text-white border-primary' : '')}>
                {t === 'percentage' ? '% Off' : '₱ Off'}
              </button>
            ))}
          </div>
          <Input
            type="number" min="0" step={localType === 'percentage' ? '1' : '0.01'}
            max={localType === 'percentage' ? 100 : gross}
            value={localValue} onChange={(e) => setLocalValue(e.target.value)}
            placeholder={localType === 'percentage' ? '10' : '50.00'}
            className="h-7 text-xs" autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={apply}>Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5.7 Cart summary — discount row

```tsx
{totalDiscount > 0 && (
  <div className="flex items-center justify-between text-sm text-emerald-700">
    <span>Discount</span>
    <span>−{formatCurrency(totalDiscount)}</span>
  </div>
)}
```

### 5.8 Checkout payload

```typescript
items: cartLines.map((line) => ({
  variant_id: line.product.variant_id ?? 0,
  qty: line.qty,
  discount_type: line.discountType ?? undefined,
  discount_value: line.discountValue ?? undefined,
})),
```

### 5.9 TypeScript types (`pos.service.ts`)

```typescript
// PosCheckoutPayload.items
items: Array<{
  variant_id: number;
  qty: number;
  discount_type?: 'percentage' | 'fixed_amount' | null;
  discount_value?: number | null;
}>;

// PosCheckoutResponse.transaction
transaction: {
  // ...existing...
  discountAmount: number;  // NEW
};
```

### 5.10 Receipt snapshot updates

```typescript
interface ReceiptLineSnapshot {
  name: string; qty: number; unitPrice: number;
  discountAmount: number;  // NEW
  lineTotal: number;
}

interface ReceiptDisplayData {
  // ...existing...
  discountAmount: number;  // NEW
}
```

Build the snapshot in `handleCheckoutSubmit`:
```typescript
lines: cartLines.map((line) => {
  const { discountAmount, lineTotal } = computeLineDiscount(
    Number(line.product.price), line.qty, line.discountType, line.discountValue
  );
  return { name: line.product.name, qty: line.qty, unitPrice: Number(line.product.price), discountAmount, lineTotal };
}),
discountAmount: result.transaction.discountAmount,
```

Receipt dialog — show discount per line and in totals:
```tsx
{line.discountAmount > 0 && (
  <span className="text-xs text-emerald-700 ml-2">(−{formatCurrency(line.discountAmount)})</span>
)}
// ...in totals section:
{receiptDisplay.discountAmount > 0 && (
  <div className="flex items-center justify-between text-emerald-700">
    <span>Discount</span>
    <span>−{formatCurrency(receiptDisplay.discountAmount)}</span>
  </div>
)}
```

---

## 6. Validation & Business Rules

| Rule | Enforced at |
|---|---|
| Both `discount_type` + `discount_value` must be present together or both absent | Backend serializer |
| `discount_value` ≥ 0 | Serializer `min_value=0` |
| % discount input capped at 100 | Frontend `max="100"` input |
| Fixed discount cannot exceed line gross | `SalesTransactionItem.save()` clamps with `min()` |
| `amount_tendered` ≥ discounted `total_amount` | Unchanged — already in service |
| Non-cash payment must equal exact total | Unchanged |

---

## 7. Phased Execution Order

### Phase 1 — Backend (no breaking changes)
1. Write migration `0007` (4 new nullable/default columns)
2. Update `SalesTransactionItem.save()` with discount calc
3. Update `PosCheckoutItemSerializer` with optional discount fields
4. Update `create_and_complete_sale()` — pass fields, aggregate, include in response
5. Update `receipt_dual_write.py` — populate `ReceiptItem.discount_amount` + `Receipt.discount_amount`
6. Run migration, run existing tests

### Phase 2 — Frontend logic
7. Update `CartLine` interface + `addToCart`
8. Add `computeLineDiscount` helper
9. Update `subtotal` memo; add `totalDiscount` memo
10. Add `setLineDiscount` handler
11. Update checkout payload + TypeScript types

### Phase 3 — UI
12. Build `CartLineDiscountEditor` component
13. Wire editor into cart line cards
14. Add discount row to cart summary panel
15. Update checkout sheet Sale Summary
16. Update `ReceiptLineSnapshot` + `ReceiptDisplayData` interfaces
17. Update receipt build in `handleCheckoutSubmit`
18. Update receipt dialog to display discounts

### Phase 4 — QA
19. Regression: zero-discount sale still works end-to-end
20. Percentage discount on a single item
21. Fixed-amount discount on a single item
22. Mixed discounts across multiple items
23. Fixed discount > line price (clamping)
24. Receipt snapshot shows correct `discount_amount` in `ReceiptItem`
25. Non-cash payment with discounted total

---

## 8. Files Changed

### Backend
| File | Change |
|---|---|
| `pos/models.py` | +3 cols on `SalesTransactionItem`; +1 col on `SalesTransaction`; update `save()` |
| `pos/serializers.py` | Add optional discount fields to `PosCheckoutItemSerializer` |
| `pos/services.py` | Pass discount to item create; aggregate; response + `update_fields` |
| `pos/receipt_dual_write.py` | Populate `ReceiptItem.discount_amount`; `Receipt.discount_amount` |
| `pos/migrations/0007_*.py` | New migration |

### Frontend
| File | Change |
|---|---|
| `components/modules/pos/PosModulePage.tsx` | `CartLine`; helpers; memos; handlers; editor component; receipt build; receipt dialog |
| `services/modules/pos.service.ts` | `PosCheckoutPayload.items` + `PosCheckoutResponse.transaction.discountAmount` |

---

## 9. Future — Phase 2 Preset Discounts

Once inline is live, connecting the existing `Discount` model:

1. Add nullable `discount_code` FK on `SalesTransactionItem` → `Discount`
2. Expose `GET /api/pos/discounts/` (active records, `applies_to=item`)
3. Add "Select preset" option in `CartLineDiscountEditor` that auto-fills type/value
4. Increment `Discount.usage_count` in the service after checkout
5. Enforce `usage_limit`, date gates in the service

> [!NOTE]
> The `Discount` model already has `applies_to='item'` and `target_id` which can reference a `ProductVariant.id`. Phase 2 can auto-suggest applicable discounts when a product is added to cart.

> [!IMPORTANT]
> After running migration `0007`, all existing `SalesTransactionItem` rows will have `discount_amount=0`, `discount_type=NULL`. Historic reporting totals are completely unaffected.
