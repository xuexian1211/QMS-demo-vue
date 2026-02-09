# Capability: Inspection Scheme Layout Redesign

## ADDED Requirements

### Requirement: 4-Tab Layout for Inspection Scheme Editor
The Inspection Scheme editor MUST use a master-detail layout where basic information is displayed at the top, and detailed configurations are organized into four tabs at the bottom.

#### Scenario: Navigating Tabs
- **GIVEN** an engineer is editing an Inspection Scheme
- **WHEN** they view the detail section
- **THEN** they SHOULD see four tabs: "Inspection Items", "Defect Binding", "Strategy Binding", and "Material Specs"

### Requirement: Multi-Organization Support
Every Inspection Scheme and its associated configurations MUST be associated with a specific `orgId`.

#### Scenario: Data Isolation
- **GIVEN** two different organizations (Org A and Org B)
- **WHEN** an engineer from Org A views schemes
- **THEN** they SHOULD only see schemes where `orgId` matches Org A
