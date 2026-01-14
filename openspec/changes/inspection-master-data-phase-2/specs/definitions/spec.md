# Spec: Phase 2 Consolidated Requirements

## ADDED Requirements

#### Requirement: Phenomenon-Cause Association
- [ ] Users can link multiple Defect Causes to a single Defect Phenomenon.
- [ ] Users can view associated Defect Causes when viewing a Defect Phenomenon detail or edit page.

#### Scenario: Linking Causes to Phenomenon
- Given I am on the "Associated Causes" tab of a Defect Phenomenon edit page
- When I click "Add Cause"
- And I select "Temperature Too High" and "Pressure Drop" from the selection modal
- Then these causes appear in the associated causes list
- And saving the phenomenon persists these relationships.

#### Requirement: Inspection Item-Defect Mapping
- [ ] Users can link multiple Defect Phenomena to a specific Inspection Item.

#### Scenario: Linking Defects to Inspection Item
- Given I am editing an Inspection Item
- When I allow associating Defect Phenomena
- Then I can select relevant defects (e.g., "Scratch", "Dent") that apply to this inspection item.

#### Requirement: Data Export
- [ ] Users can export the current list of data to a CSV or Excel file for all Basic Data and Master Data modules.

#### Scenario: Exporting Material Categories
- Given I am on the Material Category list page
- When I click the "Export" button
- Then a file containing the visible list data is downloaded.

#### Requirement: Batch Operations
- [ ] Users can perform batch actions (primarily Delete) on selected items in Basic Data module lists.

#### Scenario: Batch Deleting Production Teams
- Given I am on the Production Team list page
- When I select multiple teams via checkboxes
- And I click the "Delete" button
- Then I am prompted for confirmation
- And upon confirmation, the selected teams are removed represented by a success message.

#### Requirement: Advanced Search
- [ ] Users can perform searches using multiple criteria in a dedicated search area.

#### Scenario: Searching with Multiple Filters
- Given I am on the Defect Phenomenon list
- When I expand the Advanced Search panel
- And I filter by "Date Range" and "Severity"
- Then the list updates to show only matching records.
