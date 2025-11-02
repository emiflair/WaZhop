# Mobile Components Quick Reference

## 🚀 Quick Import

```javascript
// All mobile components
import {
  TouchButton,
  MobileFormField,
  BottomSheet,
  SwipeableCard,
  MobileTable,
  CollapsibleSection,
  MobileFilters,
  PullToRefresh,
} from '../components/mobile';

// All mobile hooks
import {
  useSwipeGesture,
  useTouchGestures,
  useBottomSheet,
  useViewport,
  useLongPress,
  useScrollLock,
  useSafeArea,
} from '../components/mobile/useMobileHooks';
```

---

## 📱 Component Cheat Sheet

### TouchButton
```jsx
<TouchButton variant="primary" size="md" loading={isLoading}>
  Save
</TouchButton>
```
**Variants**: primary, secondary, outline, danger, success  
**Sizes**: sm (44px), md (48px), lg (52px)

---

### MobileFormField
```jsx
<MobileFormField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helpText="Optional help text"
/>
```
**Features**: Floating labels, icons, error states

---

### BottomSheet
```jsx
const { isOpen, open, close } = useBottomSheet();

<button onClick={() => open('Title', <Content />)}>Open</button>

<BottomSheet isOpen={isOpen} onClose={close} title="Title">
  {content}
</BottomSheet>
```
**Heights**: auto, half, full

---

### SwipeableCard
```jsx
<SwipeableCard
  onEdit={() => edit(item.id)}
  onDelete={() => delete(item.id)}
>
  <YourContent />
</SwipeableCard>
```
**Swipe left** to reveal Edit (blue) and Delete (red) actions

---

### MobileTable
```jsx
<MobileTable
  headers={['Name', 'Price', 'Actions']}
  data={items}
  keyExtractor={(item) => item.id}
  renderRow={(item, idx, isMobile) => 
    isMobile ? <MobileCard /> : <TableRow />
  }
/>
```
**Responsive**: Table on desktop, cards on mobile

---

### CollapsibleSection
```jsx
<CollapsibleSection title="Settings" icon={FiSettings} defaultOpen>
  <SettingsForm />
</CollapsibleSection>
```
**Touch target**: 56px min height

---

### MobileFilters
```jsx
const filters = [{
  key: 'category',
  label: 'Category',
  options: [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' }
  ]
}];

<MobileFilters
  filters={filters}
  activeFilters={activeFilters}
  onFilterChange={(key, val) => setFilters({...filters, [key]: val})}
  onClear={() => setFilters({})}
/>
```
**Pill buttons**: 44px min, checkmark on active

---

### PullToRefresh
```jsx
<PullToRefresh onRefresh={async () => await fetchData()}>
  <YourContent />
</PullToRefresh>
```
**Threshold**: 60px pull distance

---

## 🪝 Hook Cheat Sheet

### useSwipeGesture
```jsx
const handlers = useSwipeGesture({
  onSwipeLeft: () => console.log('Left'),
  onSwipeRight: () => console.log('Right'),
  threshold: 100
});

<div {...handlers}>Swipe me</div>
```

---

### useBottomSheet
```jsx
const { isOpen, title, content, open, close, toggle } = useBottomSheet();

open('Title', <Content />);
close();
```

---

### useViewport
```jsx
const { width, height, isMobile, isTablet, isDesktop } = useViewport();

{isMobile && <MobileView />}
```
**Breakpoints**: < 768px = mobile, 768-1024px = tablet, >= 1024px = desktop

---

### useLongPress
```jsx
const handlers = useLongPress(() => alert('Long press!'), 800);

<button {...handlers}>Press and hold</button>
```

---

### useScrollLock
```jsx
const [modalOpen, setModalOpen] = useState(false);
useScrollLock(modalOpen); // Locks body scroll when true
```

---

## 🎨 Tailwind Responsive Classes

```jsx
// Mobile first approach
<div className="
  w-full          // Mobile: 100% width
  md:w-1/2        // Tablet: 50% width
  lg:w-1/3        // Desktop: 33% width
">

// Hide/show based on screen size
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  
// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

---

## ✅ Mobile Checklist

### Touch Targets
- [ ] All buttons >= 44px (iOS) or 48px (Android)
- [ ] 8px minimum spacing between interactive elements
- [ ] Active/pressed states visible

### Forms
- [ ] Floating labels implemented
- [ ] Input height >= 52px
- [ ] Correct input types (email, tel, url, number)
- [ ] Error states with clear messages
- [ ] Help text where needed

### Navigation
- [ ] Bottom nav for main actions (4-5 items)
- [ ] Hamburger menu for additional items
- [ ] Slide-out menus (not push)
- [ ] Auto-close on route change

### Content
- [ ] Tables convert to cards on mobile
- [ ] Collapsible sections used
- [ ] Bottom sheets instead of modals
- [ ] Images scaled/optimized
- [ ] Text readable without zoom

### Gestures
- [ ] Swipe actions where appropriate
- [ ] Pull-to-refresh on lists
- [ ] Long press for context menus
- [ ] Pinch-to-zoom disabled (user-scalable=no)

### Performance
- [ ] Lazy load images
- [ ] Debounce scroll events
- [ ] Use CSS transforms for animations
- [ ] Minimize JavaScript on scroll

---

## 📦 File Structure

```
client/src/
├── components/
│   ├── mobile/
│   │   ├── MobileComponents.jsx    # 8 components
│   │   ├── useMobileHooks.js       # 7 hooks
│   │   └── index.js                # Exports
│   ├── Navbar.jsx                  # Enhanced for mobile
│   ├── DashboardLayout.jsx         # Enhanced for mobile
│   ├── MOBILE_RESPONSIVE_DOCS.md   # Full docs
│   └── MOBILE_QUICK_REFERENCE.md   # This file
└── pages/
    └── MobileResponsiveDemo.jsx    # Demo page
```

---

## 🔗 Resources

- **Demo Page**: `/demo/mobile-responsive`
- **Full Documentation**: `MOBILE_RESPONSIVE_DOCS.md`
- **Tailwind Docs**: https://tailwindcss.com/docs/responsive-design
- **Touch Target Size**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html

---

## 🎯 Common Patterns

### Mobile-First Form
```jsx
<form className="space-y-6 max-w-md mx-auto">
  <MobileFormField label="Name" value={name} onChange={...} />
  <MobileFormField label="Email" type="email" value={email} onChange={...} />
  <TouchButton type="submit" variant="primary" className="w-full">
    Submit
  </TouchButton>
</form>
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Mobile List with Actions
```jsx
<div className="space-y-3">
  {items.map(item => (
    <SwipeableCard
      key={item.id}
      onEdit={() => edit(item)}
      onDelete={() => remove(item)}
    >
      <ListItem {...item} />
    </SwipeableCard>
  ))}
</div>
```

### Bottom Sheet with Filters
```jsx
const FilterSheet = () => {
  const { isOpen, open, close } = useBottomSheet();
  const [filters, setFilters] = useState({});

  return (
    <>
      <TouchButton onClick={() => open('Filter', <Filters />)}>
        Filters
      </TouchButton>
      
      <BottomSheet isOpen={isOpen} onClose={close} title="Filters">
        <MobileFilters
          filters={filterConfig}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters({...filters, [k]: v})}
          onClear={() => setFilters({})}
        />
      </BottomSheet>
    </>
  );
};
```

---

**Pro Tip**: Test on real devices! Chrome DevTools mobile emulation is good, but nothing beats testing on actual iOS and Android devices.

Happy mobile coding! 📱✨
