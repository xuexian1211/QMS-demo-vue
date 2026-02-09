# Capability: Material Inspection Specification Synchronization

## ADDED Requirements

### Requirement: Automatic Material Specification Pull
When an Inspection Scheme is associated with a material through a strategy, the system MUST be able to automatically pull existing specifications for the scheme's items from the material master.

#### Scenario: Displaying Specs in Scheme
- **GIVEN** an Inspection Scheme with "Dimension A" item
- **AND** a strategy binding this scheme to "Material M"
- **WHEN** the engineer views the "Material Specs" tab
- **THEN** the system SHOULD show the `targetValue`, `USL`, and `LSL` for "Dimension A" of "Material M"

### Requirement: Bi-directional Specification Sync
Engineers MUST be able to edit material specifications within the Inspection Scheme and synchronize those changes back to the material archival data.

#### Scenario: Syncing to Material Master
- **GIVEN** an engineer has modified the `USL` for an item in the "Material Specs" tab
- **WHEN** they click "Sync to Material Master"
- **THEN** the system SHOULD update the corresponding record in the material specifications database
