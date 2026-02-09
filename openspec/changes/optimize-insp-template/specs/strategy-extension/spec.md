# Capability: Strategy Dimension Extension

## MODIFIED Requirements

### Requirement: Enhanced Strategy Matching Dimensions
The strategy matching engine MUST support additional dimensions including Material Group and Customer.

#### Scenario: Matching by Material Group
- **GIVEN** an IQC event for a material belonging to "Group A"
- **WHEN** the system looks for an Inspection Scheme
- **THEN** it SHOULD consider strategies bound to "Group A"

#### Scenario: Matching by Customer
- **GIVEN** an OQC/FQC event for a specific "Customer X"
- **WHEN** the system looks for an Inspection Scheme
- **THEN** it SHOULD consider strategies bound to "Customer X"

### Requirement: IPQC Type Support
Strategies for IPQC MUST support binding to specific IPQC types (FAI, PATROL, LAI).

#### Scenario: FAI Specific Strategy
- **GIVEN** a first article inspection (FAI) event
- **WHEN** the system matches strategies
- **THEN** it SHOULD prioritize strategies specifically marked for `ipqcType = FAI`
