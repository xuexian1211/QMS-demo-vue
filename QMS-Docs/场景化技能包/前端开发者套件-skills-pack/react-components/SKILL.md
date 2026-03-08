---
name: react-components
description: |
  React 组件开发专家。
  精通 Hooks、状态管理和组件设计模式。
---

# React Components

React 组件开发和架构最佳实践。

## Core Principles

### Component Design

1. **Single Responsibility**
   - Each component should have one primary responsibility
   - Break down complex components into smaller, focused ones
   - Prefer composition over inheritance

2. **Props Interface**
   - Define clear TypeScript interfaces for props
   - Use descriptive prop names that indicate purpose
   - Provide default props for optional values

3. **State Management**
   - Use `useState` for local component state
   - Lift state up when needed by multiple components
   - Use context for global state that doesn't change frequently

### Hooks Best Practices

1. **useState**
   ```tsx
   const [state, setState] = useState(initialValue);
   // Always use the setter function, never mutate state directly
   setState(newValue);
   setState(prev => newValue);
   ```

2. **useEffect**
   ```tsx
   useEffect(() => {
     // Side effects here
     return () => {
       // Cleanup
     };
   }, [dependencies]); // Only re-run when dependencies change
   ```

3. **useCallback** and **useMemo**
   - Use `useCallback` for functions passed as props
   - Use `useMemo` for expensive computations
   - Don't optimize prematurely

### Performance Optimization

1. **React.memo**
   ```tsx
   const MemoizedComponent = React.memo(Component);
   ```

2. **Code Splitting**
   ```tsx
   const LazyComponent = lazy(() => import('./Component'));
   ```

3. **Virtualization** for long lists
   - Use `react-window` or `react-virtualized`

## Common Patterns

### Compound Components
```tsx
// Parent manages state, children are sub-components
const Menu = ({ children }) => <div>{children}</div>;
Menu.Item = ({ children }) => <div>{children}</div>;
```

### Render Props
```tsx
<DataProvider render={data => <ChildComponent data={data} />} />
```

### Custom Hooks
```tsx
const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
};
```

## Resources

- [React Docs](https://react.dev)
- [TypeScript React CheatSheet](https://react-typescript-cheatsheet.netlify.app)
