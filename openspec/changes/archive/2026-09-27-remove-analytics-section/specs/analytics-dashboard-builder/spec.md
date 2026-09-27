## REMOVED Requirements

### Requirement: Analytics owns one anonymous board
**Reason**: The Analytics product surface and its persisted board are removed.
**Migration**: Existing board definitions are retained only in the timestamped SQLite backup.

### Requirement: Optional tabs scope one widget grid
**Reason**: Analytics tabs and widget grids no longer exist.
**Migration**: No replacement workflow is provided.

### Requirement: Widgets cover the maintained analytical catalog
**Reason**: Every Analytics widget and chart family is removed.
**Migration**: No replacement workflow is provided.

### Requirement: Queries operate on explicit current-data grains
**Reason**: The Analytics query model is removed with the section.
**Migration**: Existing organization data remains available through the maintained product surfaces and exports.

### Requirement: Filters are independent and global
**Reason**: Analytics filters are removed with the section.
**Migration**: Existing filter definitions are retained only in the timestamped SQLite backup.

### Requirement: Singleton Analytics UI is durable
**Reason**: Analytics UI State is removed from the exact State contract.
**Migration**: A saved Analytics active tab becomes Employees during the owned SQLite conversion.

### Requirement: Drill-down remains current and virtualized
**Reason**: Analytics drill-down is removed with its query results.
**Migration**: Employees remain directly searchable in the Employees section.

### Requirement: Tables and pivots are bounded and explicit
**Reason**: Analytics tables and pivots are removed.
**Migration**: Structured and template data remain available through Data Download.

### Requirement: Analytics queries are lazy, cancellable, and bounded
**Reason**: The Analytics Worker, client, query engine, and caches are removed.
**Migration**: No runtime query work remains to migrate.

### Requirement: Widget grids export locally to PNG
**Reason**: Analytics widget and board PNG export are removed.
**Migration**: Editor image export remains available for organization structures.
