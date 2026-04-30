# React Effects Best Practices

> **Core Principle:** Effects are an escape hatch from the React paradigm. They let you "step outside" of React and synchronize your components with some external system. If there is no external system involved, you shouldn't need an Effect.

## When NOT to Use Effects

### 1. Transforming Data for Rendering

**❌ Don't use Effects to derive values from props/state:**

```tsx
// BAD: Unnecessary Effect
function TournamentCard({ tournament }) {
  const [statusLabel, setStatusLabel] = useState('');
  
  useEffect(() => {
    setStatusLabel(tournament.status.toUpperCase());
  }, [tournament.status]);
  
  return <span>{statusLabel}</span>;
}
```

**✅ Calculate during rendering:**

```tsx
// GOOD: Calculate during rendering
function TournamentCard({ tournament }) {
  const statusLabel = tournament.status.toUpperCase();
  
  return <span>{statusLabel}</span>;
}
```

### 2. Caching Expensive Calculations

**❌ Don't use Effects + state for caching:**

```tsx
// BAD: Effect for caching
function TeamList({ teams, filter }) {
  const [filteredTeams, setFilteredTeams] = useState([]);
  
  useEffect(() => {
    setFilteredTeams(teams.filter(t => t.name.includes(filter)));
  }, [teams, filter]);
  
  return <ul>{filteredTeams.map(...)}</ul>;
}
```

**✅ Use `useMemo` for expensive calculations:**

```tsx
// GOOD: useMemo for expensive operations
function TeamList({ teams, filter }) {
  const filteredTeams = useMemo(
    () => teams.filter(t => t.name.includes(filter)),
    [teams, filter]
  );
  
  return <ul>{filteredTeams.map(...)}</ul>;
}
```

**Note:** In this codebase, we use TanStack Query for server state, so data fetching doesn't need useMemo.

### 3. Resetting State When Props Change

**❌ Don't reset state in Effects:**

```tsx
// BAD: Resetting state in Effect
function EditTournamentForm({ tournament }) {
  const [name, setName] = useState(tournament.name);
  
  useEffect(() => {
    setName(tournament.name);
  }, [tournament.id]);
  
  return <input value={name} onChange={...} />;
}
```

**✅ Use the `key` prop to reset state:**

```tsx
// GOOD: Use key to reset component state
function TournamentEditor({ tournament }) {
  return (
    <EditTournamentForm 
      key={tournament.id} 
      tournament={tournament} 
    />
  );
}

function EditTournamentForm({ tournament }) {
  const [name, setName] = useState(tournament.name);
  // State resets automatically when tournament.id changes
  
  return <input value={name} onChange={...} />;
}
```

### 4. Handling User Events

**❌ Don't put event logic in Effects:**

```tsx
// BAD: Event logic in Effect
function CreateTeamButton({ onCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    if (isCreating) {
      onCreate().then(() => {
        showNotification('Team created!');
        setIsCreating(false);
      });
    }
  }, [isCreating, onCreate]);
  
  return <button onClick={() => setIsCreating(true)}>Create</button>;
}
```

**✅ Handle events in event handlers:**

```tsx
// GOOD: Event logic in event handler
function CreateTeamButton({ onCreate }) {
  const [isCreating, setIsCreating] = useState(false);
  
  const handleClick = async () => {
    setIsCreating(true);
    try {
      await onCreate();
      showNotification('Team created!');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <button onClick={handleClick} disabled={isCreating}>
      Create
    </button>
  );
}
```

### 5. Notifying Parent About State Changes

**❌ Don't sync state to parent in Effects:**

```tsx
// BAD: Notifying parent in Effect
function TeamSelect({ teams, onSelectionChange }) {
  const [selectedId, setSelectedId] = useState(null);
  
  useEffect(() => {
    const team = teams.find(t => t.id === selectedId);
    onSelectionChange(team);
  }, [selectedId, teams, onSelectionChange]);
  
  return <select onChange={e => setSelectedId(e.target.value)}>...</select>;
}
```

**✅ Update both in event handler:**

```tsx
// GOOD: Update both states in event handler
function TeamSelect({ teams, onSelectionChange }) {
  const handleChange = (e) => {
    const teamId = e.target.value;
    const team = teams.find(t => t.id === teamId);
    onSelectionChange(team);
  };
  
  return <select onChange={handleChange}>...</select>;
}
```

Or better, lift state up:

```tsx
// BEST: Lift state up
function TeamSelect({ teams, selectedId, onChange }) {
  return (
    <select value={selectedId} onChange={e => onChange(e.target.value)}>
      {teams.map(team => (
        <option key={team.id} value={team.id}>{team.name}</option>
      ))}
    </select>
  );
}
```

### 6. Chains of Computations

**❌ Don't chain Effects that set state:**

```tsx
// BAD: Chain of Effects
function TournamentProgress({ tournament }) {
  const [teams, setTeams] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    fetchTeams(tournament.id).then(setTeams);
  }, [tournament.id]);
  
  useEffect(() => {
    const filled = teams.filter(t => t.isComplete).length;
    setProgress(filled / teams.length);
  }, [teams]);
  
  useEffect(() => {
    setIsComplete(progress === 1);
  }, [progress]);
  
  useEffect(() => {
    if (isComplete) {
      notify('Tournament complete!');
    }
  }, [isComplete]);
}
```

**✅ Calculate everything during rendering or in event handlers:**

```tsx
// GOOD: Calculate during rendering
function TournamentProgress({ tournament }) {
  const { data: teams = [] } = useTeams(tournament.id);
  
  const progress = useMemo(() => {
    if (!teams.length) return 0;
    const filled = teams.filter(t => t.isComplete).length;
    return filled / teams.length;
  }, [teams]);
  
  const isComplete = progress === 1;
  
  // For side effects like notifications, use useEffect only for external sync
  useEffect(() => {
    if (isComplete) {
      notify('Tournament complete!');
    }
  }, [isComplete]);
  
  return <ProgressBar value={progress} />;
}
```

## When to ACTUALLY Use Effects

Effects are for synchronizing with external systems:

### 1. Connecting to External APIs

```tsx
// GOOD: Effect for browser API
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    
    function handleOffline() {
      setIsOnline(false);
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

### 2. Syncing with Non-React Widgets

```tsx
// GOOD: Effect for external widget
function ExternalChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Initialize external chart library
    chartInstance.current = new ExternalChartLibrary(chartRef.current);
    
    return () => {
      chartInstance.current?.destroy();
    };
  }, []);
  
  useEffect(() => {
    chartInstance.current?.update(data);
  }, [data]);
  
  return <div ref={chartRef} />;
}
```

### 3. Analytics (Component Display)

```tsx
// GOOD: Effect for analytics
function TournamentPage({ tournamentId }) {
  useEffect(() => {
    analytics.track('Tournament Viewed', { tournamentId });
  }, [tournamentId]);
  
  return <TournamentDetails id={tournamentId} />;
}
```

## In This Codebase

### Don't Use Effects For:

1. **Data fetching** - Use TanStack Query hooks (`useTournaments`, `useTeams`, etc.)
2. **Form submissions** - Handle in `onSubmit` event handlers
3. **Cache invalidation** - Let TanStack Query handle it
4. **Derived state** - Calculate during rendering
5. **Prop change resets** - Use `key` prop

### Use Effects For:

1. **Browser API subscriptions** - `window` events, `document` listeners
2. **External library integration** - Charts, maps, etc.
3. **Analytics tracking** - When component mounts/updates
4. **Manual DOM manipulation** - When necessary (rare in this codebase)

## Decision Tree

```
Do you need to synchronize with an external system?
├── No → Don't use an Effect
│   ├── Is it derived data? → Calculate during rendering
│   ├── Is it expensive? → Use useMemo
│   ├── Is it from user events? → Use event handlers
│   └── Is it resetting state? → Use key prop
└── Yes → Use an Effect
    ├── Browser API? → useEffect with cleanup
    ├── Non-React widget? → useEffect with ref
    └── Analytics? → useEffect
```

## Common Mistakes in This Codebase

### ❌ Fetching Data in Effects

```tsx
// DON'T DO THIS - We have TanStack Query
function BadComponent() {
  const [tournaments, setTournaments] = useState([]);
  
  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(setTournaments);
  }, []);
  
  return <List tournaments={tournaments} />;
}

// DO THIS INSTEAD
function GoodComponent() {
  const { data: tournaments } = useTournaments();
  return <List tournaments={tournaments} />;
}
```

### ❌ Setting State from Props in Effects

```tsx
// DON'T DO THIS
function BadForm({ tournament }) {
  const [name, setName] = useState('');
  
  useEffect(() => {
    setName(tournament.name);
  }, [tournament]);
}

// DO THIS INSTEAD
function GoodForm({ tournament }) {
  const [name, setName] = useState(tournament.name);
  // Or use key={tournament.id} on parent
}
```

### ❌ Notification Logic in Effects

```tsx
// DON'T DO THIS
function BadButton() {
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    if (isSuccess) {
      toast.success('Created!');
      setIsSuccess(false);
    }
  }, [isSuccess]);
  
  const handleClick = () => {
    createTournament().then(() => setIsSuccess(true));
  };
}

// DO THIS INSTEAD
function GoodButton() {
  const handleClick = async () => {
    await createTournament();
    toast.success('Created!');
  };
}
```

## Summary

| Scenario | Solution |
|----------|----------|
| Derived data | Calculate in render |
| Expensive calculation | `useMemo` |
| Reset state on prop change | `key` prop |
| User events | Event handlers |
| External system sync | `useEffect` |
| Data fetching | TanStack Query |
| Analytics | `useEffect` (mount only) |

## Resources

- [React Docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Docs: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
