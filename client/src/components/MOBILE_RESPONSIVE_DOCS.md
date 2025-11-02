# Mobile Responsiveness Documentation

Complete guide to mobile-optimized components and best practices in WaShop.

## 📱 Overview

This documentation covers all mobile-responsive components, hooks, and patterns implemented to provide an excellent mobile experience.

---

## 🎯 Mobile Components

### 1. TouchButton

**Purpose**: Button optimized for touch with minimum 44x44px hit area

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'primary' | Button style: primary, secondary, outline, danger, success |
| size | string | 'md' | Size: sm (44px), md (48px), lg (52px) |
| loading | boolean | false | Show loading spinner |
| disabled | boolean | false | Disable button |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { TouchButton } from '../components/mobile';

<TouchButton variant="primary" size="md" onClick={handleClick}>
  Save Changes
</TouchButton>

<TouchButton variant="danger" loading>
  Deleting...
</TouchButton>
```

**Features**:
- Minimum 44x44px touch targets (WCAG compliant)
- Active scale animation (0.95)
- Built-in loading state with spinner
- Disabled state with opacity
- 5 variants with consistent styling

---

### 2. MobileFormField

**Purpose**: Mobile-optimized input with floating labels and better touch targets

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Field label (floats on focus) |
| type | string | 'text' | Input type |
| icon | Component | - | Icon component (react-icons) |
| error | string | - | Error message to display |
| helpText | string | - | Help text below field |
| value | string | - | Input value |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { MobileFormField } from '../components/mobile';
import { FiUser, FiMail } from 'react-icons/fi';

<MobileFormField
  label="Full Name"
  icon={FiUser}
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>

<MobileFormField
  label="Email"
  type="email"
  icon={FiMail}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  helpText="We'll never share your email"
/>
```

**Features**:
- Floating labels on focus/value
- Min 52px height for easy touch
- Optional leading icon
- Error states with red border
- Help text support
- Smooth animations

---

### 3. BottomSheet

**Purpose**: Mobile-native bottom sheet modal (iOS/Android style)

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | - | Control open/closed state |
| onClose | function | - | Close handler |
| title | string | - | Sheet title |
| height | string | 'auto' | Height: auto, half, full |
| children | ReactNode | - | Sheet content |

**Usage**:
```jsx
import { BottomSheet } from '../components/mobile';
import { useBottomSheet } from '../components/mobile/useMobileHooks';

const { isOpen, title, content, open, close } = useBottomSheet();

// Open sheet
open('Filter Products', <FilterContent />);

// JSX
<BottomSheet isOpen={isOpen} onClose={close} title={title} height="half">
  {content}
</BottomSheet>
```

**Features**:
- Backdrop with blur effect
- Drag handle indicator
- Smooth slide-in animation (300ms)
- Auto body scroll lock
- Responsive heights (auto/half/full)
- Rounded top corners

---

### 4. SwipeableCard

**Purpose**: Card with swipe-to-reveal actions (delete/edit)

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onDelete | function | - | Delete action handler |
| onEdit | function | - | Edit action handler |
| children | ReactNode | - | Card content |
| className | string | '' | Additional CSS classes |

**Usage**:
```jsx
import { SwipeableCard } from '../components/mobile';

<SwipeableCard
  onEdit={() => editItem(item.id)}
  onDelete={() => deleteItem(item.id)}
>
  <div className="p-4">
    <h3>{item.name}</h3>
    <p>{item.description}</p>
  </div>
</SwipeableCard>
```

**Features**:
- Swipe left to reveal actions
- Snap to action or reset
- 75px action buttons
- Smooth transform animations
- Touch pan enabled
- Edit (blue) and Delete (red) actions

---

### 5. MobileTable

**Purpose**: Responsive table that converts to cards on mobile

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| headers | array | - | Table header labels |
| data | array | - | Data array |
| renderRow | function | - | Row render function |
| keyExtractor | function | - | Extract unique key |

**Usage**:
```jsx
import { MobileTable } from '../components/mobile';

<MobileTable
  headers={['Product', 'Price', 'Stock', 'Actions']}
  data={products}
  keyExtractor={(item) => item.id}
  renderRow={(item, index, isMobile) =>
    isMobile ? (
      // Mobile card view
      <div>
        <h3>{item.name}</h3>
        <p>{item.price}</p>
      </div>
    ) : (
      // Desktop table row
      <tr>
        <td>{item.name}</td>
        <td>{item.price}</td>
      </tr>
    )
  }
/>
```

**Features**:
- Desktop: Standard table
- Mobile: Card grid
- Automatic responsive switching
- Custom render function
- Consistent styling

---

### 6. CollapsibleSection

**Purpose**: Accordion section to save mobile screen space

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Section title |
| icon | Component | - | Leading icon |
| defaultOpen | boolean | false | Initially open |
| children | ReactNode | - | Section content |

**Usage**:
```jsx
import { CollapsibleSection } from '../components/mobile';
import { FiSettings } from 'react-icons/fi';

<CollapsibleSection title="Account Settings" icon={FiSettings} defaultOpen>
  <p>Your account settings go here</p>
</CollapsibleSection>
```

**Features**:
- Smooth expand/collapse (300ms)
- Chevron rotation animation
- Min 56px touch target for header
- Optional leading icon
- Hover/active states

---

### 7. MobileFilters

**Purpose**: Touch-optimized filter panel

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| filters | array | - | Filter definitions |
| activeFilters | object | - | Active filter values |
| onFilterChange | function | - | Filter change handler |
| onClear | function | - | Clear all filters |

**Usage**:
```jsx
import { MobileFilters } from '../components/mobile';

const filters = [
  {
    key: 'category',
    label: 'Category',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Electronics', value: 'electronics' }
    ]
  }
];

<MobileFilters
  filters={filters}
  activeFilters={activeFilters}
  onFilterChange={(key, value) => setFilters({ ...activeFilters, [key]: value })}
  onClear={() => setFilters({})}
/>
```

**Features**:
- Pill-style buttons (44px min)
- Active state with checkmark
- Clear all button
- Wrap on overflow
- Touch-friendly spacing

---

### 8. PullToRefresh

**Purpose**: Pull-to-refresh gesture (native mobile pattern)

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onRefresh | async function | - | Refresh handler |
| children | ReactNode | - | Scrollable content |

**Usage**:
```jsx
import { PullToRefresh } from '../components/mobile';

const handleRefresh = async () => {
  await fetchNewData();
};

<PullToRefresh onRefresh={handleRefresh}>
  <div>Your scrollable content</div>
</PullToRefresh>
```

**Features**:
- Pull distance tracking
- 60px threshold to trigger
- Spinner animation on refresh
- Smooth transform animation
- Mobile-only activation

---

## 🪝 Mobile Hooks

### useSwipeGesture

**Purpose**: Detect swipe gestures in 4 directions

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| onSwipeLeft | function | - | Left swipe handler |
| onSwipeRight | function | - | Right swipe handler |
| onSwipeUp | function | - | Up swipe handler |
| onSwipeDown | function | - | Down swipe handler |
| threshold | number | 50 | Min distance in pixels |

**Returns**: Touch event handlers (onTouchStart, onTouchMove, onTouchEnd)

**Usage**:
```jsx
import { useSwipeGesture } from '../components/mobile/useMobileHooks';

const handlers = useSwipeGesture({
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  threshold: 100
});

<div {...handlers}>Swipe me!</div>
```

---

### useTouchGestures

**Purpose**: Advanced touch gesture tracking

**Returns**:
```javascript
{
  touchInfo: {
    isTouching: boolean,
    startX: number,
    startY: number,
    currentX: number,
    currentY: number,
    deltaX: number,
    deltaY: number,
    duration: number
  },
  handlers: {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
```

**Usage**:
```jsx
import { useTouchGestures } from '../components/mobile/useMobileHooks';

const { touchInfo, handlers } = useTouchGestures();

<div {...handlers}>
  {touchInfo.isTouching && (
    <p>Swiping {touchInfo.deltaX}px horizontally</p>
  )}
</div>
```

---

### useBottomSheet

**Purpose**: Manage bottom sheet state

**Returns**:
```javascript
{
  isOpen: boolean,
  content: ReactNode,
  title: string,
  open: (title, content) => void,
  close: () => void,
  toggle: () => void
}
```

**Usage**:
```jsx
import { useBottomSheet } from '../components/mobile/useMobileHooks';

const { isOpen, title, content, open, close } = useBottomSheet();

<button onClick={() => open('Title', <Content />)}>
  Open Sheet
</button>

<BottomSheet isOpen={isOpen} onClose={close} title={title}>
  {content}
</BottomSheet>
```

---

### useViewport

**Purpose**: Get viewport dimensions and breakpoints

**Returns**:
```javascript
{
  width: number,
  height: number,
  isMobile: boolean,      // < 768px
  isTablet: boolean,      // 768-1024px
  isDesktop: boolean,     // >= 1024px
  isSmallMobile: boolean  // < 480px
}
```

**Usage**:
```jsx
import { useViewport } from '../components/mobile/useMobileHooks';

const { isMobile, width } = useViewport();

{isMobile && <MobileView />}
{!isMobile && <DesktopView />}
```

---

### useLongPress

**Purpose**: Detect long press gesture

**Parameters**:
- `callback`: Function to call on long press
- `duration`: Long press duration in ms (default: 500)

**Returns**: Touch event handlers

**Usage**:
```jsx
import { useLongPress } from '../components/mobile/useMobileHooks';

const handlers = useLongPress(() => {
  alert('Long pressed!');
}, 800);

<button {...handlers}>Press and hold</button>
```

---

### useScrollLock

**Purpose**: Lock body scroll (for modals)

**Parameters**:
- `isLocked`: Boolean to control lock state

**Usage**:
```jsx
import { useScrollLock } from '../components/mobile/useMobileHooks';

const [modalOpen, setModalOpen] = useState(false);
useScrollLock(modalOpen);
```

---

### useSafeArea

**Purpose**: Get safe area insets for notched devices

**Returns**:
```javascript
{
  top: number,
  right: number,
  bottom: number,
  left: number
}
```

**Usage**:
```jsx
import { useSafeArea } from '../components/mobile/useMobileHooks';

const { top, bottom } = useSafeArea();

<div style={{ paddingTop: `${top}px`, paddingBottom: `${bottom}px` }}>
  Content
</div>
```

---

## 🎨 Enhanced Components

### Updated Navbar

**Mobile Enhancements**:
- Slide-out menu from right (80% width, max 384px)
- Backdrop with blur effect
- Touch-friendly links (52px min height)
- Auto-close on route change
- Escape key support
- Body scroll lock when open
- Active state animations

### Updated DashboardLayout

**Mobile Enhancements**:
- Bottom navigation bar (4 main items + More)
- Mobile header with logo and menu button
- Wider sidebar on mobile (288px vs 256px)
- User info in mobile sidebar header
- Auto-close sidebar on route change
- Smooth slide animations (300ms)
- Bottom spacing for bottom nav

---

## 📋 Mobile Best Practices

### Touch Targets
- **Minimum size**: 44x44px (iOS) or 48x48px (Android)
- **Recommended**: 48-52px for primary actions
- **Spacing**: 8px minimum between interactive elements

### Forms
✅ Use floating labels  
✅ Larger input height (52px minimum)  
✅ Proper input types (email, tel, url)  
✅ Show/hide password toggle  
✅ Error states with clear messaging  
✅ Autocomplete attributes  

### Navigation
✅ Bottom nav for 4-5 main actions  
✅ Hamburger menu for additional items  
✅ Slide-out menus (not push)  
✅ Backdrop to close  
✅ Swipe gestures where appropriate  

### Content
✅ Tables convert to cards on mobile  
✅ Collapsible sections to save space  
✅ Bottom sheets instead of modals  
✅ Pull-to-refresh for lists  
✅ Swipe actions on list items  

### Performance
✅ Lazy load images  
✅ Optimize touch event handlers  
✅ Use CSS transforms (hardware accelerated)  
✅ Debounce scroll events  
✅ Minimize repaints  

---

## 🚀 Integration Examples

### Complete Mobile Form

```jsx
import { TouchButton, MobileFormField } from '../components/mobile';
import { useState } from 'react';

const ProfileForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.updateProfile(formData);
      showSuccess('Profile updated!');
    } catch (error) {
      setErrors(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <MobileFormField
        label="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
      />
      
      <MobileFormField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
      />
      
      <MobileFormField
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        error={errors.phone}
      />

      <TouchButton
        type="submit"
        variant="primary"
        loading={loading}
        className="w-full"
      >
        Save Changes
      </TouchButton>
    </form>
  );
};
```

### Mobile Product List with Filters

```jsx
import {
  SwipeableCard,
  BottomSheet,
  MobileFilters,
  PullToRefresh
} from '../components/mobile';
import { useBottomSheet } from '../components/mobile/useMobileHooks';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const { isOpen, open, close } = useBottomSheet();

  const handleRefresh = async () => {
    const data = await api.getProducts(filters);
    setProducts(data);
  };

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
    showSuccess('Product deleted');
  };

  return (
    <div>
      <TouchButton onClick={() => open('Filters', <FilterContent />)}>
        Open Filters
      </TouchButton>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-3 mt-4">
          {products.map(product => (
            <SwipeableCard
              key={product.id}
              onDelete={() => handleDelete(product.id)}
              onEdit={() => navigate(`/edit/${product.id}`)}
            >
              <ProductCard product={product} />
            </SwipeableCard>
          ))}
        </div>
      </PullToRefresh>

      <BottomSheet isOpen={isOpen} onClose={close} title="Filters">
        <MobileFilters
          filters={filterOptions}
          activeFilters={filters}
          onFilterChange={(key, value) => {
            setFilters({ ...filters, [key]: value });
          }}
          onClear={() => setFilters({})}
        />
      </BottomSheet>
    </div>
  );
};
```

---

## 📦 Files Created

- `client/src/components/mobile/MobileComponents.jsx` - 8 mobile components
- `client/src/components/mobile/useMobileHooks.js` - 7 custom hooks
- `client/src/components/mobile/index.js` - Export file
- `client/src/pages/MobileResponsiveDemo.jsx` - Demo page
- `client/src/components/Navbar.jsx` - Enhanced for mobile
- `client/src/components/DashboardLayout.jsx` - Enhanced for mobile
- `client/src/components/MOBILE_RESPONSIVE_DOCS.md` - This documentation

---

## 🎯 Demo Page

Visit **`/demo/mobile-responsive`** (when logged in) to see:
- All 8 mobile components with live examples
- Interactive touch gestures
- Swipe detection demo
- Long press detection
- Pull-to-refresh example
- Bottom sheet modals
- Mobile form fields
- Responsive table/cards
- Collapsible sections
- Filter panels

---

## 📱 Testing Checklist

### Desktop (>= 1024px)
- [ ] Navbar shows full menu
- [ ] Dashboard sidebar always visible
- [ ] Tables show in table format
- [ ] Forms use standard layout

### Tablet (768-1024px)
- [ ] Responsive grid layouts
- [ ] Touch targets adequate
- [ ] Navigation accessible

### Mobile (< 768px)
- [ ] Navbar hamburger menu works
- [ ] Dashboard bottom nav visible
- [ ] Sidebar slides from left
- [ ] Tables convert to cards
- [ ] Forms use floating labels
- [ ] All touch targets >= 44px
- [ ] Swipe gestures work
- [ ] Bottom sheets open/close
- [ ] Pull-to-refresh functions

### Small Mobile (< 480px)
- [ ] Content fits without horizontal scroll
- [ ] Text remains readable
- [ ] Buttons stack vertically
- [ ] Images scale properly

---

## 🔧 Tailwind Breakpoints

```javascript
// Tailwind default breakpoints
sm: '640px'   // Small tablets
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops
2xl: '1536px' // Large desktops
```

**Usage**:
```jsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width mobile, half tablet, third desktop */}
</div>
```

---

Happy mobile development! 📱✨
