# Loading States Documentation

Complete guide to skeleton loaders, loading indicators, and optimistic UI updates in WaZhop.

## 📦 Components

### Skeleton Loaders

#### 1. Base Skeleton

**Purpose**: Basic animated skeleton placeholder

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS classes |
| width | string/number | - | Width (e.g., '100px', 200) |
| height | string/number | - | Height (e.g., '50px', 100) |

**Usage**:
```jsx
import { Skeleton } from '../components/SkeletonLoader';

<Skeleton className="h-8 w-64" />
<Skeleton width="100%" height="50px" />
```

---

#### 2. SkeletonText

**Purpose**: Multi-line text skeleton

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| lines | number | 1 | Number of lines |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { SkeletonText } from '../components/SkeletonLoader';

<SkeletonText lines={3} />
```

---

#### 3. SkeletonCard

**Purpose**: Generic card with image and text

**Usage**:
```jsx
import { SkeletonCard } from '../components/SkeletonLoader';

<SkeletonCard />
```

---

#### 4. SkeletonProductCard

**Purpose**: Product card skeleton

**Usage**:
```jsx
import { SkeletonProductCard } from '../components/SkeletonLoader';

<SkeletonProductCard />
```

---

#### 5. SkeletonTable

**Purpose**: Full table skeleton

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rows | number | 5 | Number of rows |
| columns | number | 4 | Number of columns |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { SkeletonTable } from '../components/SkeletonLoader';

<SkeletonTable rows={10} columns={5} />
```

---

#### 6. SkeletonStatsCard

**Purpose**: Dashboard statistics card skeleton

**Usage**:
```jsx
import { SkeletonStatsCard } from '../components/SkeletonLoader';

<div className="grid grid-cols-4 gap-6">
  <SkeletonStatsCard />
  <SkeletonStatsCard />
  <SkeletonStatsCard />
  <SkeletonStatsCard />
</div>
```

---

#### 7. SkeletonProfile

**Purpose**: Profile/user information skeleton

**Usage**:
```jsx
import { SkeletonProfile } from '../components/SkeletonLoader';

<SkeletonProfile />
```

---

#### 8. SkeletonListItem

**Purpose**: List item skeleton

**Usage**:
```jsx
import { SkeletonListItem } from '../components/SkeletonLoader';

<div className="space-y-3">
  <SkeletonListItem />
  <SkeletonListItem />
  <SkeletonListItem />
</div>
```

---

#### 9. SkeletonForm

**Purpose**: Form loading skeleton

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| fields | number | 4 | Number of form fields |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { SkeletonForm } from '../components/SkeletonLoader';

<SkeletonForm fields={6} />
```

---

#### 10. SkeletonGrid

**Purpose**: Grid layout skeleton

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | number | 6 | Number of items |
| columns | number | 3 | Grid columns (1-6) |
| ItemComponent | Component | SkeletonCard | Component to render |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { SkeletonGrid, SkeletonProductCard } from '../components/SkeletonLoader';

<SkeletonGrid 
  items={9} 
  columns={3} 
  ItemComponent={SkeletonProductCard} 
/>
```

---

#### 11. SkeletonDashboard

**Purpose**: Complete dashboard loading state

**Usage**:
```jsx
import { SkeletonDashboard } from '../components/SkeletonLoader';

<SkeletonDashboard />
```

---

### Loading Indicators

#### 1. ButtonLoading

**Purpose**: Loading state for buttons

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | boolean | - | Loading state |
| loadingText | string | 'Loading...' | Text to show when loading |
| children | ReactNode | - | Button content |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { ButtonLoading } from '../components/LoadingStates';

<ButtonLoading
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
  className="btn-primary"
>
  Save Changes
</ButtonLoading>
```

---

#### 2. ContentLoading

**Purpose**: Loading wrapper for content areas

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | boolean | - | Loading state |
| error | Error | null | Error object |
| children | ReactNode | - | Content to display |
| loadingComponent | ReactNode | null | Custom loading UI |
| errorComponent | ReactNode | null | Custom error UI |
| emptyComponent | ReactNode | null | Custom empty state UI |
| data | any | null | Data to check for empty |
| isEmpty | boolean | false | Whether data is empty |

**Usage**:
```jsx
import { ContentLoading } from '../components/LoadingStates';
import { SkeletonTable } from '../components/SkeletonLoader';

<ContentLoading
  loading={loading}
  error={error}
  data={products}
  isEmpty={products.length === 0}
  loadingComponent={<SkeletonTable />}
  emptyComponent={<p>No products found</p>}
>
  <ProductList products={products} />
</ContentLoading>
```

---

#### 3. ProgressBar

**Purpose**: Visual progress indicator

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| progress | number | 0 | Progress percentage (0-100) |
| showPercentage | boolean | true | Show percentage text |
| color | string | 'bg-green-500' | Progress bar color |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { ProgressBar } from '../components/LoadingStates';

<ProgressBar progress={uploadProgress} />
<ProgressBar progress={75} color="bg-blue-500" />
```

---

#### 4. StepIndicator

**Purpose**: Multi-step process indicator

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| steps | Array | [] | Array of step names |
| currentStep | number | 0 | Current step index (0-based) |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { StepIndicator } from '../components/LoadingStates';

<StepIndicator
  steps={['Details', 'Payment', 'Confirm', 'Done']}
  currentStep={1}
/>
```

---

#### 5. PulseLoader

**Purpose**: Animated pulse dots

**Usage**:
```jsx
import { PulseLoader } from '../components/LoadingStates';

<PulseLoader />
```

---

#### 6. RefreshIndicator

**Purpose**: Pull-to-refresh indicator

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| refreshing | boolean | - | Refreshing state |
| onRefresh | Function | - | Refresh callback |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { RefreshIndicator } from '../components/LoadingStates';

<RefreshIndicator 
  refreshing={isRefreshing} 
  onRefresh={handleRefresh} 
/>
```

---

#### 7. InlineStatus

**Purpose**: Inline status with icon

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | string | 'loading' | Status: 'loading', 'success', 'error' |
| text | string | '' | Status text |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { InlineStatus } from '../components/LoadingStates';

<InlineStatus status="loading" text="Syncing..." />
<InlineStatus status="success" text="Saved" />
<InlineStatus status="error" text="Failed" />
```

---

#### 8. CardLoading

**Purpose**: Loading overlay for cards

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | boolean | - | Loading state |
| children | ReactNode | - | Card content |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { CardLoading } from '../components/LoadingStates';

<CardLoading loading={isSaving}>
  <div className="card">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</CardLoading>
```

---

## 🪝 Custom Hooks

### useOptimistic

**Purpose**: Manage optimistic UI updates with automatic rollback

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| data | Array | Current data array |
| isLoading | boolean | Loading state |
| error | Error | Error object |
| optimisticAdd | Function | Add item optimistically |
| optimisticUpdate | Function | Update item optimistically |
| optimisticDelete | Function | Delete item optimistically |
| resetData | Function | Reset data |
| setData | Function | Set data manually |

**Usage**:
```jsx
import { useOptimistic } from '../hooks/useOptimistic';
import api from '../utils/api';

const { 
  data: products, 
  optimisticAdd, 
  optimisticUpdate, 
  optimisticDelete 
} = useOptimistic([]);

// Add product
const handleAdd = async () => {
  await optimisticAdd(
    { name: 'New Product', price: 1000 },
    async (product) => {
      const result = await api.createProduct(product);
      return result.data;
    }
  );
};

// Update product
const handleUpdate = async (id) => {
  await optimisticUpdate(
    id,
    { name: 'Updated Name' },
    async (id, updates) => {
      const result = await api.updateProduct(id, updates);
      return result.data;
    }
  );
};

// Delete product
const handleDelete = async (id) => {
  await optimisticDelete(id, async (id) => {
    await api.deleteProduct(id);
  });
};
```

---

### useLoadingState

**Purpose**: Manage loading states for async operations

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| isLoading | boolean | Loading state |
| error | Error | Error object |
| data | any | Result data |
| execute | Function | Execute async function |
| reset | Function | Reset all states |
| setIsLoading | Function | Set loading manually |
| setError | Function | Set error manually |
| setData | Function | Set data manually |

**Usage**:
```jsx
import { useLoadingState } from '../hooks/useLoadingState';
import api from '../utils/api';

const { isLoading, error, data, execute } = useLoadingState();

const loadProducts = async () => {
  await execute(api.getProducts);
};

<ContentLoading loading={isLoading} error={error}>
  <ProductList products={data} />
</ContentLoading>
```

---

### useMultipleLoadingStates

**Purpose**: Manage multiple loading states

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| loadingStates | Object | Object with loading states for each key |
| setLoading | Function | Set loading for specific key |
| isAnyLoading | boolean | True if any loading |

**Usage**:
```jsx
import { useMultipleLoadingStates } from '../hooks/useLoadingState';

const { loadingStates, setLoading } = useMultipleLoadingStates([
  'products',
  'categories',
  'stats'
]);

const loadProducts = async () => {
  setLoading('products', true);
  await api.getProducts();
  setLoading('products', false);
};

{loadingStates.products && <SkeletonGrid />}
```

---

### useAsyncState

**Purpose**: Combined loading, data, and error state

**Usage**:
```jsx
import { useAsyncState } from '../hooks/useLoadingState';

const { isLoading, data, error, execute } = useAsyncState(api.getProducts);

useEffect(() => {
  execute();
}, []);
```

---

### useDebouncedLoading

**Purpose**: Show loading only after delay (prevent flashing)

**Usage**:
```jsx
import { useDebouncedLoading } from '../hooks/useLoadingState';

const { showLoading, startLoading, stopLoading } = useDebouncedLoading(300);

const loadData = async () => {
  startLoading();
  await api.getData();
  stopLoading();
};

{showLoading && <LoadingSpinner />}
```

---

## 🎯 Integration Examples

### Complete Product List with Loading

```jsx
import { useState, useEffect } from 'react';
import { ContentLoading } from '../components/LoadingStates';
import { SkeletonGrid, SkeletonProductCard } from '../components/SkeletonLoader';
import { handleApiError } from '../utils/errorHandler';
import api from '../utils/api';

const ProductList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.getProducts();
        setProducts(response.data);
      } catch (err) {
        setError(err);
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ContentLoading
      loading={loading}
      error={error}
      data={products}
      loadingComponent={
        <SkeletonGrid items={6} columns={3} ItemComponent={SkeletonProductCard} />
      }
    >
      <div className="grid grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </ContentLoading>
  );
};
```

---

### Form with Optimistic Updates

```jsx
import { useOptimistic } from '../hooks/useOptimistic';
import { ButtonLoading } from '../components/LoadingStates';
import { showSuccess, handleApiError } from '../utils/errorHandler';
import api from '../utils/api';

const ProductManager = () => {
  const { data: products, optimisticAdd, optimisticDelete } = useOptimistic([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (productData) => {
    setIsAdding(true);
    try {
      await optimisticAdd(productData, async (data) => {
        const result = await api.createProduct(data);
        return result.data;
      });
      showSuccess('Product added!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await optimisticDelete(id, async (id) => {
        await api.deleteProduct(id);
      });
      showSuccess('Product deleted!');
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div>
      <ButtonLoading
        loading={isAdding}
        loadingText="Adding..."
        onClick={() => handleAdd({ name: 'New Product' })}
        className="btn-primary"
      >
        Add Product
      </ButtonLoading>

      <div className="mt-6 space-y-3">
        {products.map(product => (
          <div key={product.id} className="flex justify-between p-4 bg-white rounded-lg">
            <span>{product.name}</span>
            {product.isOptimistic && (
              <span className="text-sm text-blue-600">Syncing...</span>
            )}
            <button onClick={() => handleDelete(product.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Dashboard with Multiple Loading States

```jsx
import { useState, useEffect } from 'react';
import { useMultipleLoadingStates } from '../hooks/useLoadingState';
import { SkeletonStatsCard, SkeletonTable } from '../components/SkeletonLoader';

const Dashboard = () => {
  const { loadingStates, setLoading } = useMultipleLoadingStates([
    'stats',
    'products',
    'orders'
  ]);

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      // Load stats
      setLoading('stats', true);
      const statsData = await api.getStats();
      setStats(statsData);
      setLoading('stats', false);

      // Load products
      setLoading('products', true);
      const productsData = await api.getProducts();
      setProducts(productsData);
      setLoading('products', false);

      // Load orders
      setLoading('orders', true);
      const ordersData = await api.getOrders();
      setOrders(ordersData);
      setLoading('orders', false);
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {loadingStates.stats ? (
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <SkeletonStatsCard key={i} />)}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* Products */}
      {loadingStates.products ? (
        <SkeletonTable />
      ) : (
        <ProductsTable products={products} />
      )}

      {/* Orders */}
      {loadingStates.orders ? (
        <SkeletonTable />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
};
```

---

## 📝 Best Practices

1. **Use skeleton loaders for initial data fetch**
   ```jsx
   {loading ? <SkeletonTable /> : <DataTable />}
   ```

2. **Use ButtonLoading for form submissions**
   ```jsx
   <ButtonLoading loading={isSubmitting}>Submit</ButtonLoading>
   ```

3. **Use ContentLoading wrapper for consistent loading UI**
   ```jsx
   <ContentLoading loading={loading} error={error}>
     <YourContent />
   </ContentLoading>
   ```

4. **Use optimistic updates for instant feedback**
   ```jsx
   const { optimisticUpdate } = useOptimistic(data);
   await optimisticUpdate(id, updates, apiCall);
   ```

5. **Match skeleton to actual content structure**
   - Use SkeletonProductCard for product grids
   - Use SkeletonTable for data tables
   - Use SkeletonStatsCard for dashboard stats

6. **Debounce loading for fast operations**
   ```jsx
   const { showLoading } = useDebouncedLoading(200);
   ```

7. **Show progress for long operations**
   ```jsx
   <ProgressBar progress={uploadProgress} />
   ```

---

## 🎨 Customization

All skeleton components use Tailwind's `animate-pulse` and can be customized:

```jsx
<Skeleton className="h-10 w-full bg-blue-200" />
<SkeletonCard className="border-2 border-gray-300" />
```

---

## 📦 Files Created

- `client/src/components/SkeletonLoader.jsx` - Skeleton components
- `client/src/components/LoadingStates.jsx` - Loading indicators
- `client/src/components/loadingStatesIndex.js` - Export file
- `client/src/hooks/useOptimistic.js` - Optimistic updates hook
- `client/src/hooks/useLoadingState.js` - Loading state hooks
- `client/src/pages/LoadingStatesExamples.jsx` - Demo page
- `client/src/components/LOADING_STATES_DOCS.md` - This documentation

---

## 🚀 Demo Page

Visit **`/demo/loading-states`** (when logged in) to see:
- Live examples of all skeleton loaders
- Working loading indicators
- Optimistic UI updates in action
- Interactive demos

Happy coding! 🎉
